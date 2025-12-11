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
    <div className="min-h-screen bg-gray-100 flex">
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
      <motion.aside
        initial={false}
        animate={{
          x: isSidebarOpen ? 0 : '-100%',
        }}
        className="fixed lg:static top-0 left-0 h-full w-64 bg-[#C84B31] z-40 lg:translate-x-0 flex flex-col"
      >
        {/* Logo */}
        <div className="p-6 flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-[#C84B31] font-bold text-xs leading-tight">Nov.</div>
              <div className="text-[#C84B31] font-bold text-xs leading-tight">Coffee</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-white
                  ${isActive 
                    ? 'bg-white/20 font-semibold' 
                    : 'hover:bg-white/10'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-white hover:bg-white/10 rounded-lg transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
