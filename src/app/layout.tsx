import type { Metadata } from 'next';
import './globals.css';
import { Provider } from '@/app/provider';
import { Toaster } from '@/components/ui/sonner';
import { DesktopSidemenu } from './_components/desktop-sidemenu';
import type { ReactNode } from 'react';
import { MobileTopmenu } from './_components/mobile-topmenu';

export const metadata: Metadata = {
  title: 'Alpaca WebUI',
  description:
    'Simple chat UI for Ollama, OpenAI, Together.ai, Mistral.ai and other llm api services that support OpenAI API Chat Completion and Embeddings',
};

/*
BODY: dark min-h-screen bg-background font-sans antialiased
DIV: container mx-auto flex h-screen flex-col overflow-hidden px-4 sm:px-8


CURRENT DIV: px-3 h-full
*/

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex min-h-screen bg-background font-sans antialiased">
        <DesktopSidemenu />
        <div className="flex w-full flex-col">
          <div className="flex h-screen flex-col overflow-hidden">
            <MobileTopmenu />
            <Provider>{children}</Provider>
          </div>
        </div>

        <Toaster position="bottom-center" richColors closeButton />
      </body>
    </html>
  );
}
