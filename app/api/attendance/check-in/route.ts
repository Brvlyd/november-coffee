import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCurrentShift } from '@/lib/shift';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employeeId } = body;
    
    console.log('=== CHECK-IN REQUEST ===');
    console.log('Employee ID:', employeeId);
    console.log('Request body:', body);

    if (!employeeId) {
      return NextResponse.json(
        { error: 'Employee ID diperlukan' },
        { status: 400 }
      );
    }

    // Get employee's UUID
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .eq('employee_id', employeeId)
      .single();

    console.log('Employee lookup result:', { employee: employee?.employee_id, error: employeeError });

    if (!employee) {
      return NextResponse.json(
        { error: 'Karyawan tidak ditemukan' },
        { status: 404 }
      );
    }

    // Gunakan timezone Indonesia (WIB)
    const now = new Date();
    // Konversi ke WIB dengan offset +7 jam
    const wibTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    const today = wibTime.toISOString().split('T')[0];
    const currentShift = getCurrentShift();

    console.log('Current shift:', currentShift);

    // Validasi waktu check-in: pegawai bisa check-in 10 menit sebelum shift dimulai
    const currentHour = wibTime.getUTCHours();
    const currentMinute = wibTime.getUTCMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    // Parse shift start time
    const [shiftStartHour, shiftStartMinute] = currentShift.startTime.split(':').map(Number);
    const shiftStartTimeInMinutes = shiftStartHour * 60 + shiftStartMinute;

    // Cek apakah waktu sekarang minimal 10 menit sebelum shift dimulai
    // Pegawai bisa check-in dari 10 menit sebelum shift dimulai
    const earliestCheckInTime = shiftStartTimeInMinutes - 10;
    
    // Handle case untuk shift yang melewati tengah malam
    let canCheckIn = false;
    if (currentShift.id === 2) { // Shift Malam 19:00 - 03:00
      // Bisa check-in mulai 18:50 (19:00 - 10 menit)
      canCheckIn = currentTimeInMinutes >= earliestCheckInTime || currentTimeInMinutes < 180; // sampai 03:00
    } else if (currentShift.id === 3) { // Shift Dini Hari 03:00 - 11:00
      // Bisa check-in mulai 02:50 (03:00 - 10 menit)
      const lateNightStart = (3 * 60) - 10; // 02:50
      canCheckIn = (currentTimeInMinutes >= lateNightStart && currentTimeInMinutes < 660) || 
                   (currentTimeInMinutes >= (24 * 60 - 10)); // atau dari 23:50 malam sebelumnya
    } else { // Shift Pagi 11:00 - 19:00
      // Bisa check-in mulai 10:50 (11:00 - 10 menit) sampai sebelum shift Malam
      canCheckIn = currentTimeInMinutes >= earliestCheckInTime && currentTimeInMinutes < 1140;
    }

    if (!canCheckIn) {
      return NextResponse.json(
        { 
          error: `Anda hanya bisa check-in mulai 10 menit sebelum shift ${currentShift.name} dimulai (${currentShift.startTime}).`,
          shift: currentShift
        },
        { status: 400 }
      );
    }

    // Check if employee has already checked in for this shift today
    const { data: existingShiftAttendance, error: shiftCheckError } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', employee.id)
      .eq('date', today)
      .eq('shift_id', currentShift.id)
      .maybeSingle();

    console.log('Existing shift attendance:', { existingShiftAttendance, shiftCheckError });

    if (existingShiftAttendance) {
      if (existingShiftAttendance.check_out_at) {
        return NextResponse.json(
          { 
            error: `Anda sudah selesai ${currentShift.name} hari ini.`,
            shift: currentShift
          },
          { status: 400 }
        );
      } else {
        return NextResponse.json(
          { 
            error: `Anda sudah check-in untuk ${currentShift.name}. Silakan check-out terlebih dahulu.`,
            hasActiveShift: true,
            shift: currentShift,
            activeShift: {
              checkInTime: new Date(existingShiftAttendance.check_in_at).toLocaleTimeString('id-ID'),
              date: existingShiftAttendance.date
            }
          },
          { status: 400 }
        );
      }
    }

    // Create check-in record for this shift
    const checkInTime = new Date();
    console.log('Creating check-in record...', {
      employee_id: employee.id,
      date: today,
      shift_id: currentShift.id,
      shift_name: currentShift.name,
      check_in_at: checkInTime.toISOString()
    });
    
    const { data: attendance, error: attendanceError } = await supabase
      .from('attendance')
      .insert({
        employee_id: employee.id,
        date: today,
        shift_id: currentShift.id,
        check_in_at: checkInTime.toISOString(),
        status: 'Hadir',
      })
      .select()
      .single();

    console.log('Insert result:', { attendance, attendanceError });

    if (attendanceError) {
      console.error('Check-in error:', attendanceError);
      return NextResponse.json(
        { error: 'Gagal mencatat check-in' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      employeeName: employee.full_name,
      shift: currentShift,
      checkInTime: checkInTime.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      attendance
    });

  } catch (error) {
    console.error('Check-in error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
