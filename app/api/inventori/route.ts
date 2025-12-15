import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Function to generate next item code
async function generateItemCode(): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('inventori')
      .select('kode_barang')
      .order('kode_barang', { ascending: false })
      .limit(1);

    if (error) throw error;

    if (!data || data.length === 0) {
      return 'BRG0001';
    }

    const lastCode = data[0].kode_barang;
    if (!lastCode || !lastCode.startsWith('BRG')) {
      return 'BRG0001';
    }

    const lastNumber = parseInt(lastCode.substring(3));
    const nextNumber = lastNumber + 1;
    return `BRG${String(nextNumber).padStart(4, '0')}`;
  } catch (error) {
    console.error('Error generating item code:', error);
    return 'BRG0001';
  }
}

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

    // Generate kode barang
    const kode_barang = await generateItemCode();

    const { data, error } = await supabase
      .from('inventori')
      .insert({ kode_barang, nama_barang, jumlah, kategori, catatan })
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
    const { id, nama_barang, jumlah, kategori, catatan, nama_toko } = body;

    if (!id || !nama_barang || jumlah === undefined) {
      return NextResponse.json(
        { error: 'Field yang diperlukan tidak lengkap' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('inventori')
      .update({ nama_barang, jumlah, kategori, catatan, nama_toko })
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
