'use client';

import { Toaster as HotToaster } from 'react-hot-toast';

export function ToasterProvider() {
  return (
    <HotToaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: '#fff',
          color: '#333',
          boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
        },
        success: {
          iconTheme: {
            primary: '#ea580c',
            secondary: '#fff',
          },
        },
      }}
    />
  );
}
