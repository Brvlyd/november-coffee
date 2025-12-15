'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, User, Filter, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';

interface Employee {
  id: string;
  employee_id: string;
  full_name: string;
  position: string;
  employment_status: string;
  email: string;
  password: string;
  created_at: string;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [idError, setIdError] = React.useState('');
  const [isGeneratingIds, setIsGeneratingIds] = React.useState(false);
  const [filterWeek, setFilterWeek] = React.useState<'all' | 'current' | 'last1' | 'last2' | 'last3'>('all');
  const [attendance, setAttendance] = React.useState<any[]>([]);
  const [employeesWithAttendance, setEmployeesWithAttendance] = React.useState<Set<string>>(new Set());
  const [selectedWeekInfo, setSelectedWeekInfo] = React.useState<string>('');
  const [weekRanges, setWeekRanges] = React.useState<{ [key: string]: string }>({});
  const router = useRouter();
  
  const [formData, setFormData] = React.useState({
    employee_id: '',
    full_name: '',
    position: 'Barista',
    employment_status: 'Active',
    email: '',
    password: '',
  });

  const generateEmployeeId = (position: string, employeeCount: number) => {
    const positionCodes: { [key: string]: string } = {
      'Gudang': 'GU',
      'Barista': 'BA',
      'Kasir': 'KA',
      'Manager': 'MA',
    };

    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear());
    const sequence = String(employeeCount + 1).padStart(3, '0');

