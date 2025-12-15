import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// DELETE all inventory items
export async function DELETE() {
  try {
    const { error } = await supabase
      .from('inventori')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      message: 'Semua data inventori berhasil dihapus' 
    });
  } catch (error) {
    console.error('Error clearing inventory:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus semua data inventori' },
      { status: 500 }
    );
  }
}
