import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Function to update employee status based on recent attendance
async function updateEmployeeStatuses() {
  try {
    // Get all employees except admin
    const { data: employees } = await supabase
      .from('employees')
      .select('id, employee_id, position')
      .neq('position', 'Admin');

    if (!employees) return;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    for (const employee of employees) {
      // Skip Manager - Manager always stays Active
      if (employee.position === 'Manager') {
        await supabase
          .from('employees')
          .update({ employment_status: 'Active' })
          .eq('id', employee.id);
        continue;
      }

      // Check if employee has attendance in last 7 days
      const { data: recentAttendance } = await supabase
        .from('attendance')
        .select('id')
        .eq('employee_id', employee.id)
        .gte('date', sevenDaysAgoStr)
        .limit(1);

      const newStatus = recentAttendance && recentAttendance.length > 0 ? 'Active' : 'Inactive';

      // Update employee status
      await supabase
        .from('employees')
        .update({ employment_status: newStatus })
        .eq('id', employee.id);
    }
  } catch (error) {
    console.error('Error updating employee statuses:', error);
  }
}

// GET all employees
export async function GET() {
  try {
    // Update statuses before fetching
    await updateEmployeeStatuses();

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
    const { id, employee_id, full_name, position, employment_status, email, password, join_date } = body;

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
      // Force Manager to always be Active
      employment_status: position === 'Manager' ? 'Active' : (employment_status || 'Aktif'),
      email: email || null
    };

    // Only update join_date if provided and valid
    if (join_date) {
      updateData.join_date = join_date;
    }

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

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Error updating employee:', error);
    return NextResponse.json(
      { error: error.message || 'Gagal mengupdate karyawan' },
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
