import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { SHIFTS, Shift } from '@/lib/shift';

export async function POST(request: NextRequest) {
  try {
    // Verify secret token for security (optional but recommended)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET || 'your-secret-token';
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get current time in WIB
    const now = new Date();
    const wibTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
    const currentHour = wibTime.getUTCHours();
    const currentMinute = wibTime.getUTCMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    // Determine which shift just ended
    let endedShift: Shift | null = null;
    let checkoutTime: Date;

    // Check if we're at the end of any shift (with 15 minutes buffer)
    // Shift 1 ends at 19:00 (1140 minutes)
    if (currentTimeInMinutes >= 1140 && currentTimeInMinutes <= 1155) {
      endedShift = SHIFTS[0]; // Pagi
      // Create checkout time in WIB (19:00) and convert to UTC for storage
      checkoutTime = new Date();
      checkoutTime.setUTCHours(12, 0, 0, 0); // 19:00 WIB = 12:00 UTC
    }
    // Shift 2 ends at 03:00 (180 minutes)
    else if (currentTimeInMinutes >= 180 && currentTimeInMinutes <= 195) {
      endedShift = SHIFTS[1]; // Malam
      // Create checkout time in WIB (03:00) and convert to UTC for storage
      checkoutTime = new Date();
      checkoutTime.setUTCHours(20, 0, 0, 0); // 03:00 WIB next day = 20:00 UTC previous day
    }
    // Shift 3 ends at 11:00 (660 minutes)
    else if (currentTimeInMinutes >= 660 && currentTimeInMinutes <= 675) {
      endedShift = SHIFTS[2]; // Dini Hari
      // Create checkout time in WIB (11:00) and convert to UTC for storage
      checkoutTime = new Date();
      checkoutTime.setUTCHours(4, 0, 0, 0); // 11:00 WIB = 04:00 UTC
    }

    if (!endedShift) {
      return NextResponse.json({
        success: true,
        message: 'Not at the end of any shift',
        currentTime: wibTime.toISOString(),
      });
    }

    // Find all attendance records that:
    // 1. Are for the shift that just ended
    // 2. Have check_in_at but no check_out_at
    // 3. Are from today or yesterday (for night shift)
    const today = wibTime.toISOString().split('T')[0];
    const yesterday = new Date(wibTime);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // For night shift (19:00-03:00), we need to check yesterday's records too
    const datesToCheck = endedShift.id === 2 ? [yesterdayStr, today] : [today];

    let totalAutoCheckedOut = 0;

    for (const date of datesToCheck) {
      const { data: activeAttendances, error: fetchError } = await supabase
        .from('attendance')
        .select('*')
        .eq('date', date)
        .eq('shift_id', endedShift.id)
        .not('check_in_at', 'is', null)
        .is('check_out_at', null);

      if (fetchError) {
        console.error('Error fetching active attendances:', fetchError);
        continue;
      }

      if (!activeAttendances || activeAttendances.length === 0) {
        continue;
      }

      // Auto check-out all found records
      for (const attendance of activeAttendances) {
        const { error: updateError } = await supabase
          .from('attendance')
          .update({ 
            check_out_at: checkoutTime!.toISOString(),
            auto_checkout: true,
            notes: `Auto checkout by system at end of ${endedShift.name} shift`
          })
          .eq('id', attendance.id);

        if (updateError) {
          console.error(`Error auto-checking out attendance ${attendance.id}:`, updateError);
        } else {
          totalAutoCheckedOut++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Auto checkout completed for ${endedShift.name} shift`,
      shift: endedShift.name,
      totalAutoCheckedOut,
      checkoutTime: checkoutTime!.toISOString(),
      currentTime: wibTime.toISOString(),
    });

  } catch (error) {
    console.error('Auto checkout error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server', details: error },
      { status: 500 }
    );
  }
}

// GET endpoint for manual trigger/testing
export async function GET(request: NextRequest) {
  // Forward to POST for easier testing
  return POST(request);
}
