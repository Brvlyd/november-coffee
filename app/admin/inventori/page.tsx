'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface InventoryItem {
  id: string;
  nama_barang: string;
  jumlah: number;
  kategori: string;
  catatan: string;
  created_at: string;
}

export default function InventoriPage() {
  const [inventory, setInventory] = React.useState<InventoryItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingItem, setEditingItem] = React.useState<InventoryItem | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  
  const [formData, setFormData] = React.useState({
    nama_barang: '',
    jumlah: 0,
    kategori: '',
    catatan: '',
  });

  React.useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await fetch('/api/inventori');
      const result = await response.json();
      
      if (response.ok) {
        setInventory(result.data);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Gagal mengambil data inventori');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nama_barang || formData.jumlah === undefined) {
      toast.error('Nama barang dan jumlah harus diisi');
      return;
    }

    try {
      const url = '/api/inventori';
      const method = editingItem ? 'PUT' : 'POST';
      const body = editingItem 
        ? { ...formData, id: editingItem.id }
        : formData;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(editingItem ? 'Item berhasil diupdate' : 'Item berhasil ditambahkan');
        fetchInventory();
        closeModal();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error('Terjadi kesalahan');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus item ini?')) return;

    try {
      const response = await fetch('/api/inventori', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        toast.success('Item berhasil dihapus');
        fetchInventory();
      } else {
        toast.error('Gagal menghapus item');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan');
    }
  };

  const openModal = (item?: InventoryItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        nama_barang: item.nama_barang,
        jumlah: item.jumlah,
        kategori: item.kategori,
        catatan: item.catatan,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({
      nama_barang: '',
      jumlah: 0,
      kategori: '',
      catatan: '',
    });
  };

  const getStatusDot = (quantity: number) => {
    if (quantity === 0) return <div className="w-3 h-3 rounded-full bg-red-500" title="Habis" />;
    if (quantity < 10) return <div className="w-3 h-3 rounded-full bg-yellow-500" title="Menipis" />;
    return <div className="w-3 h-3 rounded-full bg-green-500" title="Aman" />;
  };

  const filteredInventory = inventory.filter(item =>
    item.nama_barang.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.kategori.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Inventori</h1>
          <p className="text-gray-600">Kelola stok barang November Coffee</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-[#C84B31] text-white px-6 py-3 rounded-lg hover:bg-[#A03B24] transition-colors"
        >
          <Plus className="w-5 h-5" />
          Tambah Barang
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari barang..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C84B31] focus:border-transparent"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Nama Barang</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Kategori</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Jumlah</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Catatan</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredInventory.map((item, index) => (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4">
                    {getStatusDot(item.jumlah)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{item.nama_barang}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.kategori}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{item.jumlah}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.catatan || '-'}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openModal(item)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>

          {filteredInventory.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Tidak ada data inventori
            </div>
          )}
        </div>
      </div>

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
                  {editingItem ? 'Edit Barang' : 'Tambah Barang'}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Barang
                  </label>
                  <input
                    type="text"
                    value={formData.nama_barang}
                    onChange={(e) => setFormData({ ...formData, nama_barang: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C84B31]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kategori
                  </label>
                  <input
                    type="text"
                    value={formData.kategori}
                    onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C84B31]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Jumlah
                  </label>
                  <input
                    type="number"
                    value={formData.jumlah}
                    onChange={(e) => setFormData({ ...formData, jumlah: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C84B31]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catatan
                  </label>
                  <textarea
                    value={formData.catatan}
                    onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C84B31]"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-[#C84B31] text-white px-4 py-2 rounded-lg hover:bg-[#A03B24] transition-colors"
                  >
                    {editingItem ? 'Update' : 'Tambah'}
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
