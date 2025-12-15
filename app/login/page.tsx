'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getCurrentShift } from '@/lib/shift';

export default function LoginPage() {
  const router = useRouter();
  const [employeeId, setEmployeeId] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [showWelcome, setShowWelcome] = React.useState(false);
  const [welcomeName, setWelcomeName] = React.useState('');
  const [actionType, setActionType] = React.useState<'checkin' | 'checkout' | null>(null);
  const [isCheckout, setIsCheckout] = React.useState(false);
  const [currentShift, setCurrentShift] = React.useState(getCurrentShift());

  React.useEffect(() => {
    // Update shift info every minute
    const interval = setInterval(() => {
      setCurrentShift(getCurrentShift());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e: React.FormEvent, type: 'checkin' | 'checkout') => {
    e.preventDefault();
    
    if (!employeeId || !password) {
      toast.error('ID Karyawan dan Password harus diisi');
      return;
    }

    setIsLoading(true);
    setActionType(type);
    setIsCheckout(false);

    try {
      // First, authenticate
      const authResponse = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, password })
      });

      const authData = await authResponse.json();

      if (!authResponse.ok) {
        throw new Error(authData.error || 'Login gagal');
      }

      // If admin, only allow check-in (which redirects to dashboard)
      if (authData.role === 'admin') {
        if (type === 'checkout') {
          toast.error('Maaf, aksi yang dilakukan tidak valid');
          setIsLoading(false);
          return;
        }
        toast.success('Login berhasil! Menuju dashboard...');
        setTimeout(() => {
          router.push('/admin');
        }, 1000);
        return;
      }

      // For employees, handle check-in or check-out
      if (type === 'checkout') {
        // Check if employee has an active shift
        const checkResponse = await fetch(`/api/attendance/check-status?employeeId=${authData.employeeId}`);
        const checkData = await checkResponse.json();

        if (!checkData.hasActiveShift) {
          const shiftInfo = checkData.shift ? ` untuk ${checkData.shift.name}` : '';
          toast.error(`Anda tidak memiliki shift aktif${shiftInfo}. Silakan check-in terlebih dahulu.`, {
            duration: 4000,
            icon: '❌',
          });
          setIsLoading(false);
          return;
        }

        // Proceed with checkout
        const checkoutResponse = await fetch('/api/attendance/check-out', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ employeeId: authData.employeeId })
        });

        if (!checkoutResponse.ok) {
          throw new Error('Check-out gagal');
        }

        // Show goodbye popup immediately
        setWelcomeName(authData.employeeName);
        setShowWelcome(true);
        setIsCheckout(true);
        
        setTimeout(() => {
          router.push('/');
        }, 3000);
      } else {
        // Check-in flow
        const checkinResponse = await fetch('/api/attendance/check-in', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ employeeId: authData.employeeId })
        });

        if (!checkinResponse.ok) {
          const errorData = await checkinResponse.json();
          throw new Error(errorData.error || 'Check-in gagal');
        }

        // Show welcome popup immediately
        setWelcomeName(authData.employeeName);
        setShowWelcome(true);
        
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

      {/* Welcome Popup */}
      {showWelcome && (
        <>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-50" />
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="absolute inset-0 flex items-center justify-center z-50 p-4"
          >
            <div className="bg-gradient-to-br from-white to-orange-50 rounded-3xl shadow-2xl p-16 max-w-2xl w-full border-4 border-[#D9603B]">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-center"
              >
                <div className="mb-8">
                  <div className="w-32 h-32 bg-gradient-to-br from-[#D9603B] to-[#C84B31] rounded-full flex items-center justify-center mx-auto shadow-xl">
                    <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <h1 className="text-5xl font-extrabold text-[#D9603B] mb-4">
                  {isCheckout ? 'SAMPAI JUMPA' : 'SELAMAT DATANG'}
                </h1>
                <p className="text-4xl font-bold text-gray-800 mb-2">
                  {welcomeName}
                </p>
                <p className="text-xl text-gray-600 font-semibold">
                  {isCheckout ? 'Hati-hati di jalan! 🚗' : 'Check-in berhasil! ☕'}
                </p>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="mt-8"
                >
                  <div className="w-16 h-16 border-4 border-[#D9603B] border-t-transparent rounded-full mx-auto" />
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}

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
            className="bg-white rounded-3xl shadow-2xl px-24 py-28 -mt-36"
          >
            <h2 className="text-[#D9603B] text-4xl font-bold text-center mt-4 mb-5">Login</h2>
            
            {/* Shift Info Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-r from-[#D9603B] to-[#C84B31] text-white px-6 py-3 rounded-xl text-center mb-12 shadow-lg"
            >
              <p className="font-bold text-lg">
                🕐 {currentShift.label}
              </p>
            </motion.div>
            
            <div className="space-y-12">
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
                    className="flex-1 px-4 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D9603B] focus:border-transparent text-gray-900 font-medium"
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
                    className="flex-1 px-4 py-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D9603B] focus:border-transparent text-gray-900 font-medium"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="flex justify-center gap-4 pt-6">
                <button
                  onClick={(e) => handleSubmit(e, 'checkin')}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white px-12 py-4 rounded-lg font-bold text-lg hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                >
                  {isLoading && actionType === 'checkin' ? 'Loading...' : '🟢 Check In'}
                </button>
                <button
                  onClick={(e) => handleSubmit(e, 'checkout')}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-red-500 to-red-600 text-white px-12 py-4 rounded-lg font-bold text-lg hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                >
                  {isLoading && actionType === 'checkout' ? 'Loading...' : '🔴 Check Out'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
