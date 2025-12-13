import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET all employees
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data karyawan' },
      { status: 500 }
    );
  }
}

// POST new employee
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employee_id, full_name, position, employment_status, email, password } = body;

    if (!employee_id || !full_name || !position || !password) {
      return NextResponse.json(
        { error: 'ID Karyawan, Nama, Posisi, dan Password harus diisi' },
        { status: 400 }
      );
    }

    // Check if employee_id already exists
    const { data: existingId } = await supabase
      .from('employees')
      .select('employee_id')
      .eq('employee_id', employee_id)
      .single();

    if (existingId) {
      return NextResponse.json(
        { error: 'ID Karyawan sudah digunakan' },
        { status: 400 }
      );
    }

    // Check if email already exists
    if (email) {
      const { data: existing } = await supabase
        .from('employees')
        .select('email')
        .eq('email', email)
        .single();

      if (existing) {
        return NextResponse.json(
          { error: 'Email sudah digunakan' },
          { status: 400 }
        );
      }
    }

    const { data, error } = await supabase
      .from('employees')
      .insert({ 
        employee_id,
        full_name, 
        position, 
        employment_status: employment_status || 'Aktif',
        email: email || null,
        password
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Error creating employee:', error);
    return NextResponse.json(
      { error: 'Gagal menambahkan karyawan' },
      { status: 500 }
    );
  }
}

// PUT update employee
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, employee_id, full_name, position, employment_status, email, password } = body;

    if (!id || !employee_id || !full_name || !position) {
      return NextResponse.json(
        { error: 'ID, ID Karyawan, Nama, dan Posisi harus diisi' },
        { status: 400 }
      );
    }

    // Check if employee_id is used by another employee
    const { data: existingId } = await supabase
      .from('employees')
      .select('id, employee_id')
      .eq('employee_id', employee_id)
      .neq('id', id)
      .single();

    if (existingId) {
      return NextResponse.json(
        { error: 'ID Karyawan sudah digunakan oleh karyawan lain' },
        { status: 400 }
      );
    }

    // Check if email is used by another employee
    if (email) {
      const { data: existing } = await supabase
        .from('employees')
        .select('id, email')
        .eq('email', email)
        .neq('id', id)
        .single();

      if (existing) {
        return NextResponse.json(
          { error: 'Email sudah digunakan oleh karyawan lain' },
          { status: 400 }
        );
      }
    }

    const updateData: any = { 
      employee_id,
      full_name, 
      position, 
      employment_status: employment_status || 'Aktif',
      email: email || null
    };

    // Only update password if provided
    if (password) {
      updateData.password = password;
    }

    const { data, error } = await supabase
      .from('employees')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error updating employee:', error);
    return NextResponse.json(
      { error: 'Gagal mengupdate karyawan' },
      { status: 500 }
    );
  }
}

// DELETE employee
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID diperlukan' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting employee:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus karyawan' },
      { status: 500 }
    );
  }
}
