import Link from 'next/link';
import type { FC, ReactNode } from 'react';
import { GitHubLogoIcon } from '@radix-ui/react-icons';
import { appName } from '@/lib/providers/data';

export const AppHeader: FC<{ children: ReactNode; isSheet?: boolean }> = ({ children, isSheet = false }) => {
  return (
    <div className={`flex items-center gap-4 ${!isSheet && 'p-4'}`}>
      <Link href="/" className={`text-2xl font-semibold`}>
        <span>{children}</span>
      </Link>
      <Link href={'https://github.com/mmo80/alpaca-webui'} title={`Visit the GitHub ${appName} Repository`}>
        <GitHubLogoIcon className="h-6 w-6" />
      </Link>
    </div>
  );
};
