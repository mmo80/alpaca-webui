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

export const ChatHistoryList: FC<{ isSheet?: boolean; setOpen?: Dispatch<SetStateAction<boolean>> }> = ({
  isSheet = false,
  setOpen = undefined,
}) => {
  const { data: chatHistories, isLoading: isLoadingChatHistory } = useChatHistoryQuery();
  const router = useRouter();
  const searchParams = useSearchParams();
  const idQueryParam = searchParams.get('id');
  const [openDeleteDialog, setOpenDeleteDialog] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (chatHistories?.length > 0) {
      const dialogState: Record<string, boolean> = {};
      chatHistories.forEach((history) => {
        dialogState[history.id] = false;
      });
      setOpenDeleteDialog(dialogState);
    }
  }, [chatHistories]);

  const { invalidate: invalidateChatHistory } = useChatHistoryMutation();

  const trpc = useTRPC();
  const removeChatHistory = useMutation(
    trpc.chatHistory.remove.mutationOptions({
      onSuccess: async (_, variables) => {
        invalidateChatHistory();
        if (idQueryParam === variables.id) {
          router.push('/');
        }
      },
    })
  );

  const remove = async (id: string) => {
    await removeChatHistory.mutateAsync({ id });
  };

  const toggleDeleteDialog = (id: string, isOpen: boolean) => {
    setOpenDeleteDialog((prev) => ({
      ...prev,
      [id]: isOpen,
    }));
  };

  return (
    <>
      <div className={`mb-1 ${!isSheet && 'px-4 py-2'} font-semibold`}>History</div>
      <nav className={`grid items-start gap-4 ${!isSheet && 'ps-4'} text-sm font-medium`}>
        <div className="grid gap-0.5 pr-4">
          {isLoadingChatHistory && <Skeleton className="h-3 rounded-full" />}
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
                        className={`group relative flex items-center gap-2 rounded-lg px-2 py-1.5 ${idQueryParam === c.id && 'bg-stone-500 text-stone-950'} truncate hover:bg-stone-700`}
                      >
                        <span className="w-full truncate text-xs">{c.title}</span>
                        <XIcon
                          onClick={(e) => {
                            e.preventDefault();
                            toggleDeleteDialog(c.id, true);
                          }}
                          className="invisible absolute top-1/2 right-2 h-4 w-4 -translate-y-1/2 rounded-md text-white group-hover:visible group-hover:bg-stone-700 hover:bg-stone-900"
                        />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent className="rounded-lg bg-black">
                      <p className="w-52 text-wrap text-white">{c.title}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <Dialog open={openDeleteDialog[c.id]} onOpenChange={(isOpen) => toggleDeleteDialog(c.id, isOpen)}>
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
                      <Button onClick={() => remove(c.id)}>Delete</Button>
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

/*
const ChatHistoryLink: FC<{
  item: TChatHistory;
  setOpen?: Dispatch<SetStateAction<boolean>>;
  idQueryParam: string | null;
  toggleDeleteDialog: (id: string, isOpen: boolean) => void;
}> = ({ item, setOpen, idQueryParam, toggleDeleteDialog }) => {
  return (
    <Link
      href={`/?id=${item.id}`}
      onClick={() => {
        if (setOpen) setOpen(false);
      }}
      className={`group relative flex items-center gap-2 rounded-lg px-2 py-1.5 ${idQueryParam === item.id && 'bg-stone-500 text-stone-950'} truncate hover:bg-stone-700`}
    >
      <span className="w-full truncate text-xs">{item.title}</span>
      <XIcon
        onClick={(e) => {
          e.preventDefault();
          toggleDeleteDialog(item.id, true);
        }}
        className="invisible absolute top-1/2 right-2 h-4 w-4 -translate-y-1/2 rounded-md text-white group-hover:visible group-hover:bg-stone-700 hover:bg-stone-900"
      />
    </Link>
  );
};
*/
