import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Manrope } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { faviconUrls } from '@/lib/server/favicon';
import './globals.css';

const manrope = Manrope({ variable: '--font-manrope', subsets: ['latin'], display: 'swap' });
const cormorant = Cormorant_Garamond({
  variable: '--font-cormorant',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  // The favicon is chosen in Admin → Settings → General and applies to the site and the admin panel.
  const favicon = await faviconUrls();
  return {
    metadataBase: new URL(process.env.SITE_URL ?? 'http://localhost:3000'),
    icons: favicon
      ? {
          icon: [
            { url: favicon.icon32, sizes: '32x32', type: 'image/png' },
            { url: favicon.icon192, sizes: '192x192', type: 'image/png' },
          ],
          apple: [{ url: favicon.apple, sizes: '180x180', type: 'image/png' }],
        }
      : undefined,
  };
}

export const viewport: Viewport = {
  themeColor: '#0d0d0d',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${manrope.variable} ${cormorant.variable} h-full antialiased`}>
      <body className="min-h-full">
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
