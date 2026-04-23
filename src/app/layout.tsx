import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import SessionProviderWrapper from '@/app/components/SessionProviderWrapper';
import { TurnoProvider } from '@/app/context/TurnoContext';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'e-Parking Dashboard',
  description: 'Operación, administración y control centralizado del sistema.',
  other: {
    google: 'notranslate',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning translate="no">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SessionProviderWrapper>
          <TurnoProvider>
            {children}
          </TurnoProvider>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
