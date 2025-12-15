'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Search, User } from 'lucide-react';
import { toast } from 'react-hot-toast';

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
  const [editingEmployee, setEditingEmployee] = React.useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  
  const [formData, setFormData] = React.useState({
    employee_id: '',
    full_name: '',
    position: '',
    employment_status: 'Active',
    email: '',
    password: '',
  });

  React.useEffect(() => {
    fetchEmployees();
  }, []);

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

    try {
      const url = '/api/employees';
      const method = editingEmployee ? 'PUT' : 'POST';
      const body = editingEmployee 
        ? { ...formData, id: editingEmployee.id }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(editingEmployee ? 'Karyawan berhasil diupdate' : 'Karyawan berhasil ditambahkan');
        fetchEmployees();
        closeModal();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Terjadi kesalahan');
    }
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

  const openModal = (employee?: Employee) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        employee_id: employee.employee_id,
        full_name: employee.full_name,
        position: employee.position,
        employment_status: employee.employment_status,
        email: employee.email,
        password: '',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEmployee(null);
    setFormData({
      employee_id: '',
      full_name: '',
      position: '',
      employment_status: 'Active',
      email: '',
      password: '',
    });
  };

  const filteredEmployees = employees.filter(emp =>
    emp.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.position?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-[#C84B31] text-white px-6 py-3 rounded-lg hover:bg-[#A03B24] transition-colors font-semibold"
        >
          <Plus className="w-5 h-5" />
          Tambah Karyawan
        </button>
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
            className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all p-6"
          >
            {/* Avatar */}
            <div className="flex justify-center mb-4">
              <div className="w-24 h-24 bg-gradient-to-br from-[#C84B31] to-[#A03B24] rounded-full flex items-center justify-center">
                <User className="w-12 h-12 text-white" />
              </div>
            </div>

            {/* Info */}
            <div className="text-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 mb-1">{employee.full_name}</h3>
              <p className="text-sm text-gray-600 mb-2 font-medium">{employee.employee_id}</p>
              <p className="text-sm text-[#C84B31] font-semibold mb-1">{employee.position}</p>
              <p className="text-sm text-gray-500 font-medium">{employee.email || 'No email'}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => openModal(employee)}
                className="flex-1 flex items-center justify-center gap-2 bg-blue-50 text-blue-600 py-2 rounded-lg hover:bg-blue-100 transition-colors font-semibold"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              {employee.position.toLowerCase() !== 'manager' ? (
                <button
                  onClick={() => handleDelete(employee.id)}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-50 text-red-600 py-2 rounded-lg hover:bg-red-100 transition-colors font-semibold"
                >
                  <Trash2 className="w-4 h-4" />
                  Hapus
                </button>
              ) : (
                <button
                  disabled
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-400 py-2 rounded-lg cursor-not-allowed font-semibold"
                  title="Manager tidak dapat dihapus"
                >
                  <Trash2 className="w-4 h-4" />
                  Hapus
                </button>
              )}
            </div>
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
                  {editingEmployee ? 'Edit Karyawan' : 'Tambah Karyawan'}
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
                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C84B31] text-gray-900 font-medium"
                    required
                    disabled={!!editingEmployee}
                  />
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
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C84B31] text-gray-900 font-medium placeholder:text-gray-400"
                    placeholder="e.g., Barista, Cashier"
                    required
                  />
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
                    {editingEmployee ? 'Password Baru (kosongkan jika tidak diubah)' : 'Password'}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C84B31] text-gray-900 font-medium"
                    required={!editingEmployee}
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
                    {editingEmployee ? 'Update' : 'Tambah'}
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
