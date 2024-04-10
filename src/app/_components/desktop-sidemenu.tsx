'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { FC, ReactNode } from 'react';

import { ChatBubbleLeftIcon, Cog6ToothIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline';

export const menuItems = [
  {
    icon: ChatBubbleLeftIcon,
    title: 'New Chat',
    href: '/',
    root: true,
  },
  {
    icon: DocumentArrowUpIcon,
    title: 'Upload document',
    href: '/upload',
    root: false,
  },
  {
    icon: Cog6ToothIcon,
    title: 'Settings',
    href: '/settings',
    root: false,
  },
] as const;

export const Header: FC<{ children: ReactNode; isSheet?: boolean }> = ({ children, isSheet = false }) => {
  return (
    <Link href="/" className={`text-2xl font-semibold ${!isSheet && 'py-4 pl-6'}`}>
      <span>{children}</span>
    </Link>
  );
};

export const DesktopSidemenu: FC = () => {
  const pathname = usePathname();

  return (
    <div className="hidden lg:block">
      <div className="flex h-full max-h-screen flex-col bg-stone-800 md:w-[200px] lg:w-[260px]">
        <Header>Alpaca webUI</Header>
        <div className="flex-1">
          <nav className="grid items-start gap-2 px-4 text-sm font-medium">
            {menuItems.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 ${((pathname.includes(item.href) && !item.root) || (item.root && pathname === item.href)) && 'bg-stone-500 text-stone-950'} hover:bg-stone-700`}
              >
                <item.icon className="h-5 w-5" />
                {item.title}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
};
