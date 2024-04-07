"use client"

import Link from 'next/link';
import { FC } from 'react';
import { ChatBubbleLeftIcon, Cog6ToothIcon, DocumentArrowUpIcon } from '@heroicons/react/24/outline';
import { usePathname } from 'next/navigation'

const settingsMenuItems = [
  {
    icon: Cog6ToothIcon,
    title: 'Api',
    href: '/settings',
  },
  {
    icon: Cog6ToothIcon,
    title: 'System Prompt',
    href: '/settings/system-prompt',
  },
  {
    icon: Cog6ToothIcon,
    title: 'RAG',
    href: '/settings/rag-system-prompt',
  },
  {
    icon: Cog6ToothIcon,
    title: 'Parameters',
    href: '/settings/parameters',
  },
] as const;

export const SettingsMenu: FC = () => {
  const pathname = usePathname()

  return (
    <nav className="grid gap-2 ps-3 text-sm text-muted-foreground">
      {/* text-primary font-semibold */}
      {settingsMenuItems.map((item) => (
        <Link key={item.title} href={item.href} className={`flex items-center gap-3 rounded-lg px-3 py-2 ${pathname === item.href && 'bg-stone-500 text-stone-950'} hover:bg-stone-700`}>
          {item.title}
        </Link>
      ))}
    </nav>
  );
};
