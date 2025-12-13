import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const employeeId = searchParams.get('employeeId');

    let query = supabase
      .from('attendance')
      .select(`
        *,
        employees:employee_id (
          employee_id,
          full_name,
          position
        )
      `)
      .order('date', { ascending: false })
      .order('check_in_at', { ascending: false });

    if (date) {
      query = query.eq('date', date);
    }

    if (employeeId) {
      query = query.eq('employee_id', employeeId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data absensi' },
      { status: 500 }
    );
  }
}
