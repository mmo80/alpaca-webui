import './globals.css';

import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/sonner';
import { DesktopSidemenu } from './_components/desktop-sidemenu';
import { MobileTopmenu } from './_components/mobile-topmenu';
import { TRPCReactProvider } from '@/trpc/react';

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

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="bg-background flex min-h-screen font-sans antialiased">
        <TRPCReactProvider>
          <DesktopSidemenu />
          <div className="flex w-full flex-col">
            <div className="flex h-screen flex-col overflow-hidden">
              <MobileTopmenu />
              {children}
              {/* <Provider>{children}</Provider> */}
            </div>
          </div>
        </TRPCReactProvider>
        <Toaster position="bottom-center" richColors closeButton />
      </body>
    </html>
  );
}
