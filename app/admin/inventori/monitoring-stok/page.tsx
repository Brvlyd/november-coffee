'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, AlertTriangle, Package, TrendingDown } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface InventoryItem {
  id: string;
  kode_barang: string;
  nama_barang: string;
  jumlah: number;
  kategori: string;
  catatan: string;
  created_at: string;
}

export default function MonitoringStokPage() {
  const router = useRouter();
  const [inventory, setInventory] = React.useState<InventoryItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');

  React.useEffect(() => {
    fetchInventory();
  }, []);

  const handleItemClick = (itemId: string) => {
    router.push(`/admin/inventori/monitoring-stok/${itemId}`);
  };

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

  const filteredInventory = inventory.filter(item =>
    item.nama_barang.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.kategori.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockItems = inventory.filter(item => item.jumlah < 10);

  const getStockStatus = (jumlah: number) => {
    if (jumlah === 0) {
      return { text: 'Habis', color: 'bg-red-500', textColor: 'text-red-700', bgColor: 'bg-red-50' };
    } else if (jumlah < 10) {
      return { text: 'Menipis', color: 'bg-yellow-500', textColor: 'text-yellow-700', bgColor: 'bg-yellow-50' };
    } else if (jumlah < 30) {
      return { text: 'Normal', color: 'bg-blue-500', textColor: 'text-blue-700', bgColor: 'bg-blue-50' };
    } else {
      return { text: 'Aman', color: 'bg-green-500', textColor: 'text-green-700', bgColor: 'bg-green-50' };
    }
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Monitoring Stok</h1>
        <p className="text-gray-600">Pantau ketersediaan stok barang real-time</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1 font-medium">Total Item</p>
              <p className="text-3xl font-bold text-gray-900">{inventory.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1 font-medium">Stok Menipis</p>
              <p className="text-3xl font-bold text-yellow-600">{lowStockItems.length}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1 font-medium">Perlu Restock</p>
              <p className="text-3xl font-bold text-red-600">
                {inventory.filter(item => item.jumlah < 5).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-lg"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-yellow-900 mb-2">
                ⚠️ Peringatan Stok Menipis
              </h3>
              <p className="text-yellow-800 mb-3">
                Terdapat {lowStockItems.length} item dengan stok menipis yang perlu segera direstock:
              </p>
              <ul className="space-y-1">
                {lowStockItems.slice(0, 5).map(item => (
                  <li key={item.id} className="text-yellow-900 font-medium">
                    • {item.nama_barang} <span className="text-yellow-700">({item.jumlah} tersisa)</span>
                  </li>
                ))}
                {lowStockItems.length > 5 && (
                  <li className="text-yellow-700 italic">
                    + {lowStockItems.length - 5} item lainnya
                  </li>
                )}
              </ul>
            </div>
          </div>
        </motion.div>
      )}

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari barang..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C84B31] focus:border-transparent text-gray-900"
          />
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#C84B31] text-white">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-bold">ID</th>
                <th className="px-6 py-4 text-left text-sm font-bold">NAMA BARANG</th>
                <th className="px-6 py-4 text-left text-sm font-bold">KATEGORI</th>
                <th className="px-6 py-4 text-center text-sm font-bold">JUMLAH</th>
                <th className="px-6 py-4 text-center text-sm font-bold">STATUS</th>
                <th className="px-6 py-4 text-left text-sm font-bold w-64">CATATAN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>Tidak ada data inventori</p>
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item, index) => {
                  const status = getStockStatus(item.jumlah);
                  return (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleItemClick(item.id)}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm font-bold text-[#C84B31]">
                          {item.kode_barang || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#D9603B] to-[#C84B31] rounded-lg flex items-center justify-center">
                            <Package className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{item.nama_barang}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                          {item.kategori || 'Tidak ada'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-2xl font-bold text-gray-900">{item.jumlah}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${status.color}`} />
                          <span className={`text-sm font-semibold ${status.textColor}`}>
                            {status.text}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                        <div className="truncate" title={item.catatan || '-'}>
                          {item.catatan || '-'}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
