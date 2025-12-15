'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function InventoriPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to monitoring stok as default
    router.replace('/admin/inventori/monitoring-stok');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-gray-600">Redirecting...</div>
    </div>
  );
}
