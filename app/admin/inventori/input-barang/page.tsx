'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Upload, Plus, Package, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';

type TabType = 'masuk' | 'keluar';

interface NotaItem {
  nama_barang: string;
  jumlah: number;
  satuan: string;
  kategori: string;
  harga_satuan?: number;
  harga_total?: number;
}

interface NotaData {
  items: NotaItem[];
  tanggal?: string;
  supplier?: string;
  total?: number;
}

export default function InputBarangPage() {
  const [activeTab, setActiveTab] = React.useState<TabType>('masuk');
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const [notaData, setNotaData] = React.useState<NotaData | null>(null);
  const [formData, setFormData] = React.useState({
    nama_barang: '',
    jumlah: 0,
    kategori: '',
    catatan: '',
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    toast.success('File berhasil dipilih');
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (!file) return;

    // Check if file is image or PDF
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      toast.error('File harus berupa gambar (JPG, PNG) atau PDF');
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 10MB');
      return;
    }

    setSelectedFile(file);
    toast.success('File berhasil dipilih');
  };

  const processNota = async () => {
    if (!selectedFile) {
      toast.error('Pilih file nota terlebih dahulu');
      return;
    }

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/inventori/process-nota', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Gagal memproses nota');
      }

      if (result.data && result.data.items && result.data.items.length > 0) {
        setNotaData(result.data);
        toast.success(`Berhasil! Ditemukan ${result.data.items.length} item`);
      } else {
        toast.error('Tidak ada item yang ditemukan di nota');
      }
    } catch (error: any) {
      console.error('Error processing nota:', error);
      toast.error(error.message || 'Gagal memproses nota');
    } finally {
      setIsProcessing(false);
    }
  };

  const saveItemsToInventory = async () => {
    if (!notaData || !notaData.items || notaData.items.length === 0) {
      toast.error('Tidak ada data untuk disimpan');
      return;
    }

    try {
      // Save each item to inventory
      const promises = notaData.items.map(item =>
        fetch('/api/inventori', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nama_barang: item.nama_barang,
            jumlah: item.jumlah,
            kategori: item.kategori,
            catatan: `${item.satuan}${notaData.supplier ? ` - ${notaData.supplier}` : ''}`,
          }),
        })
      );

      await Promise.all(promises);
      
      toast.success(`Berhasil menyimpan ${notaData.items.length} item ke inventori!`);
      
      // Reset
      setSelectedFile(null);
      setNotaData(null);
    } catch (error) {
      toast.error('Gagal menyimpan data ke inventori');
    }
  };

  const handleBarangKeluarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nama_barang || formData.jumlah <= 0) {
      toast.error('Nama barang dan jumlah harus diisi');
      return;
    }

    try {
      // TODO: Implement API call for barang keluar
      toast.success('Barang keluar berhasil dicatat');
      
      // Reset form
      setFormData({
        nama_barang: '',
        jumlah: 0,
        kategori: '',
        catatan: '',
      });
    } catch (error) {
      toast.error('Gagal mencatat barang keluar');
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Input Barang</h1>
        <p className="text-gray-600">Catat barang masuk dan keluar</p>
      </div>

      {/* Tab Switcher */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('masuk')}
            className={`px-8 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'masuk'
                ? 'bg-[#C84B31] text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Barang Masuk
          </button>
          <button
            onClick={() => setActiveTab('keluar')}
            className={`px-8 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'keluar'
                ? 'bg-[#C84B31] text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Barang Keluar
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto">
        {activeTab === 'masuk' ? (
          /* Barang Masuk - Upload Nota */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Upload className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Upload Nota Barang Masuk</h2>
                <p className="text-sm text-gray-600">AI akan membaca dan memproses nota secara otomatis</p>
              </div>
            </div>

            {/* Upload Area */}
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
                isDragging 
                  ? 'border-[#C84B31] bg-orange-50 scale-[1.02]' 
                  : 'border-gray-300 hover:border-[#C84B31]'
              }`}
            >
              <input
                type="file"
                id="nota-upload"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label htmlFor="nota-upload" className="cursor-pointer block">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors ${
                  isDragging ? 'bg-[#C84B31]' : 'bg-gray-100'
                }`}>
                  <Upload className={`w-10 h-10 ${isDragging ? 'text-white' : 'text-gray-400'}`} />
                </div>
                <p className={`text-lg font-semibold mb-2 ${isDragging ? 'text-[#C84B31]' : 'text-gray-900'}`}>
                  {isDragging 
                    ? 'Drop file di sini!' 
                    : selectedFile 
                      ? selectedFile.name 
                      : 'Klik atau drag file nota ke sini'
                  }
                </p>
                <p className="text-sm text-gray-600">
                  Supported: JPG, PNG, PDF (Max 10MB)
                </p>
              </label>
            </div>

            {selectedFile && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-6"
              >
                <button
                  onClick={processNota}
                  disabled={isProcessing}
                  className="w-full bg-[#C84B31] text-white py-4 rounded-lg font-semibold hover:bg-[#A03B24] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Memproses dengan AI...' : 'Proses Nota dengan AI'}
                </button>
              </motion.div>
            )}

            {/* AI Processing Results */}
            {notaData && notaData.items && notaData.items.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 p-6 bg-green-50 border-2 border-green-200 rounded-xl"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-green-900">
                    AI Berhasil Membaca {notaData.items.length} Item
                  </h3>
                </div>

                {notaData.supplier && (
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>Supplier:</strong> {notaData.supplier}
                  </p>
                )}
                {notaData.tanggal && (
                  <p className="text-sm text-gray-700 mb-2">
                    <strong>Tanggal:</strong> {notaData.tanggal}
                  </p>
                )}
                {notaData.total && (
                  <p className="text-sm text-gray-700 mb-4">
                    <strong>Total:</strong> {notaData.total}
                  </p>
                )}

                <div className="bg-white rounded-lg overflow-hidden mb-4">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Nama Barang</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Jumlah</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Satuan</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Harga Satuan</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Total Harga</th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Kategori</th>
                      </tr>
                    </thead>
                    <tbody>
                      {notaData.items.map((item, idx) => (
                        <tr key={idx} className="border-b last:border-0">
                          <td className="px-4 py-3 text-sm text-gray-900">{item.nama_barang}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.jumlah}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.satuan}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {item.harga_satuan ? `Rp ${item.harga_satuan.toLocaleString('id-ID')}` : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                            {item.harga_total ? `Rp ${item.harga_total.toLocaleString('id-ID')}` : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                              {item.kategori}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={saveItemsToInventory}
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                  >
                    Simpan {notaData.items.length} Item ke Inventori
                  </button>
                  <button
                    onClick={() => {
                      setNotaData(null);
                      setSelectedFile(null);
                      toast.success('Hasil OCR dibatalkan');
                    }}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                  >
                    Batal
                  </button>
                </div>
              </motion.div>
            )}

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>💡 Tips:</strong> Pastikan foto nota jelas dan terbaca untuk hasil AI yang optimal
              </p>
            </div>
          </motion.div>
        ) : (
          /* Barang Keluar - Form */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm p-8"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Form Barang Keluar</h2>
                <p className="text-sm text-gray-600">Catat barang yang keluar dari inventori</p>
              </div>
            </div>

            <form onSubmit={handleBarangKeluarSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nama Barang *
                </label>
                <input
                  type="text"
                  value={formData.nama_barang}
                  onChange={(e) => setFormData({ ...formData, nama_barang: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C84B31] focus:border-transparent"
                  placeholder="Masukkan nama barang"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Jumlah *
                  </label>
                  <input
                    type="number"
                    value={formData.jumlah || ''}
                    onChange={(e) => setFormData({ ...formData, jumlah: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C84B31] focus:border-transparent"
                    placeholder="0"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Kategori
                  </label>
                  <select
                    value={formData.kategori}
                    onChange={(e) => setFormData({ ...formData, kategori: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C84B31] focus:border-transparent"
                  >
                    <option value="">Pilih kategori</option>
                    <option value="Bahan Baku">Bahan Baku</option>
                    <option value="Kemasan">Kemasan</option>
                    <option value="Peralatan">Peralatan</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Catatan
                </label>
                <textarea
                  value={formData.catatan}
                  onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C84B31] focus:border-transparent"
                  placeholder="Tambahkan catatan (opsional)"
                  rows={3}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#C84B31] text-white py-4 rounded-lg font-semibold hover:bg-[#A03B24] transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Catat Barang Keluar
              </button>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  );
}
