'use client';

import Link from 'next/link';
import { type FC } from 'react';
import { usePathname } from 'next/navigation';

const settingsMenuItems = [
  {
    title: 'Api',
    href: '/settings',
  },
  {
    title: 'System Prompt',
    href: '/settings/system-prompt',
  },
  {
    title: 'RAG',
    href: '/settings/rag-system-prompt',
  },
  // {
  //   title: 'Parameters',
  //   href: '/settings/parameters',
  // },
] as const;

export const SettingsMenu: FC = () => {
  const pathname = usePathname();

  return (
    <nav className="text-muted-foreground grid gap-2 ps-3 pb-3 text-sm">
      {settingsMenuItems.map((item) => (
        <Link
          key={item.title}
          href={item.href}
          className={`flex items-center gap-3 rounded-lg px-3 py-2 font-semibold ${pathname === item.href && 'bg-stone-500 text-stone-950'} hover:bg-stone-700`}
        >
          {item.title}
        </Link>
      ))}
    </nav>
  );
};
