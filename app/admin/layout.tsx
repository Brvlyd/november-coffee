'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  ClipboardList,
  LogOut,
  Menu,
  X,
  DollarSign,
  ChevronDown,
  Upload,
  BarChart3
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
    submenu: [
      {
        href: '/admin/inventori/input-barang',
        icon: Upload,
        label: 'Input Barang',
      },
      {
        href: '/admin/inventori/monitoring-stok',
        icon: BarChart3,
        label: 'Monitoring Stok',
      },
    ],
  },
  {
    href: '/admin/attendance',
    icon: ClipboardList,
    label: 'Absensi',
  },
];

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [openSubmenu, setOpenSubmenu] = React.useState<string | null>(null);

  const handleLogout = () => {
    router.push('/');
  };

  React.useEffect(() => {
    // Auto open submenu if current path is in submenu
    menuItems.forEach((item) => {
      if (item.submenu) {
        const isSubmenuActive = item.submenu.some(sub => pathname.startsWith(sub.href));
        if (isSubmenuActive) {
          setOpenSubmenu(item.href);
        }
      }
    });
  }, [pathname]);

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
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-center">
            <div className="bg-white rounded-full p-4 shadow-lg">
              <Image
                src="/images/gallery/november_logo.png"
                alt="Logo"
                width={180}
                height={180}
                className="object-contain"
              />
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            const hasSubmenu = item.submenu && item.submenu.length > 0;
            const isSubmenuOpen = openSubmenu === item.href;
            const Icon = item.icon;

            return (
              <div key={item.href}>
                {hasSubmenu ? (
                  <button
                    onClick={() => setOpenSubmenu(isSubmenuOpen ? null : item.href)}
                    className={`
                      group flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 w-full
                      ${isSubmenuOpen || pathname.startsWith(item.href + '/')
                        ? 'bg-white text-[#C84B31] shadow-lg font-semibold' 
                        : 'text-white hover:bg-white/15'
                      }
                    `}
                  >
                    <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isSubmenuOpen || pathname.startsWith(item.href + '/') ? 'text-[#C84B31]' : 'text-white/90'}`} />
                    <span className="text-[15px] flex-1 text-left">{item.label}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${isSubmenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                ) : (
                  <Link
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
                )}

                {/* Submenu */}
                {hasSubmenu && isSubmenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-1 ml-4 space-y-1"
                  >
                    {item.submenu!.map((subItem) => {
                      const isSubActive = pathname === subItem.href;
                      const SubIcon = subItem.icon;

                      return (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          onClick={() => setIsSidebarOpen(false)}
                          className={`
                            group flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200
                            ${isSubActive 
                              ? 'bg-white/90 text-[#C84B31] font-semibold' 
                              : 'text-white/80 hover:bg-white/10 hover:text-white'
                            }
                          `}
                        >
                          <SubIcon className={`w-4 h-4 ${isSubActive ? 'text-[#C84B31]' : 'text-white/70'}`} />
                          <span className="text-sm">{subItem.label}</span>
                        </Link>
                      );
                    })}
                  </motion.div>
                )}
              </div>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-white/10 mt-auto">
          <div className="mb-3 px-4 py-2.5 bg-white/10 rounded-xl backdrop-blur-sm">
            <p className="text-white font-semibold text-sm">Manager</p>
            <p className="text-white/60 text-xs mt-0.5">Manager</p>
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
