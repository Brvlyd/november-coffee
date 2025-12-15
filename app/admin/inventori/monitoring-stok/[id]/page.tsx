'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Package, Calendar, Info, Edit2, Save, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface InventoryItem {
  id: string;
  kode_barang: string;
  nama_barang: string;
  jumlah: number;
  kategori: string;
  catatan: string;
  nama_toko: string;
  created_at: string;
}

interface LogEntry {
  type: 'masuk' | 'keluar' | 'info';
  jumlah?: number;
  satuan?: string;
  text: string;
  timestamp?: string;
}

export default function DetailBarangPage() {
  const params = useParams();
  const router = useRouter();
  const [item, setItem] = React.useState<InventoryItem | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editData, setEditData] = React.useState({
    nama_barang: '',
    jumlah: 0,
    kategori: '',
    catatan: '',
    nama_toko: '',
  });

  React.useEffect(() => {
    fetchItemDetail();
  }, [params.id]);

  const fetchItemDetail = async () => {
    try {
      const response = await fetch('/api/inventori');
      const result = await response.json();
      
      if (response.ok) {
        const foundItem = result.data.find((i: InventoryItem) => i.id === params.id);
        if (foundItem) {
          setItem(foundItem);
          setEditData({
            nama_barang: foundItem.nama_barang,
            jumlah: foundItem.jumlah,
            kategori: foundItem.kategori,
            catatan: foundItem.catatan || '',
            nama_toko: foundItem.nama_toko || '',
          });
        } else {
          toast.error('Barang tidak ditemukan');
          router.push('/admin/inventori/monitoring-stok');
        }
      }
    } catch (error) {
      toast.error('Gagal mengambil data barang');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!item) return;

    try {
      const response = await fetch('/api/inventori', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          ...editData,
        }),
      });

      if (response.ok) {
        toast.success('Barang berhasil diupdate');
        setIsEditing(false);
        fetchItemDetail();
      } else {
        toast.error('Gagal mengupdate barang');
      }
    } catch (error) {
      toast.error('Terjadi kesalahan');
    }
  };

  const parseItemHistory = (catatan: string): LogEntry[] => {
    if (!catatan) return [];
    
    const entries = catatan.split('|').filter(e => e.trim());
    const logEntries: LogEntry[] = [];
    
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i].trim();
      
      // New format: MASUK|timestamp|details or KELUAR|timestamp|details
      if (entry === 'MASUK' && i + 2 < entries.length) {
        const timestamp = entries[i + 1].trim();
        const details = entries[i + 2].trim();
        const match = details.match(/([+-])(\d+)\s*(\w+)?(.*)/);
        
        if (match) {
          logEntries.push({
            type: 'masuk',
            jumlah: parseInt(match[2]),
            satuan: match[3] || '',
            text: match[4].trim() || 'Barang masuk',
            timestamp: timestamp
          });
        }
        i += 2; // Skip next 2 entries as they're part of this log
      } else if (entry === 'KELUAR' && i + 2 < entries.length) {
        const timestamp = entries[i + 1].trim();
        const details = entries[i + 2].trim();
        const match = details.match(/([+-])(\d+)\s*(\w+)?(.*)/);
        
        if (match) {
          logEntries.push({
            type: 'keluar',
            jumlah: parseInt(match[2]),
            satuan: match[3] || '',
            text: match[4].trim() || 'Barang keluar',
            timestamp: timestamp
          });
        }
        i += 2; // Skip next 2 entries as they're part of this log
      }
      // Legacy format support: +10 kg or -5 kg
      else if (entry.includes('+')) {
        const match = entry.match(/\+(\d+)\s*(\w+)?(.*)/);
        if (match) {
          logEntries.push({ 
            type: 'masuk', 
            jumlah: parseInt(match[1]), 
            satuan: match[2] || '', 
            text: match[3].trim() || 'Barang masuk'
          });
        }
      } else if (entry.includes('-') || entry.toLowerCase().includes('keluar')) {
        const match = entry.match(/-(\d+)\s*(\w+)?(.*)/);
        if (match) {
          logEntries.push({ 
            type: 'keluar', 
            jumlah: parseInt(match[1]), 
            satuan: match[2] || '', 
            text: match[3].trim() || 'Barang keluar'
          });
        } else {
          logEntries.push({ type: 'keluar', text: entry });
        }
      }
      // Info entries
      else {
        logEntries.push({ type: 'info', text: entry });
      }
    }
    
    return logEntries;
  };

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

  if (!item) {
    return null;
  }

  const status = getStockStatus(item.jumlah);
  const history = parseItemHistory(item.catatan);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/admin/inventori/monitoring-stok')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Kembali ke Monitoring Stok</span>
        </button>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-[#D9603B] to-[#C84B31] rounded-xl flex items-center justify-center">
              <Package className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Detail Barang</h1>
              <p className="text-gray-600">Informasi lengkap dan riwayat transaksi</p>
            </div>
          </div>

          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              <Edit2 className="w-5 h-5" />
              Edit Barang
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                <Save className="w-5 h-5" />
                Simpan
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditData({
                    nama_barang: item.nama_barang,
                    jumlah: item.jumlah,
                    kategori: item.kategori,
                    catatan: item.catatan || '',
                    nama_toko: item.nama_toko || '',
                  });
                }}
                className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
                Batal
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Detail Barang */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info Utama */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">Informasi Barang</h2>
            
            <div className="space-y-4">
              {/* Nama Barang */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nama Barang
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editData.nama_barang}
                    onChange={(e) => setEditData({ ...editData, nama_barang: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C84B31] text-gray-900 font-medium"
                  />
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{item.nama_barang}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Jumlah Stok */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Jumlah Stok
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editData.jumlah}
                      onChange={(e) => setEditData({ ...editData, jumlah: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C84B31] text-gray-900 font-bold text-2xl"
                    />
                  ) : (
                    <p className="text-4xl font-bold text-[#C84B31]">{item.jumlah}</p>
                  )}
                </div>

                {/* Kategori */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Kategori
                  </label>
                  {isEditing ? (
                    <select
                      value={editData.kategori}
                      onChange={(e) => setEditData({ ...editData, kategori: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C84B31] text-gray-900 font-medium"
                    >
                      <option value="Bahan Baku">Bahan Baku</option>
                      <option value="Kemasan">Kemasan</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  ) : (
                    <span className="inline-flex items-center px-4 py-2 rounded-lg text-base font-bold bg-blue-100 text-blue-800">
                      {item.kategori || 'Tidak ada'}
                    </span>
                  )}
                </div>
              </div>

              {/* Catatan */}
              {isEditing && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Catatan (Format: satuan | +jumlah satuan dari supplier)
                  </label>
                  <textarea
                    value={editData.catatan}
                    onChange={(e) => setEditData({ ...editData, catatan: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C84B31] text-gray-900"
                    rows={4}
                    placeholder="Contoh: kg | +10 kg dari Toko A"
                  />
                </div>
              )}
            </div>
          </motion.div>

          {/* Riwayat Transaksi */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">Riwayat Transaksi</h2>
            
            {history.length > 0 ? (
              <div className="space-y-3">
                {history.map((entry, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border-l-4 ${
                      entry.type === 'masuk'
                        ? 'bg-green-50 border-green-500'
                        : entry.type === 'keluar'
                        ? 'bg-red-50 border-red-500'
                        : 'bg-gray-50 border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {entry.type === 'masuk' ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-600 text-white font-bold text-sm">
                              + {entry.jumlah} {entry.satuan}
                            </span>
                          ) : entry.type === 'keluar' ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full bg-red-600 text-white font-bold text-sm">
                              - {entry.jumlah} {entry.satuan}
                            </span>
                          ) : null}
                          <span className={`font-semibold ${
                            entry.type === 'masuk' ? 'text-green-900' : 
                            entry.type === 'keluar' ? 'text-red-900' : 
                            'text-gray-900'
                          }`}>
                            {entry.type === 'masuk' ? 'Barang Masuk' : 
                             entry.type === 'keluar' ? 'Barang Keluar' : 
                             'Informasi'}
                          </span>
                        </div>
                        {entry.timestamp && (
                          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(entry.timestamp).toLocaleString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        )}
                        <p className="text-gray-700">{entry.text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Belum ada riwayat transaksi</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Right Column - Info Tambahan */}
        <div className="space-y-6">
          {/* Status Stok */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4">Status Stok</h3>
            <div className={`${status.bgColor} rounded-lg p-4`}>
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-4 h-4 rounded-full ${status.color}`} />
                <span className={`text-xl font-bold ${status.textColor}`}>
                  {status.text}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {status.text === 'Habis' && 'Stok habis, segera lakukan restok!'}
                {status.text === 'Menipis' && 'Stok menipis, perlu restok segera'}
                {status.text === 'Normal' && 'Stok dalam kondisi normal'}
                {status.text === 'Aman' && 'Stok mencukupi'}
              </p>
            </div>
          </motion.div>

          {/* Tanggal Input */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm p-6"
          >
            <h3 className="text-lg font-bold text-gray-900 mb-4">Informasi Sistem</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Info className="w-5 h-5 text-gray-600" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">ID Barang</p>
                  <p className="font-mono text-lg font-bold text-[#C84B31]">{item.kode_barang || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-600" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">Nama Toko</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.nama_toko}
                      onChange={(e) => setEditData({ ...editData, nama_toko: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C84B31] text-gray-900 font-medium text-sm mt-1"
                      placeholder="Masukkan nama toko"
                    />
                  ) : (
                    <p className="font-bold text-gray-900">{item.nama_toko || '-'}</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
