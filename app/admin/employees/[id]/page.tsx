'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit2, Save, X, User, Calendar, Mail, Briefcase, Clock, Trash2, DollarSign, FileText, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Employee {
  id: string;
  employee_id: string;
  full_name: string;
  position: string;
  employment_status: string;
  email: string;
  created_at: string;
  join_date: string;
}

interface AttendanceRecord {
  id: string;
  date: string;
  check_in_at: string;
  check_out_at: string | null;
  status: string;
  shift_id: number;
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

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [employee, setEmployee] = React.useState<Employee | null>(null);
  const [attendance, setAttendance] = React.useState<AttendanceRecord[]>([]);
  const [currentWeekData, setCurrentWeekData] = React.useState<WeeklyData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isEditing, setIsEditing] = React.useState(false);
  const [idError, setIdError] = React.useState('');
  
  const [formData, setFormData] = React.useState({
    employee_id: '',
    full_name: '',
    position: '',
    employment_status: '',
    email: '',
    password: '',
    join_date: '',
  });

  React.useEffect(() => {
    if (params.id) {
      fetchEmployeeData();
      fetchAttendance();
    }
  }, [params.id]);

  React.useEffect(() => {
    if (attendance.length > 0) {
      processCurrentWeekData();
    } else {
      setCurrentWeekData(null);
    }
  }, [attendance]);

  const fetchEmployeeData = async () => {
    try {
      const response = await fetch('/api/employees');
      const result = await response.json();
      
      if (response.ok) {
        const emp = result.data.find((e: Employee) => e.id === params.id);
        if (emp) {
          setEmployee(emp);
          setFormData({
            employee_id: emp.employee_id,
            full_name: emp.full_name,
            position: emp.position,
            employment_status: emp.employment_status,
            email: emp.email,
            password: '',
            join_date: emp.join_date || emp.created_at,
          });
        } else {
          toast.error('Karyawan tidak ditemukan');
          router.push('/admin/employees');
        }
      }
    } catch (error) {
      toast.error('Gagal mengambil data karyawan');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async () => {
    try {
      const response = await fetch('/api/attendance');
      const result = await response.json();
      
      if (response.ok) {
        const empAttendance = result.data.filter(
          (a: any) => a.employee_id === params.id
        );
        // Sort by date descending (newest first)
        empAttendance.sort((a: AttendanceRecord, b: AttendanceRecord) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setAttendance(empAttendance);
      }
    } catch (error) {
      console.error('Failed to fetch attendance');
    }
  };

  const getCurrentWeekStart = (): Date => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
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

  const processCurrentWeekData = () => {
    const weekStart = getCurrentWeekStart();
    const weekEnd = getCurrentWeekEnd();

    // Filter attendance for current week only
    const currentWeekAttendance = attendance.filter((record) => {
      const recordDate = new Date(record.date);
      return recordDate >= weekStart && recordDate <= weekEnd;
    });

    if (currentWeekAttendance.length === 0) {
      setCurrentWeekData(null);
      return;
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

    setCurrentWeekData({
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0],
      attendance: currentWeekAttendance,
      totalShifts,
      totalLateMinutes,
      grossSalary,
      penalty,
      netSalary,
    });
  };

  const handleUpdate = async () => {
    if (!employee) return;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Format email tidak valid!');
      return;
    }

    // Validate employee ID format
    if (!validateEmployeeId(formData.employee_id)) {
      toast.error('Format ID Karyawan tidak valid!');
      return;
    }

    try {
      // Force Manager status to always be Active
      const dataToUpdate = {
        id: employee.id,
        ...formData,
        employment_status: employee.position === 'Manager' ? 'Active' : formData.employment_status
      };

      const response = await fetch('/api/employees', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToUpdate),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Data karyawan berhasil diupdate');
        setIsEditing(false);
        setIdError('');
        fetchEmployeeData();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Terjadi kesalahan');
    }
  };

  const validateEmployeeId = (id: string): boolean => {
    // Format: 2 huruf + 8 angka (DDMMYYYY) + 3 angka (total 13 karakter)
    // Contoh: BA16122025001
    const regex = /^[A-Z]{2}\d{8}\d{3}$/;
    
    if (!regex.test(id)) {
      setIdError('Format harus: 2 huruf + tanggal (DDMMYYYY) + 3 digit urutan');
      return false;
    }

    // Validate position code
    const positionCode = id.substring(0, 2);
    const validCodes = ['BA', 'KA', 'GU', 'MA'];
    
    if (!validCodes.includes(positionCode)) {
      setIdError('Kode posisi harus: BA (Barista), KA (Kasir), GU (Gudang), atau MA (Manager)');
      return false;
    }

    // Validate date
    const day = parseInt(id.substring(2, 4));
    const month = parseInt(id.substring(4, 6));
    const year = parseInt(id.substring(6, 10));
    
    if (day < 1 || day > 31) {
      setIdError('Tanggal tidak valid (harus 01-31)');
      return false;
    }
    
    if (month < 1 || month > 12) {
      setIdError('Bulan tidak valid (harus 01-12)');
      return false;
    }
    
    if (year < 2000 || year > 2100) {
      setIdError('Tahun tidak valid');
      return false;
    }

    // Validate sequence number
    const sequence = parseInt(id.substring(10, 13));
    if (sequence < 1 || sequence > 999) {
      setIdError('Nomor urut harus 001-999');
      return false;
    }

    setIdError('');
    return true;
  };

  const handleDelete = async () => {
    if (!employee) return;
    if (!confirm('Yakin ingin menghapus karyawan ini? Data absensi juga akan terhapus.')) return;

    try {
      const response = await fetch('/api/employees', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: employee.id }),
      });

      if (response.ok) {
        toast.success('Karyawan berhasil dihapus');
        router.push('/admin/employees');
      } else {
        toast.error('Gagal menghapus karyawan');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan');
    }
  };

  const calculateWorkDuration = () => {
    if (!employee) return '';
    
    const startDate = new Date(employee.join_date || employee.created_at);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);
    const days = diffDays % 30;
    
    let duration = '';
    if (years > 0) duration += `${years} tahun `;
    if (months > 0) duration += `${months} bulan `;
    if (days > 0 || duration === '') duration += `${days} hari`;
    
    return duration.trim();
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

  const goToSalarySlip = () => {
    if (!currentWeekData) {
      toast.error('Tidak ada data absensi untuk minggu ini');
      return;
    }
    router.push(`/admin/employees/${params.id}/slip-gaji`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!employee) {
    return null;
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.push('/admin/employees')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Detail Karyawan</h1>
          <p className="text-gray-600 font-medium">Informasi lengkap dan riwayat absensi</p>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 bg-[#C84B31] text-white px-6 py-3 rounded-lg hover:bg-[#A03B24] transition-colors font-semibold"
          >
            <Edit2 className="w-5 h-5" />
            Edit Data
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setIsEditing(false);
                setIdError('');
                setFormData({
                  employee_id: employee.employee_id,
                  full_name: employee.full_name,
                  position: employee.position,
                  employment_status: employee.employment_status,
                  email: employee.email,
                  password: '',
                  join_date: employee.join_date || employee.created_at,
                });
              }}
              className="flex items-center gap-2 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
            >
              <X className="w-5 h-5" />
              Batal
            </button>
            <button
              onClick={handleUpdate}
              className="flex items-center gap-2 bg-[#C84B31] text-white px-6 py-3 rounded-lg hover:bg-[#A03B24] transition-colors font-semibold"
            >
              <Save className="w-5 h-5" />
              Simpan
            </button>
          </div>
        )}
      </div>

      <div className={`grid gap-6 ${employee.position === 'Manager' ? 'grid-cols-1 max-w-2xl mx-auto' : 'grid-cols-1 lg:grid-cols-3'}`}>
        {/* Employee Info Card */}
        <div className={employee.position === 'Manager' ? '' : 'lg:col-span-1'}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-gradient-to-br from-[#E07856] to-[#D96846] rounded-2xl shadow-lg p-6"
          >
            {/* Avatar */}
            <div className="flex justify-center mb-6">
              <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center shadow-md ring-4 ring-white/30">
                <User className="w-20 h-20 text-[#C84B31]" />
              </div>
            </div>

            {/* Basic Info */}
            {!isEditing ? (
              <div className="space-y-4">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white mb-2">{employee.full_name}</h2>
                  <p className="text-white/90 text-lg font-medium">{employee.position}</p>
                </div>

                <div className="space-y-3 pt-4 border-t border-white/20">
                  <div className="flex items-start gap-3 text-white">
                    <Briefcase className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-white/80 font-semibold">ID Karyawan</p>
                      <p className="font-medium">{employee.employee_id}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-white">
                    <Mail className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-white/80 font-semibold">Email</p>
                      <p className="font-medium break-all">{employee.email}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-white">
                    <Calendar className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-white/80 font-semibold">Status</p>
                      <p className="font-medium">{employee.employment_status}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-white">
                    <Clock className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-white/80 font-semibold">Lama Bekerja</p>
                      <p className="font-medium">{calculateWorkDuration()}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 text-white">
                    <Calendar className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-white/80 font-semibold">Tanggal Bergabung</p>
                      <p className="font-medium">{formatDate(employee.join_date || employee.created_at)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    ID Karyawan
                  </label>
                  <input
                    type="text"
                    value={formData.employee_id}
                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value.toUpperCase() })}
                    maxLength={13}
                    className={`w-full px-4 py-2 border-2 backdrop-blur-sm rounded-lg focus:outline-none focus:ring-2 text-white font-medium placeholder:text-white/50 ${
                      idError 
                        ? 'border-red-400 bg-red-500/20 focus:ring-red-400' 
                        : 'border-white/30 bg-white/10 focus:ring-white'
                    }`}
                    placeholder="Contoh: BA16122025001"
                  />
                  {idError && (
                    <p className="mt-1 text-xs text-red-200 font-semibold">{idError}</p>
                  )}
                  <p className="mt-1 text-xs text-white/70">Format: 2 huruf + DD + MM + YYYY + 3 digit urutan (total 13 karakter)</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-white/30 bg-white/10 backdrop-blur-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-white font-medium placeholder:text-white/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Posisi
                  </label>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-white/30 bg-white/10 backdrop-blur-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-white font-medium"
                  >
                    <option value="Barista" className="text-gray-900">Barista</option>
                    <option value="Kasir" className="text-gray-900">Kasir</option>
                    <option value="Gudang" className="text-gray-900">Gudang</option>
                    <option value="Manager" className="text-gray-900">Manager</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Status Karyawan
                  </label>
                  <select
                    value={formData.employment_status}
                    onChange={(e) => setFormData({ ...formData, employment_status: e.target.value })}
                    disabled={employee.position === 'Manager'}
                    className={`w-full px-4 py-2 border-2 border-white/30 bg-white/10 backdrop-blur-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-white font-medium ${
                      employee.position === 'Manager' ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                  >
                    <option value="Active" className="text-gray-900">Active</option>
                    <option value="Inactive" className="text-gray-900">Inactive</option>
                    <option value="On Leave" className="text-gray-900">On Leave</option>
                  </select>
                  {employee.position === 'Manager' && (
                    <p className="mt-1 text-xs text-white/70">Manager selalu berstatus Active</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-white/30 bg-white/10 backdrop-blur-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-white font-medium placeholder:text-white/50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Tanggal Bergabung
                  </label>
                  <input
                    type="date"
                    value={formData.join_date ? new Date(formData.join_date).toISOString().split('T')[0] : ''}
                    onChange={(e) => setFormData({ ...formData, join_date: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-white/30 bg-white/10 backdrop-blur-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-white font-medium placeholder:text-white/50"
                  />
                  <p className="mt-1 text-xs text-white/70">Tanggal ini akan digunakan untuk menghitung lama bekerja</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Status Karyawan
                  </label>
                  <select
                    value={formData.employment_status}
                    onChange={(e) => setFormData({ ...formData, employment_status: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-white/30 bg-white/10 backdrop-blur-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-white font-medium"
                  >
                    <option value="Active" className="text-gray-900">Active</option>
                    <option value="Inactive" className="text-gray-900">Inactive</option>
                    <option value="On Leave" className="text-gray-900">On Leave</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    Password Baru (kosongkan jika tidak diubah)
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-white/30 bg-white/10 backdrop-blur-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-white font-medium placeholder:text-white/50"
                    placeholder="Masukkan password baru"
                  />
                </div>
              </div>
            )}

            {/* Delete Button */}
            {employee.position.toLowerCase() !== 'manager' && (
              <div className="mt-6 pt-6 border-t border-white/20">
                <button
                  onClick={handleDelete}
                  className="w-full bg-red-600 text-white py-3 rounded-xl hover:bg-red-700 transition-colors font-bold flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-5 h-5" />
                  Hapus Karyawan
                </button>
              </div>
            )}
          </motion.div>
        </div>

        {/* Current Week Attendance & Salary - Hide for Manager */}
        {employee.position !== 'Manager' && (
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Absensi & Gaji Minggu Ini</h2>
            
            {!currentWeekData ? (
              <div className="text-center py-12 text-gray-500">
                Belum ada data absensi minggu ini
              </div>
            ) : (
              <div>
                {/* Week Header */}
                <div className="bg-gradient-to-r from-[#E07856] to-[#D96846] p-6 rounded-xl mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-2xl mb-2">
                        Minggu Berjalan
                      </h3>
                      <p className="text-white/90 text-base">
                        {formatDate(currentWeekData.weekStart)} - {formatDate(currentWeekData.weekEnd)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-white/80 text-sm font-semibold mb-1">Gaji Bersih</p>
                      <p className="text-white font-bold text-3xl">
                        {formatCurrency(currentWeekData.netSalary)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Week Summary */}
                <div className="bg-gray-50 p-6 rounded-xl mb-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-gray-600 text-sm font-semibold mb-2">Total Shift</p>
                    <p className="text-gray-900 font-bold text-2xl">{currentWeekData.totalShifts} shift</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm font-semibold mb-2">Gaji Kotor</p>
                    <p className="text-gray-900 font-bold text-2xl">{formatCurrency(currentWeekData.grossSalary)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm font-semibold mb-2">Keterlambatan</p>
                    <p className="text-red-600 font-bold text-2xl">{currentWeekData.totalLateMinutes} menit</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm font-semibold mb-2">Denda</p>
                    <p className="text-red-600 font-bold text-2xl">{formatCurrency(currentWeekData.penalty)}</p>
                  </div>
                </div>

                {/* Attendance Details */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Detail Absensi Minggu Ini</h3>
                  <div className="space-y-3">
                    {currentWeekData.attendance.map((record) => (
                      <div
                        key={record.id}
                        className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-bold text-gray-900 text-lg">
                                {getDayName(record.date)}
                              </h4>
                              <span className="text-gray-600 font-medium">
                                {formatDate(record.date)}
                              </span>
                            </div>
                            <div className="flex items-center gap-6 text-sm">
                              <div>
                                <span className="text-gray-600 font-semibold">Check In: </span>
                                <span className="text-gray-900 font-bold">{formatTime(record.check_in_at)}</span>
                              </div>
                              <div>
                                <span className="text-gray-600 font-semibold">Check Out: </span>
                                <span className="text-gray-900 font-bold">{formatTime(record.check_out_at)}</span>
                              </div>
                            </div>
                          </div>
                          <span
                            className={`px-4 py-2 rounded-lg text-sm font-bold ${
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
                      </div>
                    ))}
                  </div>
                </div>

                {/* Generate Slip Button */}
                <button
                  onClick={goToSalarySlip}
                  className="w-full bg-[#C84B31] text-white py-4 rounded-xl hover:bg-[#A03B24] transition-colors font-bold flex items-center justify-center gap-3 text-lg shadow-lg"
                >
                  <Download className="w-6 h-6" />
                  Lihat & Generate Slip Gaji
                </button>
              </div>
            )}
          </motion.div>
        </div>
        )}
      </div>
    </div>
  );
}
