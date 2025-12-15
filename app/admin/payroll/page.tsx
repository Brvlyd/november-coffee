'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Download, Search, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface PayrollRecord {
  id: string;
  employee_id: string;
  employee_name: string;
  position: string;
  period: string;
  total_days: number;
  basic_salary: number;
  allowance: number;
  deductions: number;
  total_salary: number;
}

export default function PayrollPage() {
  const [payroll, setPayroll] = React.useState<PayrollRecord[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [periodFilter, setPeriodFilter] = React.useState('');

  React.useEffect(() => {
    // Simulate fetching payroll data
    setTimeout(() => {
      const mockData: PayrollRecord[] = [
        {
          id: '1',
          employee_id: 'EMP001',
          employee_name: 'John Doe',
          position: 'Barista',
          period: '2025-12',
          total_days: 26,
          basic_salary: 5000000,
          allowance: 500000,
          deductions: 100000,
          total_salary: 5400000,
        },
        {
          id: '2',
          employee_id: 'EMP002',
          employee_name: 'Jane Smith',
          position: 'Cashier',
          period: '2025-12',
          total_days: 24,
          basic_salary: 4500000,
          allowance: 450000,
          deductions: 90000,
          total_salary: 4860000,
        },
      ];
      setPayroll(mockData);
      setLoading(false);
    }, 500);
  }, [periodFilter]);

  const filteredPayroll = payroll.filter(record =>
    record.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const downloadSlip = (record: PayrollRecord) => {
    toast.success(`Slip gaji ${record.employee_name} berhasil diunduh`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600 font-medium">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Slip Gaji</h1>
          <p className="text-gray-600 font-medium">Kelola data slip gaji karyawan</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari karyawan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C84B31] focus:border-transparent text-gray-900 font-medium placeholder:text-gray-400"
            />
          </div>

          {/* Period Filter */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="month"
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C84B31] focus:border-transparent text-gray-900 font-medium"
            />
          </div>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-[#C84B31] to-[#A03920] text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">ID Karyawan</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Nama</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Posisi</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Periode</th>
                <th className="px-6 py-4 text-right text-sm font-semibold">Hari Kerja</th>
                <th className="px-6 py-4 text-right text-sm font-semibold">Gaji Pokok</th>
                <th className="px-6 py-4 text-right text-sm font-semibold">Tunjangan</th>
                <th className="px-6 py-4 text-right text-sm font-semibold">Potongan</th>
                <th className="px-6 py-4 text-right text-sm font-semibold">Total Gaji</th>
                <th className="px-6 py-4 text-center text-sm font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPayroll.map((record, index) => (
                <motion.tr
                  key={record.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {record.employee_id}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {record.employee_name}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-[#C84B31]">
                    {record.position}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                    {new Date(record.period + '-01').toLocaleDateString('id-ID', { 
                      year: 'numeric', 
                      month: 'long' 
                    })}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-gray-900 font-semibold">
                    {record.total_days} hari
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-gray-900 font-medium">
                    {formatCurrency(record.basic_salary)}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-green-600 font-medium">
                    {formatCurrency(record.allowance)}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-red-600 font-medium">
                    {formatCurrency(record.deductions)}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-gray-900 font-bold">
                    {formatCurrency(record.total_salary)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => downloadSlip(record)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-semibold text-sm"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredPayroll.length === 0 && (
        <div className="text-center py-12 text-gray-500 bg-white rounded-lg mt-6">
          <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="font-medium">Tidak ada data slip gaji</p>
        </div>
      )}
    </div>
  );
}
