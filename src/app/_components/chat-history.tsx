'use client';

import type { Dispatch, FC, SetStateAction } from 'react';
import { useChatHistoryMutation, useChatHistoryQuery } from '@/trpc/queries';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { XIcon } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTRPC } from '@/trpc/react';
import { useMutation } from '@tanstack/react-query';

export const ChatHistory: FC<{ isSheet?: boolean; setOpen?: Dispatch<SetStateAction<boolean>> }> = ({
  isSheet = false,
  setOpen = null,
}) => {
  const { data: chatHistories, isLoading: isLoadingChatHistory } = useChatHistoryQuery();
  const router = useRouter();
  const searchParams = useSearchParams();
  const idQueryParam = searchParams.get('id');

  const { invalidate: invalidateChatHistory } = useChatHistoryMutation();

  const trpc = useTRPC();
  const removeChatHistory = useMutation(
    trpc.chatHistory.remove.mutationOptions({
      onSuccess: async () => {
        invalidateChatHistory();
        router.push('/');
      },
    })
  );

  const remove = async (id: string) => {
    await removeChatHistory.mutateAsync({ id });
  };

  return (
    <>
      <div className={`mb-1 ${!isSheet && 'px-4 py-2'} font-semibold`}>History</div>
      <nav className={`grid items-start gap-4 ${!isSheet && 'ps-4'} text-sm font-medium`}>
        <div className="grid gap-0.5 pr-4">
          {isLoadingChatHistory && <Skeleton className="h-3 rounded-full" />}
          {chatHistories.map((c) => {
            return (
              <Link
                key={c.id}
                href={`/?id=${c.id}`}
                onClick={() => {
                  if (setOpen) setOpen(false);
                }}
                className={`flex items-center gap-2 rounded-lg px-2 py-1 ${idQueryParam === c.id && 'bg-stone-500 text-stone-950'} hover:bg-stone-700`}
              >
                <span className="flex-1 text-xs">{c.title}</span>
                <XIcon onClick={() => remove(c.id)} className="rounded-md p-1 hover:bg-stone-800" />
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};
