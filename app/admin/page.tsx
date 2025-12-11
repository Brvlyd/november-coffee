'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Users, UserCheck, Package, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Stats {
  totalEmployees: number;
  todayAttendance: number;
  lowStockItems: number;
  totalInventory: number;
}

interface ActivityData {
  day: string;
  value: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = React.useState<Stats>({
    totalEmployees: 0,
    todayAttendance: 0,
    lowStockItems: 0,
    totalInventory: 0,
  });
  const [loading, setLoading] = React.useState(true);

  // Mock activity data for chart
  const activityData: ActivityData[] = [
    { day: 'Mon', value: 8 },
    { day: 'Tue', value: 12 },
    { day: 'Wed', value: 10 },
    { day: 'Thu', value: 15 },
    { day: 'Fri', value: 14 },
    { day: 'Sat', value: 18 },
    { day: 'Sun', value: 16 },
  ];

  const maxValue = Math.max(...activityData.map(d => d.value));

  React.useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { count: employeeCount } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .neq('role', 'admin');

      const today = new Date().toISOString().split('T')[0];
      const { count: attendanceCount } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true })
        .eq('date', today);

      const { count: inventoryCount } = await supabase
        .from('inventori')
        .select('*', { count: 'exact', head: true });

      const { count: lowStockCount } = await supabase
        .from('inventori')
        .select('*', { count: 'exact', head: true })
        .lt('quantity', 10);

      setStats({
        totalEmployees: employeeCount || 0,
        todayAttendance: attendanceCount || 0,
        lowStockItems: lowStockCount || 0,
        totalInventory: inventoryCount || 0,
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

  // Get current date info for calendar
  const currentDate = new Date();
  const currentDay = currentDate.getDate();
  const currentMonth = currentDate.toLocaleString('id-ID', { month: 'long' });
  const currentYear = currentDate.getFullYear();

  // Generate calendar days for current month
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
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
        <p className="text-gray-600">Selamat datang di November Coffee Admin Panel</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Stats & Chart */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            {statCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                      <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <div className={`${stat.color} p-3 rounded-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Activity Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Activity Hour</h3>
            <div className="flex items-end justify-between gap-4 h-64">
              {activityData.map((item, index) => {
                const height = (item.value / maxValue) * 100;
                return (
                  <div key={item.day} className="flex-1 flex flex-col items-center gap-2">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                      className="w-full bg-[#C84B31] rounded-t-lg relative group"
                      style={{ minHeight: '20px' }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded">
                        {item.value}h
                      </div>
                    </motion.div>
                    <span className="text-sm text-gray-600">{item.day}</span>
                  </div>
                );
              })}
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
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{currentMonth} {currentYear}</h3>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Day Headers */}
            {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-600 pb-2">
                {day}
              </div>
            ))}
            
            {/* Calendar Days */}
            {calendarDays.map((day, index) => (
              <div
                key={index}
                className={`
                  aspect-square flex items-center justify-center text-sm rounded-lg
                  ${!day ? 'invisible' : ''}
                  ${day === currentDay 
                    ? 'bg-[#C84B31] text-white font-bold' 
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                {day}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
