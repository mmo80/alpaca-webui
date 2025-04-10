'use client';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useState, type FC } from 'react';
import { Header, menuItems } from './desktop-sidemenu';
import Link from 'next/link';
import { Bars3Icon } from '@heroicons/react/24/outline';
import { appName } from '@/lib/providers/data';
import { usePathname } from 'next/navigation';
import { ChatHistory } from './chat-history';

export const MobileTopmenu: FC = () => {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-muted/40 flex h-14 items-center gap-4 border-b p-3 lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="secondary" size="icon" className="shrink-0 p-2">
            <Bars3Icon className="h-6 w-6" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex w-[300px] flex-col">
          <SheetHeader>
            <SheetTitle>
              <Header isSheet={true}>{appName}</Header>
            </SheetTitle>
            <SheetDescription></SheetDescription>
          </SheetHeader>

          <nav className="grid gap-1 text-base font-medium">
            {menuItems.map((item) => {
              const isActivePage = (pathname.includes(item.href) && !item.root) || (item.root && pathname === item.href);

              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className="hover:text-foreground mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2"
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
          </nav>

          <ChatHistory isSheet={true} setOpen={setOpen} />
        </SheetContent>
      </Sheet>
      <span className="text-xl font-semibold text-nowrap">{appName}</span>
    </header>
  );
};
