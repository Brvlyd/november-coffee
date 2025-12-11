import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { formatTime } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const { employeeId, password } = await request.json();

    console.log('Login attempt:', { employeeId, password: password ? '***' : 'empty' });

    if (!employeeId || !password) {
      return NextResponse.json(
        { error: 'ID Karyawan dan Password harus diisi' },
        { status: 400 }
      );
    }

    // Check if employee exists with correct password
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('password', password)
      .single();

    console.log('Query result:', { employee: employee ? 'found' : 'not found', error: employeeError?.message });

    if (employeeError || !employee) {
      console.error('Login failed:', employeeError);
      return NextResponse.json(
        { error: 'ID Karyawan atau Password salah' },
        { status: 401 }
      );
    }

    // Check if admin based on position
    if (employee.position === 'admin' || employee.position === 'Admin') {
      return NextResponse.json({
        success: true,
        role: 'admin',
        employee: {
          id: employee.id,
          name: employee.full_name,
          position: employee.position,
          email: employee.email,
        }
      });
    }

    // For regular employees, handle check-in
    const today = new Date().toISOString().split('T')[0];

    // Check if already checked in today
    const { data: existingAttendance } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', employee.id)
      .eq('date', today)
      .single();

    if (existingAttendance && existingAttendance.check_in_at) {
      return NextResponse.json(
        { error: 'Anda sudah check-in hari ini' },
        { status: 400 }
      );
    }

    // Create check-in record
    const checkInTime = new Date();
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance')
      .insert({
        employee_id: employee.id,
        date: today,
        check_in_at: checkInTime.toISOString(),
        status: 'Hadir',
      })
      .select()
      .single();

    if (attendanceError) {
      console.error('Attendance error:', attendanceError);
      return NextResponse.json(
        { error: 'Gagal mencatat check-in' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      role: 'employee',
      employeeName: employee.full_name,
      employee: {
        id: employee.id,
        name: employee.full_name,
        position: employee.position,
        email: employee.email,
      },
      checkInTime: formatTime(checkInTime),
      attendance
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
