import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET all inventory items
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('inventori')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data inventori' },
      { status: 500 }
    );
  }
}

// POST new inventory item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nama_barang, jumlah, kategori, catatan } = body;

    if (!nama_barang || jumlah === undefined) {
      return NextResponse.json(
        { error: 'Nama barang dan jumlah harus diisi' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('inventori')
      .insert({ nama_barang, jumlah, kategori, catatan })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Error creating inventory:', error);
    return NextResponse.json(
      { error: 'Gagal menambahkan item inventori' },
      { status: 500 }
    );
  }
}

// PUT update inventory item
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, nama_barang, jumlah, kategori, catatan } = body;

    if (!id || !nama_barang || jumlah === undefined) {
      return NextResponse.json(
        { error: 'Field yang diperlukan tidak lengkap' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('inventori')
      .update({ nama_barang, jumlah, kategori, catatan })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error updating inventory:', error);
    return NextResponse.json(
      { error: 'Gagal mengupdate item inventori' },
      { status: 500 }
    );
  }
}

// DELETE inventory item
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID diperlukan' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('inventori')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting inventory:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus item inventori' },
      { status: 500 }
    );
  }
}
