import './globals.css';

import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/sonner';
import { DesktopSidemenu } from './_components/desktop-sidemenu';
import { MobileTopmenu } from './_components/mobile-topmenu';
import { TRPCReactProvider } from '@/trpc/react';
// import { Poppins, Roboto_Flex } from 'next/font/google';
import { HydrateClient } from '@/trpc/server';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Alpaca WebUI',
  description:
    'Simple chat UI for Ollama, OpenAI, Together.ai, Mistral.ai and other llm api services that support OpenAI API Chat Completion and Embeddings',
};

// const poppins = Poppins({
//   subsets: ['latin'],
//   weight: ['200', '300', '400', '500', '600', '700'],
//   variable: '--font-poppins',
// });

// ${poppins.variable}

// const robotFlex = Roboto_Flex({
//   weight: ['200', '300', '400', '500', '600', '700'],
//   variable: '--font-robotflex',
// });

// ${robotFlex.variable}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`bg-background flex min-h-screen font-sans antialiased`}>
        <TRPCReactProvider>
          <HydrateClient>
            <Suspense>
              <DesktopSidemenu />
              <div className="flex w-full flex-col">
                <div className="flex h-screen flex-col overflow-hidden">
                  <MobileTopmenu />
                  {children}
                </div>
              </div>
            </Suspense>
          </HydrateClient>
        </TRPCReactProvider>
        <Toaster position="bottom-center" richColors closeButton />
      </body>
    </html>
  );
}
