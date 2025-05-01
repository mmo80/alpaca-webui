'use client';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useState, type FC } from 'react';
import { menuItems } from './desktop-sidemenu';
import Link from 'next/link';
import { MenuIcon } from 'lucide-react';
import { appName } from '@/lib/providers/data';
import { usePathname, useSearchParams } from 'next/navigation';
import { ChatHistoryList } from './chat-history-list';
import { AppHeader } from './app-header';

export const MobileTopmenu: FC = () => {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const searchParams = useSearchParams();
  const idQueryParam = searchParams.get('id');

  return (
    <header className="bg-muted/40 flex h-14 items-center gap-4 border-b p-3 lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="secondary" size="icon" className="shrink-0 p-2">
            <MenuIcon className="h-6 w-6" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex w-[300px] flex-col">
          <SheetHeader>
            <SheetTitle>
              <AppHeader isSheet={true}>{appName}</AppHeader>
            </SheetTitle>
            <SheetDescription></SheetDescription>
          </SheetHeader>

          <nav>
            <section className="grid gap-1 text-base font-medium">
              {menuItems.map((item) => {
                const isActivePage =
                  ((pathname.includes(item.href) && !item.root) || (item.root && pathname === item.href)) && !idQueryParam;

                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    className={`hover:text-foreground mx-[-0.65rem] ${isActivePage && 'bg-stone-500 text-stone-950'} flex items-center gap-4 rounded-xl px-3 py-2`}
                    onClick={() => {
                      setOpen(false);
                      if (isActivePage && item.href === '/') {
                        location.href = item.href;
                      }
                    }}
                  >
                    <item.icon className="h-6 w-6" />
                    {item.title}
                  </Link>
                );
              })}
            </section>

            <section className="h-[calc(100dvh-13rem)] overflow-auto scroll-auto">
              <ChatHistoryList isSheet={true} setOpen={setOpen} />
            </section>
          </nav>
        </SheetContent>
      </Sheet>
      <span className="text-xl font-semibold text-nowrap">{appName}</span>
    </header>
  );
};
