import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { formatTime } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const { employeeId, password } = await request.json();

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

    if (employeeError || !employee) {
      return NextResponse.json(
        { error: 'ID Karyawan atau Password salah' },
        { status: 401 }
      );
    }

    // Check if admin
    if (employee.role === 'admin') {
      return NextResponse.json({
        success: true,
        role: 'admin',
        employee: {
          id: employee.id,
          name: employee.name,
          role: employee.role,
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
      role: employee.role,
      employeeName: employee.name,
      employee: {
        id: employee.id,
        name: employee.name,
        role: employee.role,
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
