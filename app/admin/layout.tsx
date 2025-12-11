'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  ClipboardList,
  LogOut,
  Menu,
  X,
  DollarSign
} from 'lucide-react';

const menuItems = [
  {
    href: '/admin',
    icon: LayoutDashboard,
    label: 'Dashboard',
  },
  {
    href: '/admin/employees',
    icon: Users,
    label: 'Daftar Karyawan',
  },
  {
    href: '/admin/inventori',
    icon: Package,
    label: 'Inventori',
  },
  {
    href: '/admin/attendance',
    icon: ClipboardList,
    label: 'Absensi',
  },
  {
    href: '/admin/payroll',
    icon: DollarSign,
    label: 'Slip Gaji',
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const handleLogout = () => {
    router.push('/');
  };

  return (
    <div className="h-screen bg-gray-100 flex overflow-hidden" suppressHydrationWarning>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-[#C84B31] text-white rounded-lg shadow-lg"
      >
        {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static top-0 left-0 h-screen w-72 bg-gradient-to-b from-[#C84B31] to-[#A03920] z-40 flex flex-col transition-transform duration-300 shadow-2xl ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Logo Section */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
              <div className="text-center">
                <div className="text-[#C84B31] font-bold text-sm leading-tight">Nov.</div>
                <div className="text-[#C84B31] font-bold text-sm leading-tight">Coffee</div>
              </div>
            </div>
            <div>
              <h1 className="text-white font-bold text-xl">November</h1>
              <p className="text-white/70 text-sm">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`
                  group flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200
                  ${isActive 
                    ? 'bg-white text-[#C84B31] shadow-lg font-semibold scale-[1.02]' 
                    : 'text-white hover:bg-white/15 hover:translate-x-1'
                  }
                `}
              >
                <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? 'text-[#C84B31]' : 'text-white/90'}`} />
                <span className="text-[15px]">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-white/10 mt-auto">
          <div className="mb-3 px-4 py-2.5 bg-white/10 rounded-xl backdrop-blur-sm">
            <p className="text-white font-semibold text-sm">Admin</p>
            <p className="text-white/60 text-xs mt-0.5">Administrator</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-3 w-full px-4 py-3 text-white bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-200 group hover:scale-[1.02] active:scale-[0.98]"
          >
            <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 h-screen overflow-auto">
        {children}
      </main>
    </div>
  );
}
