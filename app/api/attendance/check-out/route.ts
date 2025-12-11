import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { employeeId } = await request.json();

    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee ID diperlukan' },
        { status: 400 }
      );
    }

    // Get employee
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id')
      .eq('employee_id', employeeId)
      .single();

    if (employeeError || !employee) {
      return NextResponse.json(
        { error: 'Karyawan tidak ditemukan' },
        { status: 404 }
      );
    }

    const today = new Date().toISOString().split('T')[0];

    // Get today's attendance
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', employee.id)
      .eq('date', today)
      .single();

    if (attendanceError || !attendance) {
      return NextResponse.json(
        { error: 'Anda belum check-in hari ini' },
        { status: 400 }
      );
    }

    if (attendance.check_out_at) {
      return NextResponse.json(
        { error: 'Anda sudah check-out hari ini' },
        { status: 400 }
      );
    }

    // Update check-out time
    const checkOutTime = new Date();
    const { data: updatedAttendance, error: updateError } = await supabase
      .from('attendance')
      .update({ check_out_at: checkOutTime.toISOString() })
      .eq('id', attendance.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Gagal mencatat check-out' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      attendance: updatedAttendance
    });

  } catch (error) {
    console.error('Check-out error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
