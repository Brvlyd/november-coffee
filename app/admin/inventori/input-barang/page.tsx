'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Upload, Plus, Package, Check, Edit2, Save, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

type TabType = 'masuk' | 'keluar';

interface NotaItem {
  nama_barang: string;
  jumlah: number;
  satuan: string;
  kategori: string;
  harga_satuan?: string;
  harga_total?: string;
}

interface NotaData {
  items: NotaItem[];
  tanggal?: string;
  supplier?: string;
  total?: string;
}

interface InventoryItem {
  id: string;
  kode_barang: string;
  nama_barang: string;
  jumlah: number;
  kategori: string;
  catatan: string;
  created_at: string;
}

export default function InputBarangPage() {
  const [activeTab, setActiveTab] = React.useState<TabType>('masuk');
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const [notaData, setNotaData] = React.useState<NotaData | null>(null);
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
  const [editingItem, setEditingItem] = React.useState<NotaItem | null>(null);
  const [editingSupplier, setEditingSupplier] = React.useState(false);
  const [editingTanggal, setEditingTanggal] = React.useState(false);
  const [tempSupplier, setTempSupplier] = React.useState('');
  const [tempTanggal, setTempTanggal] = React.useState('');
  const [inventoryItems, setInventoryItems] = React.useState<InventoryItem[]>([]);
  const [selectedInventoryItem, setSelectedInventoryItem] = React.useState<InventoryItem | null>(null);
  const [formData, setFormData] = React.useState({
    nama_barang: '',
    jumlah: 0,
    kategori: '',
    catatan: '',
  });

  React.useEffect(() => {
    fetchInventoryItems();
  }, []);

  // Cleanup preview URL when component unmounts
  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const fetchInventoryItems = async () => {
    try {
      const response = await fetch('/api/inventori');
      const result = await response.json();
      if (response.ok) {
        setInventoryItems(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  const handleInventoryItemSelect = (itemId: string) => {
    const item = inventoryItems.find(i => i.id === itemId);
    if (item) {
      setSelectedInventoryItem(item);
      setFormData({
        nama_barang: item.nama_barang,
        jumlah: 0,
        kategori: item.kategori,
        catatan: '',
      });
    } else {
      setSelectedInventoryItem(null);
      setFormData({
        nama_barang: '',
        jumlah: 0,
        kategori: '',
        catatan: '',
      });
    }
  };

  const handleEditItem = (index: number) => {
    setEditingIndex(index);
    setEditingItem({ ...notaData!.items[index] });
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingItem(null);
  };

  const handleSaveEdit = () => {
    if (editingIndex === null || !editingItem || !notaData) return;
    
    const updatedItems = [...notaData.items];
    updatedItems[editingIndex] = editingItem;
    
    setNotaData({
      ...notaData,
      items: updatedItems
    });
    
    setEditingIndex(null);
    setEditingItem(null);
    toast.success('Item berhasil diupdate');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Clean up previous preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
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

    // Clean up previous preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
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
      // Fetch current inventory to check for existing items
      const inventoryResponse = await fetch('/api/inventori');
      const inventoryResult = await inventoryResponse.json();
      const currentInventory: InventoryItem[] = inventoryResult.data || [];

      // Helper function to normalize string for comparison
      const normalizeString = (str: string) => {
        return str.toLowerCase()
          .replace(/\s+/g, ' ')
          .trim()
          .replace(/[^\w\s]/g, ''); // Remove special characters
      };

      // Helper function to calculate similarity
      const calculateSimilarity = (str1: string, str2: string) => {
        const s1 = normalizeString(str1);
        const s2 = normalizeString(str2);
        
        // Check if one contains the other
        if (s1.includes(s2) || s2.includes(s1)) {
          return 0.9; // High similarity
        }
        
        // Check exact match
        if (s1 === s2) {
          return 1.0;
        }
        
        // Calculate word overlap
        const words1 = s1.split(' ');
        const words2 = s2.split(' ');
        const commonWords = words1.filter(word => words2.includes(word));
        
        if (commonWords.length > 0) {
          const similarity = (commonWords.length * 2) / (words1.length + words2.length);
          return similarity;
        }
        
        return 0;
      };

      let created = 0;
      let updated = 0;

      // Process each item
      for (const item of notaData.items) {
        // Find similar item in inventory
        let matchedItem: InventoryItem | null = null;
        let highestSimilarity = 0;

        for (const invItem of currentInventory) {
          const similarity = calculateSimilarity(item.nama_barang, invItem.nama_barang);
          if (similarity > 0.7 && similarity > highestSimilarity) { // 70% similarity threshold
            highestSimilarity = similarity;
            matchedItem = invItem;
          }
        }

        if (matchedItem) {
          // Update existing item (merge)
          const newJumlah = matchedItem.jumlah + item.jumlah;
          const timestamp = new Date().toISOString();
          const logEntry = `MASUK|${timestamp}|+${item.jumlah}${item.satuan ? ' ' + item.satuan : ''}${notaData.supplier ? ' dari ' + notaData.supplier : ''}`;
          
          const response = await fetch('/api/inventori', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: matchedItem.id,
              nama_barang: matchedItem.nama_barang,
              jumlah: newJumlah,
              kategori: item.kategori || matchedItem.kategori,
              catatan: `${matchedItem.catatan || ''}${matchedItem.catatan ? ' | ' : ''}${logEntry}`,
            }),
          });

          if (response.ok) {
            updated++;
          }
        } else {
          // Create new item
          const timestamp = new Date().toISOString();
          const logEntry = `MASUK|${timestamp}|+${item.jumlah}${item.satuan ? ' ' + item.satuan : ''}${notaData.supplier ? ' dari ' + notaData.supplier : ''}`;
          
          const response = await fetch('/api/inventori', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              nama_barang: item.nama_barang,
              jumlah: item.jumlah,
              kategori: item.kategori,
              catatan: logEntry,
            }),
          });

          if (response.ok) {
            created++;
          }
        }
      }
      
      const message = [];
      if (created > 0) message.push(`${created} item baru`);
      if (updated > 0) message.push(`${updated} item diupdate (merged)`);
      
      toast.success(`Berhasil menyimpan! ${message.join(', ')}`);
      
      // Reset and refresh
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
      setSelectedFile(null);
      setNotaData(null);
      fetchInventoryItems();
    } catch (error) {
      console.error('Error saving to inventory:', error);
      toast.error('Gagal menyimpan data ke inventori');
    }
  };

  const handleBarangKeluarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedInventoryItem) {
      toast.error('Pilih barang terlebih dahulu');
      return;
    }

    if (!formData.nama_barang || formData.jumlah <= 0) {
      toast.error('Jumlah harus lebih dari 0');
      return;
    }

    if (formData.jumlah > selectedInventoryItem.jumlah) {
      toast.error(`Jumlah tidak boleh melebihi stok tersedia (${selectedInventoryItem.jumlah})`);
      return;
    }

    try {
      // Update inventory: reduce stock
      const newJumlah = selectedInventoryItem.jumlah - formData.jumlah;
      const timestamp = new Date().toISOString();
      const logEntry = `KELUAR|${timestamp}|-${formData.jumlah}${formData.catatan ? ' - ' + formData.catatan : ''}`;
      
      const response = await fetch('/api/inventori', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedInventoryItem.id,
          nama_barang: selectedInventoryItem.nama_barang,
          jumlah: newJumlah,
          kategori: selectedInventoryItem.kategori,
          catatan: `${selectedInventoryItem.catatan || ''}${selectedInventoryItem.catatan ? ' | ' : ''}${logEntry}`,
        }),
      });

      if (!response.ok) {
        throw new Error('Gagal mengupdate stok');
      }

      toast.success(`Berhasil! Stok ${formData.nama_barang} berkurang ${formData.jumlah}. Sisa: ${newJumlah}`);
      
      // Reset form and refresh inventory
      setFormData({
        nama_barang: '',
        jumlah: 0,
        kategori: '',
        catatan: '',
      });
      setSelectedInventoryItem(null);
      fetchInventoryItems();
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

            {/* Preview Image */}
            {selectedFile && previewUrl && selectedFile.type.startsWith('image/') && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 bg-gray-50 rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">Preview Nota</h3>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                      setNotaData(null);
                    }}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Hapus
                  </button>
                </div>
                <div className="relative bg-white rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={previewUrl}
                    alt="Preview nota"
                    className="w-full h-auto max-h-96 object-contain"
                  />
                </div>
              </motion.div>
            )}

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

                <div className="flex items-center gap-2 mb-2">
                  <strong className="text-sm text-gray-700">Supplier:</strong>
                  {editingSupplier ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={tempSupplier}
                        onChange={(e) => setTempSupplier(e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm text-gray-900"
                        placeholder="Nama supplier"
                      />
                      <button
                        onClick={() => {
                          setNotaData({ ...notaData, supplier: tempSupplier });
                          setEditingSupplier(false);
                          toast.success('Supplier diupdate');
                        }}
                        className="p-1.5 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                        title="Simpan"
                      >
                        <Save className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setEditingSupplier(false)}
                        className="p-1.5 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                        title="Batal"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700">{notaData.supplier || '-'}</span>
                      <button
                        onClick={() => {
                          setTempSupplier(notaData.supplier || '');
                          setEditingSupplier(true);
                        }}
                        className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                        title="Edit supplier"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <strong className="text-sm text-gray-700">Tanggal:</strong>
                  {editingTanggal ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={tempTanggal}
                        onChange={(e) => setTempTanggal(e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm text-gray-900"
                        placeholder="dd/mm/yyyy"
                      />
                      <button
                        onClick={() => {
                          setNotaData({ ...notaData, tanggal: tempTanggal });
                          setEditingTanggal(false);
                          toast.success('Tanggal diupdate');
                        }}
                        className="p-1.5 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                        title="Simpan"
                      >
                        <Save className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setEditingTanggal(false)}
                        className="p-1.5 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                        title="Batal"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700">{notaData.tanggal || '-'}</span>
                      <button
                        onClick={() => {
                          setTempTanggal(notaData.tanggal || '');
                          setEditingTanggal(true);
                        }}
                        className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                        title="Edit tanggal"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
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
                        <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {notaData.items.map((item, idx) => (
                        <tr key={idx} className="border-b last:border-0">
                          {editingIndex === idx && editingItem ? (
                            <>
                              <td className="px-4 py-3">
                                <input
                                  type="text"
                                  value={editingItem.nama_barang}
                                  onChange={(e) => setEditingItem({ ...editingItem, nama_barang: e.target.value })}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-gray-900"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="number"
                                  value={editingItem.jumlah}
                                  onChange={(e) => setEditingItem({ ...editingItem, jumlah: parseFloat(e.target.value) || 0 })}
                                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="text"
                                  value={editingItem.satuan}
                                  onChange={(e) => setEditingItem({ ...editingItem, satuan: e.target.value })}
                                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="text"
                                  value={editingItem.harga_satuan || ''}
                                  onChange={(e) => setEditingItem({ ...editingItem, harga_satuan: e.target.value })}
                                  className="w-28 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900"
                                  placeholder="Rp 0"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <input
                                  type="text"
                                  value={editingItem.harga_total || ''}
                                  onChange={(e) => setEditingItem({ ...editingItem, harga_total: e.target.value })}
                                  className="w-32 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900"
                                  placeholder="Rp 0"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <select
                                  value={editingItem.kategori}
                                  onChange={(e) => setEditingItem({ ...editingItem, kategori: e.target.value })}
                                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-gray-900"
                                >
                                  <option value="Bahan Baku">Bahan Baku</option>
                                  <option value="Kemasan">Kemasan</option>
                                  <option value="Lainnya">Lainnya</option>
                                </select>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex gap-2 justify-center">
                                  <button
                                    onClick={handleSaveEdit}
                                    className="p-1.5 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                                    title="Simpan"
                                  >
                                    <Save className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    className="p-1.5 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                                    title="Batal"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-4 py-3 text-sm text-gray-900">{item.nama_barang}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{item.jumlah}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">{item.satuan}</td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                {item.harga_satuan || '-'}
                              </td>
                              <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                                {item.harga_total || '-'}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900">
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                  {item.kategori}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex justify-center">
                                  <button
                                    onClick={() => handleEditItem(idx)}
                                    className="p-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                    title="Edit"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </>
                          )}
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
                  Pilih Barang *
                </label>
                <select
                  value={selectedInventoryItem?.id || ''}
                  onChange={(e) => handleInventoryItemSelect(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C84B31] focus:border-transparent text-gray-900"
                  required
                >
                  <option value="">-- Pilih barang dari inventori --</option>
                  {inventoryItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nama_barang} (Stok: {item.jumlah})
                    </option>
                  ))}
                </select>
              </div>

              {selectedInventoryItem && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-blue-900">Info Stok</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Stok Tersedia:</span>
                      <span className="ml-2 font-bold text-blue-900">{selectedInventoryItem.jumlah}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Kategori:</span>
                      <span className="ml-2 font-semibold text-blue-900">{selectedInventoryItem.kategori}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Jumlah Keluar *
                  </label>
                  <input
                    type="number"
                    value={formData.jumlah || ''}
                    onChange={(e) => setFormData({ ...formData, jumlah: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C84B31] focus:border-transparent text-gray-900"
                    placeholder="0"
                    min="1"
                    max={selectedInventoryItem?.jumlah || undefined}
                    disabled={!selectedInventoryItem}
                    required
                  />
                  {selectedInventoryItem && formData.jumlah > selectedInventoryItem.jumlah && (
                    <p className="mt-1 text-sm text-red-600">
                      Jumlah tidak boleh melebihi stok tersedia ({selectedInventoryItem.jumlah})
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Kategori
                  </label>
                  <input
                    type="text"
                    value={formData.kategori}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-900"
                    disabled
                    readOnly
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Catatan
                </label>
                <textarea
                  value={formData.catatan}
                  onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C84B31] focus:border-transparent text-gray-900"
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
