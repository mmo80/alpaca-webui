'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { MessageSquareMoreIcon, FileInputIcon, Settings2Icon } from 'lucide-react';
import { appName } from '@/lib/providers/data';
import { ChatHistoryList } from './chat-history-list';
import { AppHeader } from './app-header';
import type { FC } from 'react';

export const menuItems = [
  {
    icon: MessageSquareMoreIcon,
    title: 'New Chat',
    href: '/',
    root: true,
  },
  {
    icon: FileInputIcon,
    title: 'Upload document',
    href: '/upload',
    root: false,
  },
  {
    icon: Settings2Icon,
    title: 'Settings',
    href: '/settings',
    root: false,
  },
] as const;

export const DesktopSidemenu: FC = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const idQueryParam = searchParams.get('id');

  return (
    <div className="hidden lg:block">
      <div className="flex h-full max-h-screen flex-col bg-stone-800 md:w-[200px] lg:w-[260px]">
        <AppHeader>{appName}</AppHeader>
        <div className="flex-1">
          <nav className="mb-3 grid items-start gap-2 px-4 text-sm font-medium">
            {menuItems.map((item) => {
              const isActivePage =
                ((pathname.includes(item.href) && !item.root) || (item.root && pathname === item.href)) && !idQueryParam;
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  onClick={() => {
                    if (isActivePage && item.href === '/') {
                      location.href = item.href;
                    }
                  }}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 ${isActivePage && 'bg-stone-500 text-stone-950'} hover:bg-stone-700`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.title}
                </Link>
              );
            })}
          </nav>
          <ChatHistoryList />
        </div>
      </div>
    </div>
  );
};
