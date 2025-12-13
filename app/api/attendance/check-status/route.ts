import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCurrentShift } from '@/lib/shift';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');

    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee ID diperlukan' },
        { status: 400 }
      );
    }

    // Get employee's UUID
    const { data: employee } = await supabase
      .from('employees')
      .select('id')
      .eq('employee_id', employeeId)
      .single();

    if (!employee) {
      return NextResponse.json(
        { error: 'Karyawan tidak ditemukan' },
        { status: 404 }
      );
    }

    // Check if employee has an active shift for current shift period
    const today = new Date().toISOString().split('T')[0];
    const currentShift = getCurrentShift();

    const { data: activeShift, error: shiftError } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', employee.id)
      .eq('date', today)
      .eq('shift_id', currentShift.id)
      .is('check_out_at', null)
      .maybeSingle();

    if (shiftError && shiftError.code !== 'PGRST116') {
      throw shiftError;
    }

    const hasActiveShift = !!activeShift;

    return NextResponse.json({
      hasActiveShift,
      shift: currentShift,
      attendance: activeShift || null,
    });
  } catch (error) {
    console.error('Error checking attendance status:', error);
    return NextResponse.json(
      { error: 'Gagal memeriksa status absensi' },
      { status: 500 }
    );
  }
}
