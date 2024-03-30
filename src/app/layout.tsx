import type { Metadata } from 'next';
import './globals.css';
import { TopNav } from '@/components/top-nav';
import { Provider } from '@/app/provider';
import { Toaster } from '@/components/ui/sonner';

export const metadata: Metadata = {
  title: 'Alpaca WebUI',
  description: 'Simple chat UI for Ollama',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="dark min-h-screen bg-background font-sans antialiased">
        <div className="container mx-auto flex h-screen flex-col overflow-hidden px-4 sm:px-8">
          <TopNav />
          <Provider>{children}</Provider>
        </div>
        <Toaster position="bottom-center" richColors closeButton />
      </body>
    </html>
  );
}
