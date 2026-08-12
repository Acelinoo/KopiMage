import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { VALID_TABLES_REGISTRY as defaultTables } from '@/types/table';

let inMemoryTablesStore: any[] = [];

export async function GET() {
  try {
    const supabase = createAdminSupabaseClient();

    const { data: dbTables, error } = await supabase
      .from('tables')
      .select('*')
      .order('code');

    if (!error && dbTables) {
      const dbCodes = new Set(dbTables.map((t) => t.code || t.id));
      const customAdded = inMemoryTablesStore.filter((t) => !dbCodes.has(t.code || t.id));
      return NextResponse.json({ success: true, tables: [...dbTables, ...customAdded] });
    }

    return NextResponse.json({ success: true, tables: inMemoryTablesStore });
  } catch (err: any) {
    console.error('Error fetching tables:', err);
    return NextResponse.json(
      { success: false, error: err.message, tables: inMemoryTablesStore },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, name, area } = body;

    if (!code) {
      return NextResponse.json({ error: 'Kode meja wajib diisi.' }, { status: 400 });
    }

    const tableCode = String(code).padStart(2, '0');
    const tableName = name || `MEJA ${tableCode}`;
    const tableArea = area || 'Indoor AC';

    const newTable = {
      id: `table_${tableCode}_${Date.now()}`,
      code: tableCode,
      name: tableName,
      area: tableArea,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    // Add to in-memory store
    const existingIdx = inMemoryTablesStore.findIndex((t) => t.code === tableCode || t.id === tableCode);
    if (existingIdx >= 0) {
      inMemoryTablesStore[existingIdx] = newTable;
    } else {
      inMemoryTablesStore.push(newTable);
    }

    const supabase = createAdminSupabaseClient();
    const { data: inserted, error } = await supabase
      .from('tables')
      .insert([
        {
          code: tableCode,
          name: tableName,
          area: tableArea,
          is_active: true,
        },
      ])
      .select();

    if (error) {
      console.warn('Supabase table insert warning:', error.message);
    }

    return NextResponse.json({
      success: true,
      table: inserted && inserted.length > 0 ? inserted[0] : newTable,
      allTables: inMemoryTablesStore,
    });
  } catch (err: any) {
    console.error('Error adding table:', err);
    return NextResponse.json({ error: 'Gagal menambah meja: ' + err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const isClearAll = searchParams.get('all') === 'true';

    const supabase = createAdminSupabaseClient();

    if (isClearAll) {
      inMemoryTablesStore = [];
      await supabase.from('tables').delete().neq('id', '0');
      return NextResponse.json({ success: true, message: 'Semua meja berhasil dihapus.', allTables: [] });
    }

    if (!id) {
      return NextResponse.json({ error: 'ID meja wajib diisi.' }, { status: 400 });
    }

    inMemoryTablesStore = inMemoryTablesStore.filter((t) => t.id !== id && t.code !== id);
    await supabase.from('tables').delete().eq('id', id);

    return NextResponse.json({ success: true, deletedId: id, allTables: inMemoryTablesStore });
  } catch (err: any) {
    console.error('Error deleting table:', err);
    return NextResponse.json({ error: 'Gagal menghapus meja: ' + err.message }, { status: 500 });
  }
}
