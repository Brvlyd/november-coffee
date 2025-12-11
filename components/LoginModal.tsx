'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const router = useRouter();
  const [employeeId, setEmployeeId] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [employeeName, setEmployeeName] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!employeeId || !password) {
      toast.error('ID Karyawan dan Password harus diisi');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login gagal');
      }

      if (data.role === 'admin') {
        toast.success('Login berhasil! Menuju dashboard...');
        setTimeout(() => {
          router.push('/admin');
        }, 1000);
      } else {
        // Show success modal for employee
        setEmployeeName(data.employeeName || 'Karyawan');
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          setEmployeeId('');
          setPassword('');
          onClose();
        }, 3000);
      }
    } catch (error: any) {
      toast.error(error.message || 'Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setEmployeeId('');
      setPassword('');
      setShowSuccess(false);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative overflow-hidden"
            >
              {!showSuccess ? (
                <>
                  {/* Logo Header */}
                  <div className="bg-[#C84B31] px-8 py-10 text-center relative">
                    <div className="w-24 h-24 mx-auto bg-white rounded-full flex items-center justify-center shadow-lg mb-4">
                      <div className="text-center">
                        <div className="text-[#C84B31] font-bold text-xl">November</div>
                        <div className="text-[#C84B31] font-bold text-lg">Coffee</div>
                      </div>
                    </div>
                    <h2 className="text-white text-2xl font-bold">Login</h2>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {/* ID Karyawan */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ID Karyawan
                      </label>
                      <input
                        type="text"
                        placeholder="Masukkan ID Karyawan"
                        value={employeeId}
                        onChange={(e) => setEmployeeId(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C84B31] focus:border-transparent"
                        disabled={isLoading}
                      />
                    </div>

                    {/* Password */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password
                      </label>
                      <input
                        type="password"
                        placeholder="Masukkan Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C84B31] focus:border-transparent"
                        disabled={isLoading}
                      />
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-[#C84B31] text-white py-3 rounded-lg font-semibold hover:bg-[#A03B24] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? 'Loading...' : 'Login'}
                    </button>
                  </form>
                </>
              ) : (
                /* Success Modal */
                <div className="p-12 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6"
                  >
                    <Check className="w-12 h-12 text-white" strokeWidth={3} />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Selamat Datang
                  </h2>
                  <p className="text-xl font-semibold text-[#C84B31]">
                    {employeeName}!
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
