import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { formatTime } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const { employeeId, password } = await request.json();

    // Log login attempt without sensitive data
    console.log('Login attempt for employee:', employeeId);

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

    // Check if manager or admin based on position
    if (employee.position === 'admin' || employee.position === 'Admin' || employee.position === 'Manager') {
      return NextResponse.json({
        success: true,
        role: 'admin',
        employeeId: employee.employee_id,
        employee: {
          id: employee.id,
          name: employee.full_name,
          position: employee.position,
          email: employee.email,
        }
      });
    }

    // For regular employees, just authenticate (no auto check-in)
    return NextResponse.json({
      success: true,
      role: 'employee',
      employeeId: employee.employee_id,
      employeeName: employee.full_name,
      employee: {
        id: employee.id,
        name: employee.full_name,
        position: employee.position,
        email: employee.email,
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}
