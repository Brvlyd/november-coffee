'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { LoginModal } from '@/components/LoginModal';
import Image from 'next/image';

export default function Home() {
  const [isLoginOpen, setIsLoginOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-[#C84B31] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/gallery/halaman_depan.jpeg"
          alt="November Coffee Background"
          fill
          className="object-cover opacity-50"
          priority
        />
        <div className="absolute inset-0 bg-[#C84B31]/60" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          {/* Logo Circle */}
          <div className="w-48 h-48 mx-auto bg-white rounded-full flex items-center justify-center shadow-2xl mb-8">
            <div className="text-center">
              <div className="text-[#C84B31] font-bold text-4xl mb-1">November</div>
              <div className="text-[#C84B31] font-bold text-3xl">Coffee</div>
            </div>
          </div>
        </motion.div>

        {/* Login Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          onClick={() => setIsLoginOpen(true)}
          className="bg-white text-[#C84B31] px-16 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          Login
        </motion.button>
      </div>

      {/* Login Modal */}
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
}
