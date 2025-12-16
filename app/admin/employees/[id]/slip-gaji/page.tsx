'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, Calendar, DollarSign, User, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Image from 'next/image';

interface Employee {
  id: string;
  employee_id: string;
  full_name: string;
  position: string;
  employment_status: string;
  email: string;
  created_at: string;
}

interface AttendanceRecord {
  id: string;
  date: string;
  check_in_at: string;
  check_out_at: string | null;
  status: string;
  shift_id: number;
  auto_checkout?: boolean;
  notes?: string;
}

interface WeeklyData {
  weekStart: string;
  weekEnd: string;
  attendance: AttendanceRecord[];
  totalShifts: number;
  totalLateMinutes: number;
  grossSalary: number;
  penalty: number;
  netSalary: number;
}

export default function SalarySlipPage() {
  const params = useParams();
  const router = useRouter();
  const [employee, setEmployee] = React.useState<Employee | null>(null);
  const [weeklyData, setWeeklyData] = React.useState<WeeklyData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (params.id) {
      fetchData();
    }
  }, [params.id]);

  const fetchData = async () => {
    try {
      // Fetch employee data
      const empResponse = await fetch('/api/employees');
      const empResult = await empResponse.json();
      
      if (empResponse.ok) {
        const emp = empResult.data.find((e: Employee) => e.id === params.id);
        if (!emp) {
          toast.error('Karyawan tidak ditemukan');
          router.push('/admin/employees');
          return;
        }
        setEmployee(emp);

        // Fetch attendance data
        const attResponse = await fetch('/api/attendance');
        const attResult = await attResponse.json();
        
        if (attResponse.ok) {
          const empAttendance = attResult.data.filter(
            (a: any) => a.employee_id === params.id
          );
          
          // Process current week data
          const weekData = processCurrentWeekData(empAttendance);
          setWeeklyData(weekData);
        }
      }
    } catch (error) {
      toast.error('Gagal mengambil data');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentWeekStart = (): Date => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(now.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  };

  const getCurrentWeekEnd = (): Date => {
    const weekStart = getCurrentWeekStart();
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    return weekEnd;
  };

  const processCurrentWeekData = (attendance: AttendanceRecord[]): WeeklyData | null => {
    const weekStart = getCurrentWeekStart();
    const weekEnd = getCurrentWeekEnd();

    const currentWeekAttendance = attendance.filter((record) => {
      const recordDate = new Date(record.date);
      return recordDate >= weekStart && recordDate <= weekEnd;
    });

    if (currentWeekAttendance.length === 0) {
      return null;
    }

    let totalShifts = 0;
    let totalLateMinutes = 0;

    currentWeekAttendance.forEach((record) => {
      // Count shift if check_in_at exists (regardless of check_out status)
      if (record.check_in_at) {
        totalShifts++;
        
        // Calculate late minutes based on shift_id
        const checkInTime = new Date(record.check_in_at);
        const checkInHour = checkInTime.getUTCHours() + 7; // Convert to WIB
        const checkInMinute = checkInTime.getUTCMinutes();
        const actualTimeInMinutes = (checkInHour % 24) * 60 + checkInMinute;
        
        let shiftStartTimeInMinutes = 0;
        let lateThresholdMinutes = 0;
        
        // Determine shift start time and late threshold (5 minutes after shift start)
        if (record.shift_id === 1) { // Pagi 11:00
          shiftStartTimeInMinutes = 11 * 60; // 11:00
          lateThresholdMinutes = shiftStartTimeInMinutes + 5; // 11:05
        } else if (record.shift_id === 2) { // Malam 19:00
          shiftStartTimeInMinutes = 19 * 60; // 19:00
          lateThresholdMinutes = shiftStartTimeInMinutes + 5; // 19:05
        } else if (record.shift_id === 3) { // Dini Hari 03:00
          shiftStartTimeInMinutes = 3 * 60; // 03:00
          lateThresholdMinutes = shiftStartTimeInMinutes + 5; // 03:05
        }
        
        // Check if late (checked in after the 5-minute grace period)
        if (actualTimeInMinutes > lateThresholdMinutes) {
          const lateMinutes = actualTimeInMinutes - lateThresholdMinutes;
          totalLateMinutes += lateMinutes;
        }
      }
    });

    const grossSalary = totalShifts * 70000;
    const penalty = totalLateMinutes * 1000;
    const netSalary = grossSalary - penalty;

    return {
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0],
      attendance: currentWeekAttendance,
      totalShifts,
      totalLateMinutes,
      grossSalary,
      penalty,
      netSalary,
    };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return '-';
    return new Date(timeString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getDayName = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
    });
  };

  const downloadSlip = () => {
    if (!employee || !weeklyData) return;

    const slipContent = `
╔════════════════════════════════════════════════╗
║        SLIP GAJI - NOVEMBER COFFEE            ║
╠════════════════════════════════════════════════╣
║ Nama: ${employee.full_name.padEnd(39)} ║
║ ID Karyawan: ${employee.employee_id.padEnd(33)} ║
║ Posisi: ${employee.position.padEnd(37)} ║
╠════════════════════════════════════════════════╣
║ Periode: ${formatDate(weeklyData.weekStart)} - ${formatDate(weeklyData.weekEnd).padEnd(10)} ║
╠════════════════════════════════════════════════╣
║ RINCIAN GAJI:                                 ║
║ Total Shift: ${String(weeklyData.totalShifts).padStart(2)} shift                      ║
║ Gaji per Shift: ${formatCurrency(70000).padStart(20)} ║
║ Gaji Kotor: ${formatCurrency(weeklyData.grossSalary).padStart(24)} ║
║                                                ║
║ POTONGAN:                                     ║
║ Keterlambatan: ${String(weeklyData.totalLateMinutes).padStart(3)} menit                   ║
║ Denda (Rp 1.000/menit): ${formatCurrency(weeklyData.penalty).padStart(14)} ║
╠════════════════════════════════════════════════╣
║ TOTAL GAJI BERSIH: ${formatCurrency(weeklyData.netSalary).padStart(23)} ║
╚════════════════════════════════════════════════╝

Dicetak pada: ${new Date().toLocaleString('id-ID')}
    `.trim();

    const blob = new Blob([slipContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Slip_Gaji_${employee.full_name.replace(/\s+/g, '_')}_${weeklyData.weekStart}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Slip gaji berhasil diunduh');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!employee || !weeklyData) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push(`/admin/employees/${params.id}`)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Slip Gaji</h1>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-yellow-900 mb-1">Tidak Ada Data Absensi</h3>
            <p className="text-yellow-800">Belum ada data absensi untuk minggu ini.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.push(`/admin/employees/${params.id}`)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Slip Gaji Karyawan</h1>
          <p className="text-gray-600 font-medium">Preview dan unduh slip gaji</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Slip Preview Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6"
        >
          {/* Header Section */}
          <div className="bg-gradient-to-r from-[#E07856] to-[#D96846] p-8 text-white">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-3">
                <Image
                  src="/images/gallery/november_logo.png"
                  alt="Logo"
                  width={120}
                  height={120}
                  className="object-contain bg-white rounded-full p-2"
                />
              </div>
              <p className="text-white text-lg font-semibold">Slip Gaji Karyawan</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-sm text-white/80 mb-1">Periode Pembayaran</p>
              <p className="text-xl font-bold">
                {formatDate(weeklyData.weekStart)} - {formatDate(weeklyData.weekEnd)}
              </p>
            </div>
          </div>

          {/* Employee Info */}
          <div className="p-8 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Informasi Karyawan</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-[#C84B31] mt-1" />
                <div>
                  <p className="text-sm text-gray-600 font-semibold">Nama Lengkap</p>
                  <p className="text-lg font-bold text-gray-900">{employee.full_name}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-[#C84B31] mt-1" />
                <div>
                  <p className="text-sm text-gray-600 font-semibold">ID Karyawan</p>
                  <p className="text-lg font-bold text-gray-900">{employee.employee_id}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-[#C84B31] mt-1" />
                <div>
                  <p className="text-sm text-gray-600 font-semibold">Posisi</p>
                  <p className="text-lg font-bold text-gray-900">{employee.position}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-[#C84B31] mt-1" />
                <div>
                  <p className="text-sm text-gray-600 font-semibold">Status</p>
                  <p className="text-lg font-bold text-gray-900">{employee.employment_status}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Salary Calculation */}
          <div className="p-8 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Perhitungan Gaji</h3>
            
            {/* Gross Salary */}
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600 font-semibold">Total Shift</p>
                  <p className="text-lg font-bold text-gray-900">{weeklyData.totalShifts} shift</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 font-semibold">@ Rp 70.000</p>
                  <p className="text-2xl font-bold text-green-700">{formatCurrency(weeklyData.grossSalary)}</p>
                </div>
              </div>

              {/* Penalty */}
              {weeklyData.totalLateMinutes > 0 && (
                <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600 font-semibold">Keterlambatan</p>
                    <p className="text-lg font-bold text-gray-900">{weeklyData.totalLateMinutes} menit</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 font-semibold">@ Rp 1.000/menit</p>
                    <p className="text-2xl font-bold text-red-700">- {formatCurrency(weeklyData.penalty)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Net Salary */}
            <div className="border-t-2 border-gray-300 pt-6">
              <div className="flex justify-between items-center p-6 bg-gradient-to-r from-[#E07856] to-[#D96846] rounded-xl">
                <div>
                  <p className="text-white/90 text-sm font-semibold mb-1">TOTAL GAJI BERSIH</p>
                  <p className="text-4xl font-bold text-white">{formatCurrency(weeklyData.netSalary)}</p>
                </div>
                <DollarSign className="w-16 h-16 text-white/30" />
              </div>
            </div>
          </div>

          {/* Attendance Details */}
          <div className="p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Detail Kehadiran</h3>
            <div className="space-y-3">
              {weeklyData.attendance.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div>
                      <p className="font-bold text-gray-900">{getDayName(record.date)}</p>
                      <p className="text-sm text-gray-600">{formatDate(record.date)}</p>
                      {record.auto_checkout && (
                        <p className="text-xs text-orange-600 font-semibold mt-1">⚡ Auto Checkout</p>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div>
                        <span className="text-gray-600 font-semibold">Masuk: </span>
                        <span className="text-gray-900 font-bold">{formatTime(record.check_in_at)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600 font-semibold">Keluar: </span>
                        <span className="text-gray-900 font-bold">{formatTime(record.check_out_at)}</span>
                        {record.auto_checkout && (
                          <span className="ml-1 text-xs text-orange-600">⚡</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-lg text-sm font-bold ${
                      record.status === 'Present'
                        ? 'bg-green-100 text-green-800'
                        : record.status === 'Late'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {record.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 bg-gray-50 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600">
              Dicetak pada: {new Date().toLocaleString('id-ID', { 
                day: '2-digit', 
                month: 'long', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </motion.div>

        {/* Download Button */}
        <button
          onClick={downloadSlip}
          className="w-full bg-[#C84B31] text-white py-4 rounded-xl hover:bg-[#A03B24] transition-colors font-bold flex items-center justify-center gap-3 text-lg shadow-lg"
        >
          <Download className="w-6 h-6" />
          Download Slip Gaji (TXT)
        </button>
      </div>
    </div>
  );
}
