'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Layer 1: Background Orange */}
      <div className="absolute inset-0 bg-[#D9603B]" />

      {/* Layer 2: Photo with 60% opacity - Left Half */}
      <div className="absolute inset-y-0 left-0 w-2/3">
        <Image
          src="/images/gallery/Merch.jpeg"
          alt="November Coffee"
          fill
          className="object-cover opacity-60"
          priority
        />
      </div>

      {/* Layer 3: White Lines on the right */}
      <div className="absolute inset-0 flex justify-end pointer-events-none">
        <div className="flex gap-6 mr-8">
          <div className="w-24 bg-white" />
          <div className="w-24 bg-white" />
        </div>
      </div>

      {/* Layer 4: Logo and Login Button in center */}
      <div className="relative z-10 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-16"
          >
            {/* Logo Circle */}
            <div className="w-56 h-56 mx-auto bg-white rounded-full flex items-center justify-center shadow-2xl">
              <Image
                src="/images/gallery/november_logo.png"
                alt="November Coffee Logo"
                width={240}
                height={240}
                className="object-contain"
              />
            </div>
          </motion.div>

          {/* Login Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => router.push('/login')}
            className="bg-white text-[#D9603B] px-24 py-5 rounded-lg font-bold text-3xl hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Login
          </motion.button>
        </div>
      </div>
    </div>
  );
}
