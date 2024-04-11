'use client';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState, type FC } from 'react';
import { Header, menuItems } from './desktop-sidemenu';
import Link from 'next/link';
import { Bars3Icon } from '@heroicons/react/24/outline';
import { appName } from '@/lib/data';

export const MobileTopmenu: FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-muted/40 p-3 lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="secondary" size="icon" className="shrink-0 p-2">
            <Bars3Icon className="h-6 w-6" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex w-[300px] flex-col">
          <Header isSheet={true}>{appName}</Header>
          <nav className="grid gap-1 text-base font-medium">
            {menuItems.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 hover:text-foreground"
                onClick={() => setOpen(false)}
              >
                <item.icon className="h-6 w-6" />
                {item.title}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
      <span className="text-nowrap text-xl font-semibold">{appName}</span>
      {/* <Link href={'https://github.com/mmo80/alpaca-webui'} className="ml-auto">
        <GitHubLogoIcon className="h-6 w-6" />
      </Link> */}
    </header>
  );
};
