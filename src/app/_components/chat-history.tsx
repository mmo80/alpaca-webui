'use client';

import type { FC } from 'react';
import { useChatHistoryQuery } from '@/trpc/queries';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { ChatBubbleLeftIcon } from '@heroicons/react/24/outline';

export const ChatHistory: FC<{ isSheet?: boolean }> = ({ isSheet = false }) => {
  const { data: chatHistories, isLoading: isLoadingChatHistory } = useChatHistoryQuery();

  return (
    <>
      <div className={`text-l mb-1 ${!isSheet && 'px-4 py-2'} font-semibold`}>History</div>
      <nav className={`grid items-start gap-4 ${!isSheet && 'ps-4'} text-sm font-medium`}>
        <div className="grid gap-2 pr-6">
          {isLoadingChatHistory && <Skeleton className="h-3 rounded-full" />}
          {/*
          ${isActivePage && 'bg-stone-500 text-stone-950'}
          */}
          {chatHistories.map((c) => (
            <Link
              key={c.id}
              href={`/?id=${c.id}`}
              className={`flex items-center gap-3 rounded-lg px-3 py-1 hover:bg-stone-700`}
            >
              <ChatBubbleLeftIcon className="h-5 w-5" />
              {c.id.substring(24, 36)}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
};
