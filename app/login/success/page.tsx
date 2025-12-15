'use client';

import * as React from 'react';
import { Suspense } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Check } from 'lucide-react';

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const name = searchParams.get('name') || 'Karyawan';

  React.useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/');
    }, 3000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen relative">
      {/* Background with photo */}
      <div className="absolute inset-0">
        <Image
          src="/images/gallery/Merch.jpeg"
          alt="November Coffee"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Content */}
      <div className="relative h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-2xl p-12 text-center max-w-md w-full"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Check className="w-14 h-14 text-white" strokeWidth={3} />
          </motion.div>

          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Selamat Datang
          </h2>
          
          <p className="text-2xl font-bold text-[#D9603B] mb-6">
            {name}!
          </p>

          <p className="text-gray-600">
            Anda akan diarahkan kembali...
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default function LoginSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-600">Loading...</div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
