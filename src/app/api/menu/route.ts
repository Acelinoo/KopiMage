import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/server';
import { MENU_ITEMS as defaultMenuItems } from '@/data/menuData';

export async function GET() {
  try {
    const supabase = createAdminSupabaseClient();

    // 1. Fetch menu items from Supabase database
    const { data: dbItems, error } = await supabase
      .from('menu_items')
      .select('*')
      .order('name');

    if (!error && dbItems && dbItems.length > 0) {
      return NextResponse.json({ success: true, menu: dbItems });
    }

    // 2. If table is empty, seed initial data into Supabase
    if (!dbItems || dbItems.length === 0) {
      const seedPayload = defaultMenuItems.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        price: item.price,
        base_price: (item as any).basePrice || parseInt(item.price.replace(/[^0-9]/g, '')) * 1000 || 22000,
        description: item.description,
        image: item.image || '/images/kopimage_hero_atmosphere_1786480906850.png',
        temperature: item.temperature || 'Hot / Ice',
        is_available: true,
      }));

      const { data: seeded, error: seedError } = await supabase
        .from('menu_items')
        .insert(seedPayload)
        .select();

      if (!seedError && seeded) {
        return NextResponse.json({ success: true, menu: seeded });
      }
    }

    // Fallback to default items if DB connection fails
    return NextResponse.json({ success: true, menu: defaultMenuItems });
  } catch (err: any) {
    console.error('Error fetching menu items:', err);
    return NextResponse.json(
      { success: false, error: err.message, menu: defaultMenuItems },
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
      id: `menu_${Date.now()}_${Math.random().toString(36).substring(7)}`,
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
      image,
      temperature,
    };

    if (is_available !== undefined) {
      updatePayload.is_available = is_available;
    }

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

    if (!id) {
      return NextResponse.json({ error: 'ID menu wajib diisi.' }, { status: 400 });
    }

    const supabase = createAdminSupabaseClient();
    const { error } = await supabase.from('menu_items').delete().eq('id', id);

    if (error) {
      console.warn('Supabase delete menu warning:', error.message);
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    console.error('Error deleting menu item:', err);
    return NextResponse.json(
      { error: 'Gagal menghapus menu: ' + err.message },
      { status: 500 }
    );
  }
}
