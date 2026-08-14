import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import {
  addWaiterRequestToStore,
  getWaiterRequestsFromStore,
  updateWaiterRequestInStoreConditional,
} from '@/lib/waiterRequestsStore';
import { WaiterRequest, WaiterRequestType, WaiterRequestStatus } from '@/types/waiter';

export async function GET(request: Request) {
  try {
    const supabase = createAdminSupabaseClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'ALL';
    const tableCode = searchParams.get('table_code');

    // 1. Fetch from Supabase DB
    let query = supabase.from('waiter_requests').select('*').order('created_at', { ascending: false });

    if (tableCode) {
      query = query.eq('table_code', tableCode);
    }
    if (status && status !== 'ALL') {
      query = query.eq('status', status);
    }

    const { data: dbRequests, error } = await query;

    if (error) {
      console.warn('Supabase waiter requests fetch warning:', error.message);
    }

    // 2. Merge with in-memory store for resilience
    const memoryRequests = getWaiterRequestsFromStore(status, tableCode || undefined);
    const dbIds = new Set((dbRequests || []).map((r) => r.id));
    const memoryOnly = memoryRequests.filter((r) => !dbIds.has(r.id));

    const finalRequests = [...(dbRequests || []), ...memoryOnly];

    return NextResponse.json({
      success: true,
      requests: finalRequests,
    });
  } catch (err: any) {
    console.error('Error fetching waiter requests:', err);
    return NextResponse.json(
      { success: false, error: err.message, requests: getWaiterRequestsFromStore() },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { table_code, request_type, notes } = body;

    if (!table_code) {
      return NextResponse.json(
        { error: 'Nomor meja (table_code) wajib disertakan.' },
        { status: 400 }
      );
    }

    const normalizedType: WaiterRequestType =
      request_type === 'BILL' ? 'BILL' : request_type === 'LAINNYA' ? 'LAINNYA' : 'BANTUAN';

    const cleanTableCode = String(table_code).padStart(2, '0');
    const supabase = createAdminSupabaseClient();

    // 1. Prevent duplicate active request for the same table & type (Authoritative DB check)
    const { data: existingDbRequest } = await supabase
      .from('waiter_requests')
      .select('*')
      .eq('table_code', cleanTableCode)
      .eq('request_type', normalizedType)
      .in('status', ['OPEN', 'HANDLED'])
      .maybeSingle();

    if (existingDbRequest) {
      return NextResponse.json({
        success: true,
        request: existingDbRequest,
        isDuplicate: true,
        message: 'Permintaan bantuan Anda sedang dalam antrean staf waiter.',
      });
    }

    // 2. Resolve table UUID from tables table with fallback auto-create for valid foreign key
    let resolvedTableId: string = '';
    const { data: tableData } = await supabase
      .from('tables')
      .select('id')
      .eq('code', cleanTableCode)
      .maybeSingle();

    if (tableData?.id) {
      resolvedTableId = tableData.id;
    } else {
      const newTableId = crypto.randomUUID();
      const { data: createdTable } = await supabase
        .from('tables')
        .insert({
          id: newTableId,
          code: cleanTableCode,
          name: `MEJA ${cleanTableCode}`,
          area: 'Indoor AC',
          is_active: true,
          status: 'KOSONG',
        })
        .select('id')
        .maybeSingle();

      resolvedTableId = createdTable ? createdTable.id : newTableId;
    }

    const newRequest: WaiterRequest = {
      id: crypto.randomUUID(),
      table_id: resolvedTableId,
      table_code: cleanTableCode,
      request_type: normalizedType,
      status: 'OPEN',
      notes: notes || (normalizedType === 'BILL' ? 'Customer meminta tagihan bill di meja.' : 'Customer memanggil waiter untuk bantuan.'),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 3. Insert into Supabase DB
    const { data: insertedDb, error: insertError } = await supabase
      .from('waiter_requests')
      .insert({
        id: newRequest.id,
        table_id: newRequest.table_id,
        table_code: newRequest.table_code,
        request_type: newRequest.request_type,
        status: newRequest.status,
        notes: newRequest.notes,
        created_at: newRequest.created_at,
        updated_at: newRequest.updated_at,
      })
      .select()
      .maybeSingle();

    if (insertError) {
      console.warn('Supabase waiter request insert warning:', insertError.message);
    }

    // 4. Insert into in-memory store
    addWaiterRequestToStore(newRequest);

    return NextResponse.json({
      success: true,
      request: insertedDb || newRequest,
      message: 'Panggilan waiter berhasil dikirim. Staf kami segera menuju mejamu.',
    });
  } catch (err: any) {
    console.error('Error creating waiter request:', err);
    return NextResponse.json(
      { error: 'Gagal mengirim panggilan waiter: ' + err.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { request_id, status, expected_current_status, handled_by } = body;

    if (!request_id || !status) {
      return NextResponse.json(
        { error: 'Request ID dan status wajib disertakan.' },
        { status: 400 }
      );
    }

    const nextStatus = status as WaiterRequestStatus;
    const expectedStatus = expected_current_status as WaiterRequestStatus;

    // Strict Lifecycle Rules: OPEN -> HANDLED -> COMPLETED
    if (nextStatus === 'HANDLED' && expectedStatus !== 'OPEN') {
      return NextResponse.json(
        { error: 'Hanya panggilan berstatus OPEN yang dapat ditangani (HANDLED).' },
        { status: 400 }
      );
    }

    if (nextStatus === 'COMPLETED' && expectedStatus !== 'HANDLED' && expectedStatus !== 'OPEN') {
      return NextResponse.json(
        { error: 'Panggilan harus berstatus HANDLED atau OPEN sebelum diselesaikan (COMPLETED).' },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();

    // 1. Check current status from DB
    const { data: currentDbRequest } = await supabase
      .from('waiter_requests')
      .select('status')
      .eq('id', request_id)
      .maybeSingle();

    if (currentDbRequest && expectedStatus && currentDbRequest.status !== expectedStatus) {
      return NextResponse.json(
        {
          success: false,
          error: 'Panggilan ini telah diperbarui oleh staf waiter lain.',
          code: 'CONCURRENCY_CONFLICT',
          current_status: currentDbRequest.status,
        },
        { status: 409 }
      );
    }

    // 2. Build update payload
    const updatePayload: any = {
      status: nextStatus,
      updated_at: new Date().toISOString(),
    };

    if (nextStatus === 'HANDLED') {
      updatePayload.handled_by = handled_by || 'Waiter Staf';
      updatePayload.handled_at = new Date().toISOString();
    } else if (nextStatus === 'COMPLETED') {
      updatePayload.completed_at = new Date().toISOString();
    }

    // 3. Atomic conditional update in Supabase PostgreSQL (Single Source of Truth)
    let dbQuery = supabase.from('waiter_requests').update(updatePayload).eq('id', request_id);
    if (expectedStatus) {
      dbQuery = dbQuery.eq('status', expectedStatus);
    }
    const { data: updatedDb, error } = await dbQuery.select().maybeSingle();

    // If expectedStatus was required and 0 rows updated in PostgreSQL -> 409 CONFLICT
    if (expectedStatus && !updatedDb) {
      return NextResponse.json(
        {
          success: false,
          error: 'Panggilan ini telah diperbarui oleh staf waiter lain.',
          code: 'CONCURRENCY_CONFLICT',
          current_status: currentDbRequest?.status,
        },
        { status: 409 }
      );
    }

    // 4. Synchronize memory store mirror
    if (expectedStatus) {
      updateWaiterRequestInStoreConditional(request_id, updatePayload, expectedStatus);
    }

    if (error) {
      console.warn('Supabase request update warning:', error.message);
    }

    return NextResponse.json({
      success: true,
      request: updatedDb || { id: request_id, ...updatePayload },
    });
  } catch (err: any) {
    console.error('Error updating waiter request:', err);
    return NextResponse.json(
      { error: 'Gagal memperbarui status panggilan: ' + err.message },
      { status: 500 }
    );
  }
}
