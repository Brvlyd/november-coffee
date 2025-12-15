'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Users, UserCheck, Package, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface Stats {
  totalEmployees: number;
  todayAttendance: number;
  lowStockItems: number;
  totalInventory: number;
}

interface AttendanceStats {
  hadir: number;
  izin: number;
  absen: number;
}

interface DailyAttendance {
  [date: string]: {
    total: number;
    hadir: number;
    izin: number;
    absen: number;
  };
}

export default function ManagerDashboard() {
  const router = useRouter();
  const [stats, setStats] = React.useState<Stats>({
    totalEmployees: 0,
    todayAttendance: 0,
    lowStockItems: 0,
    totalInventory: 0,
  });
  const [attendanceStats, setAttendanceStats] = React.useState<AttendanceStats>({
    hadir: 0,
    izin: 0,
    absen: 0,
  });
  const [dailyAttendance, setDailyAttendance] = React.useState<DailyAttendance>({});
  const [selectedMonth, setSelectedMonth] = React.useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = React.useState(new Date().getFullYear());
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    // Initial fetch
    fetchStats();
    fetchMonthlyAttendance();

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

      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('date, status, employee_id')
        .gte('date', startDate)
        .lte('date', endDate);

      const { count: totalEmployees } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .neq('position', 'Admin');

      // Group by date
      const dailyData: DailyAttendance = {};
      attendanceData?.forEach((record) => {
        const date = record.date;
        if (!dailyData[date]) {
          dailyData[date] = { total: 0, hadir: 0, izin: 0, absen: 0 };
        }
        dailyData[date].total++;
        // Jika status adalah 'Hadir' atau null/belum check-out, hitung sebagai hadir
        if (record.status === 'Hadir' || !record.status) {
          dailyData[date].hadir++;
        }
        if (record.status === 'Izin') dailyData[date].izin++;
      });

      // Calculate absen for each day
      Object.keys(dailyData).forEach(date => {
        const dayData = dailyData[date];
        dayData.absen = (totalEmployees || 0) - dayData.hadir - dayData.izin;
      });

      setDailyAttendance(dailyData);
    } catch (error) {
      console.error('Error fetching monthly attendance:', error);
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

    // Total karyawan yang hadir atau izin (yang tercatat absensi)
    const totalAttendance = dayData.hadir + dayData.izin;
    
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

      const today = new Date().toISOString().split('T')[0];
      const { count: attendanceCount } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true })
        .eq('date', today);

      // Get attendance breakdown by status
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('status')
        .eq('date', today);

      const hadirCount = attendanceData?.filter(a => a.status === 'Hadir').length || 0;
      const izinCount = attendanceData?.filter(a => a.status === 'Izin').length || 0;
      const totalEmployees = employeeCount || 0;
      const absenCount = totalEmployees - hadirCount - izinCount;

      const { count: inventoryCount } = await supabase
        .from('inventori')
        .select('*', { count: 'exact', head: true });

      const { count: lowStockCount } = await supabase
        .from('inventori')
        .select('*', { count: 'exact', head: true })
        .lt('jumlah', 10);

      setStats({
        totalEmployees: totalEmployees,
        todayAttendance: attendanceCount || 0,
        lowStockItems: lowStockCount || 0,
        totalInventory: inventoryCount || 0,
      });

      setAttendanceStats({
        hadir: hadirCount,
        izin: izinCount,
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
      title: 'Hadir Hari Ini',
      value: stats.todayAttendance,
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Selamat datang di November Coffee Manager Panel</p>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Grafik Kehadiran Karyawan</h3>
            <div className="flex items-center justify-center">
              {/* Donut Chart */}
              <div className="relative w-64 h-64">
                {/* SVG Donut */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {(() => {
                    const total = attendanceStats.hadir + attendanceStats.izin + attendanceStats.absen;
                    if (total === 0) {
                      return (
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke="#E5E7EB"
                          strokeWidth="20"
                        />
                      );
                    }

                    const radius = 40;
                    const circumference = 2 * Math.PI * radius;
                    
                    const hadirPercent = (attendanceStats.hadir / total) * 100;
                    const izinPercent = (attendanceStats.izin / total) * 100;
                    const absenPercent = (attendanceStats.absen / total) * 100;

                    const hadirLength = (hadirPercent / 100) * circumference;
                    const izinLength = (izinPercent / 100) * circumference;
                    const absenLength = (absenPercent / 100) * circumference;

                    let offset = 0;

                    return (
                      <>
                        {/* Hadir - Green */}
                        {attendanceStats.hadir > 0 && (
                          <motion.circle
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset: offset }}
                            transition={{ duration: 1, delay: 0.5 }}
                            cx="50"
                            cy="50"
                            r={radius}
                            fill="none"
                            stroke="#10B981"
                            strokeWidth="20"
                            strokeDasharray={`${hadirLength} ${circumference}`}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                          />
                        )}
                        
                        {/* Izin - Yellow */}
                        {attendanceStats.izin > 0 && (() => {
                          offset -= hadirLength;
                          return (
                            <motion.circle
                              initial={{ strokeDashoffset: circumference }}
                              animate={{ strokeDashoffset: offset }}
                              transition={{ duration: 1, delay: 0.7 }}
                              cx="50"
                              cy="50"
                              r={radius}
                              fill="none"
                              stroke="#F59E0B"
                              strokeWidth="20"
                              strokeDasharray={`${izinLength} ${circumference}`}
                              strokeDashoffset={offset}
                              strokeLinecap="round"
                            />
                          );
                        })()}
                        
                        {/* Absen - Red */}
                        {attendanceStats.absen > 0 && (() => {
                          offset -= izinLength;
                          return (
                            <motion.circle
                              initial={{ strokeDashoffset: circumference }}
                              animate={{ strokeDashoffset: offset }}
                              transition={{ duration: 1, delay: 0.9 }}
                              cx="50"
                              cy="50"
                              r={radius}
                              fill="none"
                              stroke="#EF4444"
                              strokeWidth="20"
                              strokeDasharray={`${absenLength} ${circumference}`}
                              strokeDashoffset={offset}
                              strokeLinecap="round"
                            />
                          );
                        })()}
                      </>
                    );
                  })()}
                </svg>

                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-3xl font-bold text-gray-900">{stats.totalEmployees}</p>
                  <p className="text-sm text-gray-600 font-medium">Total Karyawan</p>
                </div>
              </div>

              {/* Legend */}
              <div className="ml-8 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Hadir</p>
                    <p className="text-2xl font-bold text-green-600">{attendanceStats.hadir}</p>
                    <p className="text-xs text-gray-500">
                      {stats.totalEmployees > 0 
                        ? `${Math.round((attendanceStats.hadir / stats.totalEmployees) * 100)}%`
                        : '0%'
                      }
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Izin</p>
                    <p className="text-2xl font-bold text-yellow-600">{attendanceStats.izin}</p>
                    <p className="text-xs text-gray-500">
                      {stats.totalEmployees > 0 
                        ? `${Math.round((attendanceStats.izin / stats.totalEmployees) * 100)}%`
                        : '0%'
                      }
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Absen</p>
                    <p className="text-2xl font-bold text-red-600">{attendanceStats.absen}</p>
                    <p className="text-xs text-gray-500">
                      {stats.totalEmployees > 0 
                        ? `${Math.round((attendanceStats.absen / stats.totalEmployees) * 100)}%`
                        : '0%'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
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
