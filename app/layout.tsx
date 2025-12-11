import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ToasterProvider } from '@/components/ToasterProvider';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
        <ToasterProvider />
      </body>
    </html>
  );
}
