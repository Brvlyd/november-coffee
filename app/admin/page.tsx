'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Users, UserCheck, Package, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { getCurrentShift } from '@/lib/shift';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Image from 'next/image';

interface Stats {
  totalEmployees: number;
  activeWorkers: number;
  lowStockItems: number;
  totalInventory: number;
}

interface AttendanceStats {
  hadir: number;
  terlambat: number;
  absen: number;
}

interface DailyAttendance {
  [date: string]: {
    total: number;
    hadir: number;
    terlambat: number;
    absen: number;
  };
}

interface ShiftAttendanceData {
  date: string;
  Pagi: number;
  Malam: number;
  'Dini Hari': number;
}

interface AttendanceTrendData {
  date: string;
  hadir: number;
  terlambat: number;
  absen: number;
}

export default function ManagerDashboard() {
  const router = useRouter();
  const [stats, setStats] = React.useState<Stats>({
    totalEmployees: 0,
    activeWorkers: 0,
    lowStockItems: 0,
    totalInventory: 0,
  });
  const [attendanceStats, setAttendanceStats] = React.useState<AttendanceStats>({
    hadir: 0,
    terlambat: 0,
    absen: 0,
  });
  const [dailyAttendance, setDailyAttendance] = React.useState<DailyAttendance>({});
  const [selectedMonth, setSelectedMonth] = React.useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = React.useState(new Date().getFullYear());
  const [loading, setLoading] = React.useState(true);
  const [shiftData, setShiftData] = React.useState<ShiftAttendanceData[]>([]);
  const [trendData, setTrendData] = React.useState<AttendanceTrendData[]>([]);

  React.useEffect(() => {
    // Initial fetch
    fetchStats();
    fetchMonthlyAttendance();
    fetchShiftAttendance();
    fetchAttendanceTrend();

    // Set up real-time subscription for employees table
    const employeesSubscription = supabase
      .channel('employees_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'employees' }, 
        () => {
          fetchStats();
        }
      )
      .subscribe();

    // Set up real-time subscription for attendance table
    const attendanceSubscription = supabase
      .channel('attendance_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'attendance' }, 
        () => {
          fetchStats();
          fetchMonthlyAttendance();
          fetchShiftAttendance();
          fetchAttendanceTrend();
        }
      )
      .subscribe();

    // Set up real-time subscription for inventori table
    const inventoriSubscription = supabase
      .channel('inventori_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'inventori' }, 
        () => {
          fetchStats();
        }
      )
      .subscribe();

    // Set up interval for polling (fallback every 30 seconds)
    const interval = setInterval(() => {
      fetchStats();
    }, 30000);

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(employeesSubscription);
      supabase.removeChannel(attendanceSubscription);
      supabase.removeChannel(inventoriSubscription);
      clearInterval(interval);
    };
  }, []);

  React.useEffect(() => {
    fetchMonthlyAttendance();
  }, [selectedMonth, selectedYear]);

  const fetchMonthlyAttendance = async () => {
    try {
      const startDate = new Date(selectedYear, selectedMonth, 1).toISOString().split('T')[0];
      const endDate = new Date(selectedYear, selectedMonth + 1, 0).toISOString().split('T')[0];

      // Ambil data dengan check_in_at dan shift_id untuk hitung keterlambatan
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('date, status, employee_id, check_in_at, shift_id')
        .gte('date', startDate)
        .lte('date', endDate);

      const { count: totalEmployees } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .neq('position', 'Admin');

      // Group by date and calculate late status
      const dailyData: DailyAttendance = {};
      attendanceData?.forEach((record) => {
        const date = record.date;
        if (!dailyData[date]) {
          dailyData[date] = { total: 0, hadir: 0, terlambat: 0, absen: 0 };
        }
        dailyData[date].total++;
        
        // Hitung keterlambatan jika status Hadir dan ada check_in_at
        if (record.status === 'Hadir' && record.check_in_at) {
          const checkInTime = new Date(record.check_in_at);
          const checkInHour = checkInTime.getUTCHours() + 7; // Convert to WIB
          const checkInMinute = checkInTime.getUTCMinutes();
          const actualTimeInMinutes = (checkInHour % 24) * 60 + checkInMinute;
          
          let isLate = false;
          if (record.shift_id === 1) { // Pagi 11:00
            const startTime = 11 * 60;
            isLate = actualTimeInMinutes > startTime + 5; // Terlambat jika > 11:05
          } else if (record.shift_id === 2) { // Malam 19:00
            const startTime = 19 * 60;
            isLate = actualTimeInMinutes > startTime + 5; // Terlambat jika > 19:05
          } else if (record.shift_id === 3) { // Dini Hari 03:00
            const startTime = 3 * 60;
            isLate = actualTimeInMinutes > startTime + 5; // Terlambat jika > 03:05
          }
          
          if (isLate) {
            dailyData[date].terlambat++;
          } else {
            dailyData[date].hadir++;
          }
        } else if (record.status === 'Hadir' || !record.status) {
          // Jika tidak ada check_in_at, hitung sebagai hadir biasa
          dailyData[date].hadir++;
        }
      });

      // Calculate absen for each day
      Object.keys(dailyData).forEach(date => {
        const dayData = dailyData[date];
        dayData.absen = (totalEmployees || 0) - dayData.hadir - dayData.terlambat;
      });

      setDailyAttendance(dailyData);
    } catch (error) {
      console.error('Error fetching monthly attendance:', error);
    }
  };

  const fetchShiftAttendance = async () => {
    try {
      // Get last 7 days
      const dates = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
      }

      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('date, shift_id')
        .gte('date', dates[0])
        .lte('date', dates[6]);

      // Group by date and shift
      const shiftDataMap: { [key: string]: ShiftAttendanceData } = {};
      
      dates.forEach(date => {
        const dateFormatted = new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        shiftDataMap[date] = {
          date: dateFormatted,
          Pagi: 0,
          Malam: 0,
          'Dini Hari': 0
        };
      });

      attendanceData?.forEach((record) => {
        if (shiftDataMap[record.date]) {
          if (record.shift_id === 1) shiftDataMap[record.date].Pagi++;
          else if (record.shift_id === 2) shiftDataMap[record.date].Malam++;
          else if (record.shift_id === 3) shiftDataMap[record.date]['Dini Hari']++;
        }
      });

      setShiftData(Object.values(shiftDataMap));
    } catch (error) {
      console.error('Error fetching shift attendance:', error);
    }
  };

  const fetchAttendanceTrend = async () => {
    try {
      // Get last 30 days
      const dates = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
      }

      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('date, check_in_at, shift_id')
        .gte('date', dates[0])
        .lte('date', dates[29]);

      const { count: totalEmployees } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .neq('position', 'Admin');

      // Group by date
      const trendDataMap: { [key: string]: { hadir: number; terlambat: number } } = {};
      
      dates.forEach(date => {
        trendDataMap[date] = { hadir: 0, terlambat: 0 };
      });

      attendanceData?.forEach((record) => {
        if (trendDataMap[record.date]) {
          trendDataMap[record.date].hadir++;
          
          // Check if late (more than 5 minutes after shift start)
          const checkInTime = new Date(record.check_in_at);
          const checkInHour = checkInTime.getUTCHours() + 7; // Convert to WIB
          const checkInMinute = checkInTime.getUTCMinutes();
          
          let isLate = false;
          if (record.shift_id === 1) { // Pagi 11:00
            const startTime = 11 * 60; // 11:00 in minutes
            const actualTime = (checkInHour % 24) * 60 + checkInMinute;
            isLate = actualTime > startTime + 5; // Terlambat jika lebih dari 5 menit setelah shift dimulai
          } else if (record.shift_id === 2) { // Malam 19:00
            const startTime = 19 * 60; // 19:00 in minutes
            const actualTime = (checkInHour % 24) * 60 + checkInMinute;
            isLate = actualTime > startTime + 5; // Terlambat jika lebih dari 5 menit setelah shift dimulai
          } else if (record.shift_id === 3) { // Dini Hari 03:00
            const startTime = 3 * 60; // 03:00 in minutes
            const actualTime = (checkInHour % 24) * 60 + checkInMinute;
            isLate = actualTime > startTime + 5; // Terlambat jika lebih dari 5 menit setelah shift dimulai
          }
          
          if (isLate) trendDataMap[record.date].terlambat++;
        }
      });

      // Convert to array with formatted dates and calculate absen
      const trendArray = dates.map(date => {
        const dateFormatted = new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        return {
          date: dateFormatted,
          hadir: trendDataMap[date].hadir,
          terlambat: trendDataMap[date].terlambat,
          absen: (totalEmployees || 0) - trendDataMap[date].hadir
        };
      });

      setTrendData(trendArray);
    } catch (error) {
      console.error('Error fetching attendance trend:', error);
    }
  };

  const handlePreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const handleDateClick = (day: number | null) => {
    if (!day) return;
    // Format tanggal dengan padding zero untuk konsistensi
    const year = selectedYear;
    const month = String(selectedMonth + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${year}-${month}-${dayStr}`;
    router.push(`/admin/attendance?date=${dateStr}`);
  };

  const getDateColor = (day: number | null) => {
    if (!day) return '';
    // Format tanggal dengan padding zero untuk konsistensi
    const year = selectedYear;
    const month = String(selectedMonth + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${year}-${month}-${dayStr}`;
    const dayData = dailyAttendance[dateStr];
    
    // Cek apakah tanggal sudah lewat atau hari ini (tanpa timezone issue)
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    // Jika tidak ada data
    if (!dayData) {
      // Jika tanggal belum terjadi (masa depan), tampilkan abu-abu
      if (dateStr > todayStr) {
        return 'bg-gray-50 hover:bg-gray-100';
      }
      // Jika hari ini atau masa lalu tanpa data, berarti tidak ada yang absen (0 orang) -> merah
      return 'bg-red-100 hover:bg-red-200 border border-red-300';
    }

    // Total karyawan yang hadir atau terlambat (yang tercatat absensi)
    const totalAttendance = dayData.hadir + dayData.terlambat;
    
    // Jika hanya 0, 1, atau 2 pegawai yang hadir/izin, langsung merah
    if (totalAttendance <= 2) return 'bg-red-100 hover:bg-red-200 border border-red-300';
    
    // Gunakan nilai tengah dari total karyawan (non-manager)
    const totalEmployees = stats.totalEmployees;
    const midpoint = totalEmployees / 2;
    
    // Jika di atas nilai tengah -> hijau
    if (totalAttendance > midpoint) return 'bg-green-100 hover:bg-green-200 border border-green-300';
    // Jika di bawah nilai tengah -> merah
    if (totalAttendance < midpoint) return 'bg-red-100 hover:bg-red-200 border border-red-300';
    // Jika tepat di tengah -> kuning
    return 'bg-yellow-100 hover:bg-yellow-200 border border-yellow-300';
  };

  const isToday = (day: number | null) => {
    if (!day) return false;
    const today = new Date();
    return day === today.getDate() && 
           selectedMonth === today.getMonth() && 
           selectedYear === today.getFullYear();
  };

  const fetchStats = async () => {
    try {
      const { count: employeeCount } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .neq('position', 'Admin');

      // Gunakan timezone Indonesia (WIB)
      const now = new Date();
      // Konversi ke WIB dengan offset +7 jam
      const wibTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
      const today = wibTime.toISOString().split('T')[0];
      
      // Get current shift to filter active workers
      const currentShift = getCurrentShift();
      
      // Count active workers (checked in but not checked out for current shift today)
      const { count: activeWorkersCount } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true })
        .eq('date', today)
        .eq('shift_id', currentShift.id)
        .not('check_in_at', 'is', null)
        .is('check_out_at', null);

      // Get attendance breakdown by status and check_in_at for late detection
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('status, check_in_at, shift_id')
        .eq('date', today);

      let hadirCount = 0;
      let terlambatCount = 0;
      
      attendanceData?.forEach(record => {
        if (record.status === 'Hadir' && record.check_in_at) {
          // Check if late
          const checkInTime = new Date(record.check_in_at);
          const checkInHour = checkInTime.getUTCHours() + 7; // Convert to WIB
          const checkInMinute = checkInTime.getUTCMinutes();
          
          let isLate = false;
          if (record.shift_id === 1) { // Pagi 11:00
            const startTime = 11 * 60; // 11:00 in minutes
            const actualTime = (checkInHour % 24) * 60 + checkInMinute;
            isLate = actualTime > startTime + 5; // Terlambat jika lebih dari 5 menit setelah shift dimulai
          } else if (record.shift_id === 2) { // Malam 19:00
            const startTime = 19 * 60; // 19:00 in minutes
            const actualTime = (checkInHour % 24) * 60 + checkInMinute;
            isLate = actualTime > startTime + 5; // Terlambat jika lebih dari 5 menit setelah shift dimulai
          } else if (record.shift_id === 3) { // Dini Hari 03:00
            const startTime = 3 * 60; // 03:00 in minutes
            const actualTime = (checkInHour % 24) * 60 + checkInMinute;
            isLate = actualTime > startTime + 5; // Terlambat jika lebih dari 5 menit setelah shift dimulai
          }
          
          if (isLate) {
            terlambatCount++;
          } else {
            hadirCount++;
          }
        }
      });
      
      const totalEmployees = employeeCount || 0;
      const absenCount = totalEmployees - hadirCount - terlambatCount;

      const { count: inventoryCount } = await supabase
        .from('inventori')
        .select('*', { count: 'exact', head: true });

      const { count: lowStockCount } = await supabase
        .from('inventori')
        .select('*', { count: 'exact', head: true })
        .lt('jumlah', 10);

      setStats({
        totalEmployees: totalEmployees,
        activeWorkers: activeWorkersCount || 0,
        lowStockItems: lowStockCount || 0,
        totalInventory: inventoryCount || 0,
      });

      setAttendanceStats({
        hadir: hadirCount,
        terlambat: terlambatCount,
        absen: Math.max(0, absenCount),
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Karyawan',
      value: stats.totalEmployees,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      title: 'Sedang Bekerja',
      value: stats.activeWorkers,
      icon: UserCheck,
      color: 'bg-green-500',
    },
    {
      title: 'Total Inventori',
      value: stats.totalInventory,
      icon: Package,
      color: 'bg-purple-500',
    },
    {
      title: 'Stok Menipis',
      value: stats.lowStockItems,
      icon: AlertTriangle,
      color: 'bg-red-500',
    },
  ];

  // Get calendar info
  const monthName = new Date(selectedYear, selectedMonth).toLocaleString('id-ID', { month: 'long' });

  // Generate calendar days for selected month
  const getDaysInMonth = () => {
    const firstDay = new Date(selectedYear, selectedMonth, 1).getDay();
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    
    const days = [];
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    // Add actual days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const calendarDays = getDaysInMonth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-6 mb-4">
          <Image
            src="/images/gallery/november_logo.png"
            alt="November Coffee Logo"
            width={120}
            height={120}
            className="object-contain"
          />
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-2">Selamat datang di Manager Panel</p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Stats & Chart */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            {statCards.map((stat, index) => {
              const Icon = stat.icon;
              const isLowStock = stat.title === 'Stok Menipis' && stat.value > 0;
              
              return (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow relative ${
                    isLowStock ? 'ring-2 ring-red-500' : ''
                  }`}
                >
                  {isLowStock && (
                    <motion.div
                      animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [1, 0.5, 1]
                      }}
                      transition={{ 
                        duration: 1.5, 
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white p-2 rounded-full shadow-lg"
                    >
                      <AlertTriangle className="w-5 h-5" />
                    </motion.div>
                  )}
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1 font-medium">{stat.title}</p>
                      <p className={`text-3xl font-bold ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                        {stat.value}
                      </p>
                      {isLowStock && (
                        <p className="text-xs text-red-600 font-semibold mt-1">
                          ⚠️ Perlu Restock!
                        </p>
                      )}
                    </div>
                    <div className={`${stat.color} p-3 rounded-lg ${isLowStock ? 'animate-pulse' : ''}`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Attendance Donut Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Kehadiran per Shift (7 Hari Terakhir)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={shiftData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '14px' }} />
                <Bar dataKey="Pagi" fill="#10B981" radius={[8, 8, 0, 0]} />
                <Bar dataKey="Malam" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
                <Bar dataKey="Dini Hari" fill="#F59E0B" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Attendance Trend Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Trend Kehadiran & Keterlambatan (30 Hari)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '14px' }} />
                <Line 
                  type="monotone" 
                  dataKey="hadir" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  dot={{ fill: '#10B981', r: 3 }}
                  name="Hadir"
                />
                <Line 
                  type="monotone" 
                  dataKey="terlambat" 
                  stroke="#F59E0B" 
                  strokeWidth={2}
                  dot={{ fill: '#F59E0B', r: 3 }}
                  name="Terlambat"
                />
                <Line 
                  type="monotone" 
                  dataKey="absen" 
                  stroke="#EF4444" 
                  strokeWidth={2}
                  dot={{ fill: '#EF4444', r: 3 }}
                  name="Absen"
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Right Column - Calendar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          {/* Calendar Header with Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={handlePreviousMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            
            <h3 className="text-lg font-semibold text-gray-900">
              {monthName} {selectedYear}
            </h3>
            
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="space-y-2">
            <div className="grid grid-cols-7 gap-1">
              {/* Day Headers */}
              {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((day) => (
                <div key={day} className="text-center text-xs font-semibold text-gray-600 py-2">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                const baseColor = getDateColor(day);
                
                return (
                  <motion.button
                    key={index}
                    onClick={() => handleDateClick(day)}
                    disabled={!day}
                    whileHover={day ? { scale: 1.05 } : {}}
                    whileTap={day ? { scale: 0.95 } : {}}
                    className={`
                      relative aspect-square flex flex-col items-center justify-center text-sm rounded-lg
                      transition-all cursor-pointer
                      ${!day ? 'invisible' : ''}
                      ${baseColor}
                      ${isToday(day) 
                        ? 'ring-4 ring-[#C84B31] ring-offset-2 font-bold' 
                        : 'text-gray-700'
                      }
                      ${day ? 'hover:shadow-md' : ''}
                    `}
                  >
                    {day && (
                      <span className={`font-semibold ${isToday(day) ? 'text-gray-900' : ''}`}>{day}</span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs font-semibold text-gray-600 mb-2">Keterangan:</p>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-100 border border-green-300"></div>
                <span className="text-gray-600">Kehadiran ≥ 80%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-300"></div>
                <span className="text-gray-600">Kehadiran 50-79%</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-red-100 border border-red-300"></div>
                <span className="text-gray-600">Kehadiran &lt; 50%</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3 italic">
              💡 Klik tanggal untuk lihat detail kehadiran
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
