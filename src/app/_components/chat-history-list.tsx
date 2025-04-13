'use client';

import { useEffect, useState, type Dispatch, type FC, type SetStateAction } from 'react';
import { useChatHistoryMutation, useChatHistoryQuery } from '@/trpc/queries';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { XIcon } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTRPC } from '@/trpc/react';
import { useMutation } from '@tanstack/react-query';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Spinner } from '@/components/spinner';

type ChatItemState = {
  openDeleteDialog: boolean;
  deleting: boolean;
};

export const ChatHistoryList: FC<{ isSheet?: boolean; setOpen?: Dispatch<SetStateAction<boolean>> }> = ({
  isSheet = false,
  setOpen = undefined,
}) => {
  const { data: chatHistories, isLoading: isLoadingChatHistory } = useChatHistoryQuery();
  const router = useRouter();
  const searchParams = useSearchParams();
  const idQueryParam = searchParams.get('id');

  const [itemState, setItemState] = useState<Record<string, ChatItemState>>({});

  useEffect(() => {
    if (chatHistories?.length > 0) {
      const itemState: Record<string, ChatItemState> = {};
      chatHistories.forEach((history) => {
        itemState[history.id] = { openDeleteDialog: false, deleting: false };
      });
      setItemState(itemState);
    }
  }, [chatHistories]);

  const { invalidate: invalidateChatHistory } = useChatHistoryMutation();

  const trpc = useTRPC();
  const removeChatHistory = useMutation(
    trpc.chatHistory.remove.mutationOptions({
      onSuccess: async (_, variables) => {
        const id = variables.id;
        invalidateChatHistory();
        if (idQueryParam === id) {
          router.push('/');
        }

        toggleDeleteDialog(id, false);
        setItemState((prev) => ({
          ...prev,
          [id]: { openDeleteDialog: prev[id]?.openDeleteDialog ?? true, deleting: false },
        }));
      },
    })
  );

  const remove = async (id: string) => {
    setItemState((prev) => ({
      ...prev,
      [id]: { openDeleteDialog: prev[id]?.openDeleteDialog ?? true, deleting: true },
    }));
    await removeChatHistory.mutateAsync({ id });
  };

  const toggleDeleteDialog = (id: string, isOpen: boolean) => {
    setItemState((prev) => ({
      ...prev,
      [id]: { openDeleteDialog: isOpen, deleting: false },
    }));
  };

  return (
    <>
      <div className={`mb-1 ${!isSheet && 'px-4 py-2'} font-semibold`}>History</div>
      <nav className={`grid items-start gap-4 ${!isSheet && 'ps-4'} text-sm font-medium`}>
        <div className="grid gap-0.5 pr-4">
          {isLoadingChatHistory && (
            <div className="grid gap-2">
              <Skeleton className="h-4 rounded-lg" />
              <Skeleton className="h-4 rounded-lg" />
            </div>
          )}
          {chatHistories.map((c) => {
            return (
              <React.Fragment key={c.id}>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link
                        href={`/?id=${c.id}`}
                        onClick={() => {
                          if (setOpen) setOpen(false);
                        }}
                        className={`group relative flex items-center gap-2 rounded-lg px-1.5 py-1.5 ${idQueryParam === c.id && 'bg-stone-500 text-stone-950'} truncate hover:bg-stone-700`}
                      >
                        <span className="w-full truncate text-xs">{c.title}</span>
                        <XIcon
                          onClick={(e) => {
                            e.preventDefault();
                            toggleDeleteDialog(c.id, true);
                          }}
                          className="invisible absolute top-1/2 right-1 -translate-y-1/2 rounded-md p-1 text-white group-hover:visible group-hover:bg-stone-700 hover:bg-stone-900"
                        />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent className="rounded-lg bg-black" side="bottom">
                      <p className="w-52 text-wrap text-white">{c.title}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <Dialog open={itemState[c.id]?.openDeleteDialog} onOpenChange={(isOpen) => toggleDeleteDialog(c.id, isOpen)}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="pb-3">Delete Thread?</DialogTitle>
                      <DialogDescription>
                        This will permanetly delete the chat "<strong>{c.title}</strong>". Are you sure?
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button type="button" variant="secondary">
                          Cancel
                        </Button>
                      </DialogClose>
                      <Button onClick={() => remove(c.id)} disabled={itemState[c.id]?.deleting === true}>
                        {itemState[c.id]?.deleting === true ? (
                          <>
                            <Spinner /> Deleting...
                          </>
                        ) : (
                          'Delete'
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </React.Fragment>
            );
          })}
        </div>
      </nav>
    </>
  );
};
