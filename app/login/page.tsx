'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [employeeId, setEmployeeId] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

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
        // Show success toast for employee
        toast.success(`Selamat Datang ${data.employeeName}!`, {
          duration: 3000,
          icon: '✅',
          style: {
            background: '#10B981',
            color: '#fff',
            fontSize: '18px',
            fontWeight: 'bold',
            padding: '20px',
          }
        });
        setTimeout(() => {
          router.push('/');
        }, 3000);
      }
    } catch (error: any) {
      toast.error(error.message || 'Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Background with photo */}
      <div className="absolute inset-0">
        <Image
          src="/images/gallery/View3.jpeg"
          alt="November Coffee"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Content */}
      <div className="relative h-auto flex items-center justify-center p-4">
        <div className="w-full max-w-6xl">
          {/* Logo - Terpisah */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-center mb-8 mt-20"
          >
            <div className="w-48 h-48 bg-white rounded-full flex items-center justify-center shadow-xl">
              <div className="text-center">
                <div className="text-[#D9603B] font-extrabold text-3xl leading-tight">
                  November
                </div>
                <div className="text-[#D9603B] font-extrabold text-2xl leading-tight">
                  Coffee
                </div>
              </div>
            </div>
          </motion.div>

          {/* Login Form Box */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl shadow-2xl px-24 py-32 -mt-36"
          >
            <h2 className="text-[#D9603B] text-4xl font-bold text-center mt-6 mb-16">Login</h2>
            
            <form onSubmit={handleSubmit} className="space-y-12">
              <div className="flex items-center gap-4">
                <label className="text-[#D9603B] font-semibold whitespace-nowrap w-32">
                  ID Karyawan
                </label>
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-gray-400">:</span>
                  <input
                    type="text"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="flex-1 px-4 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D9603B] focus:border-transparent text-gray-900"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="text-[#D9603B] font-semibold whitespace-nowrap w-32">
                  Password
                </label>
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-gray-400">:</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="flex-1 px-4 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D9603B] focus:border-transparent text-gray-900"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="flex justify-center pt-6">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-[#D9603B] text-white px-16 py-4 rounded-lg font-bold text-lg hover:bg-[#C84B31] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Loading...' : 'Submit'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
