'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Download, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatDate, formatTime, calculateDuration } from '@/lib/utils';

interface AttendanceRecord {
  id: string;
  employee_id: string;
  employee_name: string;
  date: string;
  check_in_at: string;
  check_out_at: string | null;
  duration: string | null;
}

export default function AttendancePage() {
  const [attendance, setAttendance] = React.useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [dateFilter, setDateFilter] = React.useState('');

  React.useEffect(() => {
    fetchAttendance();
  }, [dateFilter]);

  const fetchAttendance = async () => {
    try {
      const url = dateFilter 
        ? `/api/attendance?date=${dateFilter}`
        : '/api/attendance';
      
      const response = await fetch(url);
      const result = await response.json();
      
      if (response.ok) {
        setAttendance(result.data);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Gagal mengambil data absensi');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (attendance.length === 0) {
      toast.error('Tidak ada data untuk diekspor');
      return;
    }

    const headers = ['Tanggal', 'Nama Karyawan', 'ID Karyawan', 'Check In', 'Check Out', 'Durasi'];
    const rows = attendance.map(record => [
      formatDate(new Date(record.date)),
      record.employee_name,
      record.employee_id,
      formatTime(new Date(record.check_in_at)),
      record.check_out_at ? formatTime(new Date(record.check_out_at)) : '-',
      record.duration || '-'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `attendance_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast.success('Data berhasil diekspor');
  };

  const filteredAttendance = attendance.filter(record =>
    record.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.employee_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (checkOut: string | null) => {
    if (!checkOut) {
      return (
        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
          Belum Check Out
        </span>
      );
    }
    return (
      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
        Selesai
      </span>
    );
  };

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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Riwayat Absensi</h1>
          <p className="text-gray-600">Monitor kehadiran karyawan November Coffee</p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 bg-[#C84B31] text-white px-6 py-3 rounded-lg hover:bg-[#A03B24] transition-colors"
        >
          <Download className="w-5 h-5" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari karyawan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C84B31] focus:border-transparent"
            />
          </div>

          {/* Date Filter */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C84B31] focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Tanggal</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Nama Karyawan</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">ID</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Check In</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Check Out</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Durasi</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAttendance.map((record, index) => (
                <motion.tr
                  key={record.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {formatDate(new Date(record.date))}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {record.employee_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {record.employee_id}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {formatTime(new Date(record.check_in_at))}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {record.check_out_at ? formatTime(new Date(record.check_out_at)) : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {record.duration || '-'}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(record.check_out_at)}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>

          {filteredAttendance.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Tidak ada data absensi
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
