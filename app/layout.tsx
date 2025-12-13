import type { Metadata } from "next";
import { League_Spartan } from "next/font/google";
import { ToasterProvider } from '@/components/ToasterProvider';
import "./globals.css";

const spartan = League_Spartan({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-spartan",
});

export const metadata: Metadata = {
  title: "November Coffee - Sistem Absensi & Inventori",
  description: "Sistem manajemen absensi dan inventori untuk November Coffee",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body
        className={`${spartan.variable} font-spartan antialiased`}
        suppressHydrationWarning
      >
        {children}
        <ToasterProvider />
      </body>
    </html>
  );
}
