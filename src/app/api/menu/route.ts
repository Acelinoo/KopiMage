import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { MENU_ITEMS as defaultMenuItems } from '@/data/menuData';

// Persistent server-side in-memory store for custom menu items
let inMemoryMenuItemsStore: any[] = [];

export async function GET() {
  try {
    const supabase = createAdminSupabaseClient();

    // Fetch live menu items from Supabase database
    const { data: dbItems, error } = await supabase
      .from('menu_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && dbItems) {
      const dbIds = new Set(dbItems.map((i) => i.id));
      const customAdded = inMemoryMenuItemsStore.filter((i) => !dbIds.has(i.id));
      const mergedMenu = [...dbItems, ...customAdded];
      return NextResponse.json({ success: true, menu: mergedMenu });
    }

    return NextResponse.json({ success: true, menu: inMemoryMenuItemsStore });
  } catch (err: any) {
    console.error('Error fetching menu items:', err);
    return NextResponse.json(
      { success: false, error: err.message, menu: inMemoryMenuItemsStore },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, category, price, base_price, description, image, temperature } = body;

    if (!name || !price) {
      return NextResponse.json(
        { error: 'Nama menu dan harga wajib diisi.' },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();
    const numPrice = base_price || parseInt(String(price).replace(/[^0-9]/g, '')) || 25000;
    const formattedPrice = `Rp ${numPrice.toLocaleString('id-ID')}`;

    const newMenuItem = {
      id: body.id || `menu_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      name,
      category: category || 'coffee',
      price: formattedPrice,
      base_price: numPrice,
      description: description || 'Racikan khas berkualitas disajikan hangat di KOPIMAGE.',
      image: image || '/images/kopimage_hero_atmosphere_1786480906850.png',
      temperature: temperature || 'Hot / Ice',
      is_available: true,
      created_at: new Date().toISOString(),
    };

    // Add to in-memory store immediately
    inMemoryMenuItemsStore.unshift(newMenuItem);

    // Try inserting into Supabase DB
    const { data: inserted, error } = await supabase
      .from('menu_items')
      .insert([newMenuItem])
      .select()
      .single();

    if (error) {
      console.warn('Supabase insert menu warning:', error.message);
    }

    return NextResponse.json({
      success: true,
      menuItem: inserted || newMenuItem,
      allMenu: inMemoryMenuItemsStore,
    });
  } catch (err: any) {
    console.error('Error creating menu item:', err);
    return NextResponse.json(
      { error: 'Gagal menambah menu: ' + err.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, category, price, base_price, description, image, temperature, is_available } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID menu wajib diisi.' }, { status: 400 });
    }

    const supabase = createAdminSupabaseClient();
    const numPrice = base_price || parseInt(String(price).replace(/[^0-9]/g, '')) || 25000;
    const formattedPrice = `Rp ${numPrice.toLocaleString('id-ID')}`;

    const updatePayload: any = {
      name,
      category,
      price: formattedPrice,
      base_price: numPrice,
      description,
      image: image || '/images/kopimage_hero_atmosphere_1786480906850.png',
      temperature,
    };

    if (is_available !== undefined) {
      updatePayload.is_available = is_available;
    }

    // Update in-memory store immediately
    inMemoryMenuItemsStore = inMemoryMenuItemsStore.map((m) =>
      m.id === id ? { ...m, ...updatePayload } : m
    );

    const { data: updated, error } = await supabase
      .from('menu_items')
      .update(updatePayload)
      .eq('id', id)
      .select();

    if (error) {
      console.warn('Supabase update menu warning:', error.message);
    }

    return NextResponse.json({
      success: true,
      menuItem: updated && updated.length > 0 ? updated[0] : { id, ...updatePayload },
      allMenu: inMemoryMenuItemsStore,
    });
  } catch (err: any) {
    console.error('Error updating menu item:', err);
    return NextResponse.json(
      { error: 'Gagal memperbarui menu: ' + err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const isClearAll = searchParams.get('all') === 'true';

    const supabase = createAdminSupabaseClient();

    if (isClearAll) {
      inMemoryMenuItemsStore = [];
      const zeroUuid = '00000000-0000-0000-0000-000000000000';
      await supabase.from('order_items').delete().neq('id', zeroUuid);
      await supabase.from('menu_items').delete().neq('name', '___NEVER_EXIST___');
      return NextResponse.json({ success: true, message: 'Semua menu berhasil dihapus dari database.', allMenu: [] });
    }

    if (!id) {
      return NextResponse.json({ error: 'ID menu wajib diisi.' }, { status: 400 });
    }

    // Remove from in-memory store immediately
    inMemoryMenuItemsStore = inMemoryMenuItemsStore.filter((m) => m.id !== id);
    const { error } = await supabase.from('menu_items').delete().eq('id', id);

    if (error) {
      console.warn('Supabase delete menu warning:', error.message);
    }

    return NextResponse.json({ success: true, deletedId: id, allMenu: inMemoryMenuItemsStore });
  } catch (err: any) {
    console.error('Error deleting menu item:', err);
    return NextResponse.json(
      { error: 'Gagal menghapus menu: ' + err.message },
      { status: 500 }
    );
  }
}