    const positionCode = positionCodes[position] || 'XX';
    return `${positionCode}${day}${month}${year}${sequence}`;
  };

  React.useEffect(() => {
    fetchEmployees();
    fetchAttendance();
    calculateAllWeekRanges();
  }, []);

  React.useEffect(() => {
    if (filterWeek !== 'all') {
      processWeekAttendance(filterWeek);
    }
  }, [attendance, filterWeek]);

  const getWeekRange = (weeksAgo: number): { start: Date; end: Date } => {
    const now = new Date();
    const currentDay = now.getDay();
    
    // Calculate days to subtract to get to Monday of current week
    // If Sunday (0), go back 6 days; if Monday (1), go back 0 days; etc.
    const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
    
    // Get Monday of current week
    const currentWeekMonday = new Date(now);
    currentWeekMonday.setDate(now.getDate() - daysToMonday);
    currentWeekMonday.setHours(0, 0, 0, 0);
    
    // Subtract weeks to get the target Monday
    const targetWeekMonday = new Date(currentWeekMonday);
    targetWeekMonday.setDate(currentWeekMonday.getDate() - (weeksAgo * 7));
    
    // Get Sunday of target week (6 days after Monday)
    const targetWeekSunday = new Date(targetWeekMonday);
    targetWeekSunday.setDate(targetWeekMonday.getDate() + 6);
    targetWeekSunday.setHours(23, 59, 59, 999);
    
    return { start: targetWeekMonday, end: targetWeekSunday };
  };

  const formatDateShort = (date: Date) => {
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  const calculateAllWeekRanges = () => {
    const ranges: { [key: string]: string } = {};
    
    for (let i = 0; i <= 3; i++) {
      const { start, end } = getWeekRange(i);
      const key = i === 0 ? 'current' : `last${i}`;
      ranges[key] = `${formatDateShort(start)} - ${formatDateShort(end)}`;
    }
    
    setWeekRanges(ranges);
  };

  const getCurrentWeekStart = (): Date => {
    return getWeekRange(0).start;
  };

  const getCurrentWeekEnd = (): Date => {
    return getWeekRange(0).end;
  };

  const processWeekAttendance = (weekType: 'current' | 'last1' | 'last2' | 'last3') => {
    const weeksAgo = weekType === 'current' ? 0 : weekType === 'last1' ? 1 : weekType === 'last2' ? 2 : 3;
    const { start: weekStart, end: weekEnd } = getWeekRange(weeksAgo);

    const employeesInWeek = new Set<string>();

    attendance.forEach((record: any) => {
      const recordDate = new Date(record.date);
      if (recordDate >= weekStart && recordDate <= weekEnd && record.check_in) {
        employeesInWeek.add(record.employee_id);
      }
    });

    setEmployeesWithAttendance(employeesInWeek);
    
    // Set week info for display
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    };
    setSelectedWeekInfo(`${formatDate(weekStart)} - ${formatDate(weekEnd)}`);
  };

  const fetchAttendance = async () => {
    try {
      const response = await fetch('/api/attendance');
      const result = await response.json();
      
      if (response.ok) {
        setAttendance(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch attendance');
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      const result = await response.json();
      
      if (response.ok) {
        setEmployees(result.data.filter((emp: Employee) => emp.position !== 'Admin'));
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Gagal mengambil data karyawan');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.full_name || !formData.employee_id) {
      toast.error('Nama dan ID Karyawan harus diisi');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Format email tidak valid!');
      return;
    }

    // Validate employee ID format
    if (!validateEmployeeId(formData.employee_id)) {
      toast.error('Format ID Karyawan tidak valid! Periksa kembali.');
      return;
    }

    try {
      const url = '/api/employees';
      const method = 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Karyawan berhasil ditambahkan');
        fetchEmployees();
        closeModal();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Terjadi kesalahan');
    }
  };

  const validateEmployeeId = (id: string): boolean => {
    // Format: 2 huruf + 8 angka (DDMMYYYY) + 3 angka (total 13 karakter)
    const regex = /^[A-Z]{2}\d{8}\d{3}$/;
    
    if (!regex.test(id)) {
      setIdError('Format harus: 2 huruf + tanggal (DDMMYYYY) + 3 digit urutan');
      return false;
    }

    const positionCode = id.substring(0, 2);
    const validCodes = ['BA', 'KA', 'GU', 'MA'];
    
    if (!validCodes.includes(positionCode)) {
      setIdError('Kode posisi harus: BA, KA, GU, atau MA');
      return false;
    }

    const day = parseInt(id.substring(2, 4));
    const month = parseInt(id.substring(4, 6));
    const year = parseInt(id.substring(6, 10));
    
    if (day < 1 || day > 31 || month < 1 || month > 12 || year < 2000 || year > 2100) {
      setIdError('Tanggal tidak valid');
      return false;
    }

    const sequence = parseInt(id.substring(10, 13));
    if (sequence < 1 || sequence > 999) {
      setIdError('Nomor urut harus 001-999');
      return false;
    }

    setIdError('');
    return true;
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus karyawan ini?')) return;

    try {
      const response = await fetch('/api/employees', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        toast.success('Karyawan berhasil dihapus');
        fetchEmployees();
      } else {
        toast.error('Gagal menghapus karyawan');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan');
    }
  };

  const openModal = () => {
    const newId = generateEmployeeId(formData.position, employees.length);
    setFormData({ ...formData, employee_id: newId });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIdError('');
    setFormData({
      employee_id: '',
      full_name: '',
      position: 'Barista',
      employment_status: 'Active',
      email: '',
      password: '',
    });
  };

  const handlePositionChange = (newPosition: string) => {
    const newId = generateEmployeeId(newPosition, employees.length);
    setFormData({ ...formData, position: newPosition, employee_id: newId });
  };

  const autoGenerateAllIds = async () => {
    if (!confirm('Auto-generate ID untuk semua karyawan? ID yang sudah sesuai format tidak akan diubah.')) return;

    setIsGeneratingIds(true);
    let updatedCount = 0;
    let errorCount = 0;

    try {
      const positionCounts: { [key: string]: number } = {
        'Barista': 0,
        'Kasir': 0,
        'Gudang': 0,
        'Manager': 0,
      };

      // Sort employees by created_at
      const sortedEmployees = [...employees].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      for (const emp of sortedEmployees) {
        // Skip if ID already has correct format
        const regex = /^[A-Z]{2}\d{11}$/;
        if (regex.test(emp.employee_id)) {
          continue;
        }

        // Generate new ID based on created_at date
        const createdDate = new Date(emp.created_at);
        const day = String(createdDate.getDate()).padStart(2, '0');
        const month = String(createdDate.getMonth() + 1).padStart(2, '0');
        const year = String(createdDate.getFullYear());
        
        const positionCodes: { [key: string]: string } = {
          'Gudang': 'GU',
          'Barista': 'BA',
          'Kasir': 'KA',
          'Manager': 'MA',
        };

        const positionCode = positionCodes[emp.position] || 'XX';
        positionCounts[emp.position] = (positionCounts[emp.position] || 0) + 1;
        const sequence = String(positionCounts[emp.position]).padStart(3, '0');
        
        const newId = `${positionCode}${day}${month}${year}${sequence}`;

        // Update employee
        try {
          const response = await fetch('/api/employees', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: emp.id,
              employee_id: newId,
              full_name: emp.full_name,
              position: emp.position,
              employment_status: emp.employment_status,
              email: emp.email,
            }),
          });

          if (response.ok) {
            updatedCount++;
          } else {
            errorCount++;
          }
        } catch (error) {
          errorCount++;
        }
      }

      toast.success(`Berhasil generate ${updatedCount} ID karyawan!`);
      if (errorCount > 0) {
        toast.error(`${errorCount} karyawan gagal diupdate`);
      }
      
      fetchEmployees();
    } catch (error) {
      toast.error('Terjadi kesalahan saat generate ID');
    } finally {
      setIsGeneratingIds(false);
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.position?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesWeekFilter = filterWeek === 'all' || 
      (filterWeek === 'current' && employeesWithAttendance.has(emp.id));
    
    return matchesSearch && matchesWeekFilter;
  });

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Daftar Karyawan</h1>
          <p className="text-gray-600 font-medium">Kelola data karyawan November Coffee</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={autoGenerateAllIds}
            disabled={isGeneratingIds}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingIds ? 'Generating...' : 'Auto-Generate ID Semua'}
          </button>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-[#C84B31] text-white px-6 py-3 rounded-lg hover:bg-[#A03B24] transition-colors font-semibold"
          >
            <Plus className="w-5 h-5" />
            Tambah Karyawan
          </button>
        </div>
      </div>

      {/* Filter Minggu */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" />
            <span className="text-sm font-semibold text-gray-700">Filter Periode Kerja:</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterWeek('all')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                filterWeek === 'all'
                  ? 'bg-[#C84B31] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Semua Karyawan
            </button>
            <button
              onClick={() => setFilterWeek('current')}
              className={`px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors flex flex-col items-start gap-0.5 min-w-[140px] ${
                filterWeek === 'current'
                  ? 'bg-[#C84B31] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center gap-2 w-full">
                <Calendar className="w-4 h-4" />
                <span>Minggu Ini</span>
                {filterWeek === 'current' && (
                  <span className="bg-white text-[#C84B31] px-2 py-0.5 rounded-full text-xs font-bold ml-auto">
                    {employeesWithAttendance.size}
                  </span>
                )}
              </div>
              <span className={`text-xs ml-6 ${
                filterWeek === 'current' ? 'text-white/80' : 'text-gray-500'
              }`}>
                {weekRanges.current || 'Loading...'}
              </span>
            </button>
            <button
              onClick={() => setFilterWeek('last1')}
              className={`px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors flex flex-col items-start gap-0.5 min-w-[140px] ${
                filterWeek === 'last1'
                  ? 'bg-[#C84B31] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center gap-2 w-full">
                <Calendar className="w-4 h-4" />
                <span>1 Minggu Lalu</span>
                {filterWeek === 'last1' && (
                  <span className="bg-white text-[#C84B31] px-2 py-0.5 rounded-full text-xs font-bold ml-auto">
                    {employeesWithAttendance.size}
                  </span>
                )}
              </div>
              <span className={`text-xs ml-6 ${
                filterWeek === 'last1' ? 'text-white/80' : 'text-gray-500'
              }`}>
                {weekRanges.last1 || 'Loading...'}
              </span>
            </button>
            <button
              onClick={() => setFilterWeek('last2')}
              className={`px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors flex flex-col items-start gap-0.5 min-w-[140px] ${
                filterWeek === 'last2'
                  ? 'bg-[#C84B31] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center gap-2 w-full">
                <Calendar className="w-4 h-4" />
                <span>2 Minggu Lalu</span>
                {filterWeek === 'last2' && (
                  <span className="bg-white text-[#C84B31] px-2 py-0.5 rounded-full text-xs font-bold ml-auto">
                    {employeesWithAttendance.size}
                  </span>
                )}
              </div>
              <span className={`text-xs ml-6 ${
                filterWeek === 'last2' ? 'text-white/80' : 'text-gray-500'
              }`}>
                {weekRanges.last2 || 'Loading...'}
              </span>
            </button>
            <button
              onClick={() => setFilterWeek('last3')}
              className={`px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors flex flex-col items-start gap-0.5 min-w-[140px] ${
                filterWeek === 'last3'
                  ? 'bg-[#C84B31] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="flex items-center gap-2 w-full">
                <Calendar className="w-4 h-4" />
                <span>3 Minggu Lalu</span>
                {filterWeek === 'last3' && (
                  <span className="bg-white text-[#C84B31] px-2 py-0.5 rounded-full text-xs font-bold ml-auto">
                    {employeesWithAttendance.size}
                  </span>
                )}
              </div>
              <span className={`text-xs ml-6 ${
                filterWeek === 'last3' ? 'text-white/80' : 'text-gray-500'
              }`}>
                {weekRanges.last3 || 'Loading...'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
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
      </div>

      {/* Employee Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredEmployees.map((employee, index) => (
          <motion.div
            key={employee.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-gradient-to-br from-[#E07856] to-[#D96846] rounded-2xl shadow-lg hover:shadow-xl transition-all p-6 relative"
          >
            {/* Badge Bekerja Minggu Ini */}
            {employeesWithAttendance.has(employee.id) && (
              <div className="absolute top-4 right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                ✓ Minggu Ini
              </div>
            )}
            
            {/* Avatar */}
            <div className="flex justify-center mb-4">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-md ring-4 ring-white/30">
                <User className="w-14 h-14 text-[#C84B31]" />
              </div>
            </div>

            {/* Info */}
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold text-white mb-2">{employee.full_name}</h3>
              <p className="text-white/90 text-sm font-medium mb-4">{employee.position}</p>
              
              {/* Status */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg overflow-hidden mb-4">
                <div className="px-4 py-3">
                  <p className="text-white/80 text-xs font-semibold mb-1">Status</p>
                  <p className="text-white text-base font-bold">{employee.employment_status}</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <button
              onClick={() => router.push(`/admin/employees/${employee.id}`)}
              className="w-full bg-white text-[#C84B31] py-3 rounded-xl hover:bg-gray-50 transition-colors font-bold shadow-md"
            >
              Riwayat Absensi
            </button>
          </motion.div>
        ))}
      </div>

      {filteredEmployees.length === 0 && (
        <div className="text-center py-12 text-gray-500 bg-white rounded-lg">
          Tidak ada data karyawan
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <>
          <div
            onClick={closeModal}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
            >
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  Tambah Karyawan
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    ID Karyawan
                  </label>
                  <input
                    type="text"
                    value={formData.employee_id}
                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value.toUpperCase() })}
                    maxLength={13}
                    className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 text-gray-900 font-medium ${
                      idError 
                        ? 'border-red-300 focus:ring-red-500 bg-red-50' 
                        : 'border-gray-300 focus:ring-[#C84B31]'
                    }`}
                    required
                  />
                  {idError && (
                    <p className="mt-1 text-xs text-red-600 font-semibold">{idError}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">Otomatis dibuat saat pilih posisi. Total 13 karakter.</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C84B31] text-gray-900 font-medium placeholder:text-gray-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Posisi
                  </label>
                  <select
                    value={formData.position}
                    onChange={(e) => handlePositionChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C84B31] text-gray-900 font-medium"
                    required
                  >
                    <option value="Barista">Barista</option>
                    <option value="Kasir">Kasir</option>
                    <option value="Gudang">Gudang</option>
                    <option value="Manager">Manager</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">ID akan otomatis diupdate sesuai posisi</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Status Karyawan
                  </label>
                  <select
                    value={formData.employment_status}
                    onChange={(e) => setFormData({ ...formData, employment_status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C84B31] text-gray-900 font-medium"
                    required
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="On Leave">On Leave</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C84B31] text-gray-900 font-medium placeholder:text-gray-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C84B31] text-gray-900 font-medium"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-semibold text-gray-700"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-[#C84B31] text-white px-4 py-2 rounded-lg hover:bg-[#A03B24] transition-colors font-semibold"
                  >
                    Tambah
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}
