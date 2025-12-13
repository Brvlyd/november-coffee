import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCurrentShift } from '@/lib/shift';

export async function POST(request: NextRequest) {
  try {
    const { employeeId } = await request.json();

    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee ID diperlukan' },
        { status: 400 }
      );
    }

    // Get employee by employee_id
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

    // Get active shift (checked in but not checked out) for current shift
    const today = new Date().toISOString().split('T')[0];
    const currentShift = getCurrentShift();

    const { data: activeShifts, error: shiftError } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', employee.id)
      .eq('date', today)
      .eq('shift_id', currentShift.id)
      .is('check_out_at', null)
      .limit(1);

    if (shiftError) {
      console.error('Error getting active shift:', shiftError);
      return NextResponse.json(
        { error: 'Gagal memeriksa shift aktif' },
        { status: 500 }
      );
    }

    if (!activeShifts || activeShifts.length === 0) {
      return NextResponse.json(
        { 
          error: `Anda tidak memiliki shift aktif untuk ${currentShift.name}. Silakan check-in terlebih dahulu.`,
          shift: currentShift
        },
        { status: 400 }
      );
    }

    const attendance = activeShifts[0];

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
