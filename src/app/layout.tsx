import type { Metadata } from 'next';
import './globals.css';
import { TopNav } from '@/components/top-nav';
import { Provider } from '@/app/provider';

export const metadata: Metadata = {
  title: 'Alpaca for Ollama',
  description: 'Simple chat UI for Ollama',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="dark min-h-screen bg-background font-sans antialiased">
        <div className="container flex flex-col h-screen overflow-hidden">
          <TopNav />
          <Provider>{children}</Provider>
        </div>
      </body>
    </html>
  );
}
