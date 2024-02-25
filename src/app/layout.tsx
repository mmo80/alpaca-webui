import type { Metadata } from "next";
// import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TopNav } from "@/components/top-nav";
import { Provider } from "@/app/provider";

// const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Alpaca for Ollama",
  description: "Simple chat UI for Ollama",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <html lang="en" suppressHydrationWarning>
        <body className="min-h-screen bg-background font-sans antialiased">
          <div className="container flex flex-col h-screen overflow-hidden">
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem
              disableTransitionOnChange
            >
              <TopNav />
              <Provider>{children}</Provider>
            </ThemeProvider>
          </div>
        </body>
      </html>
    </>
  );
}
