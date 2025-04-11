import type { TCustomChatMessage, TCustomMessage } from '@/lib/types';
import { queryClient, trpc, useTRPC } from '@/trpc/react';
import { useQuery } from '@tanstack/react-query';

export const useChatHistoryQuery = () => {
  const trpc = useTRPC();
  const { data = [], isLoading, refetch, error } = useQuery(trpc.chatHistory.all.queryOptions());
  return { data, isLoading, refetch, error };
};

export const useChatHistoryMutation = () => {
  const trpc = useTRPC();
  return {
    invalidate: () => queryClient.invalidateQueries({ queryKey: trpc.chatHistory.all.queryKey() }),
  };
};

export const useFilesQuery = () => {
  const trpc = useTRPC();
  const { data = [], isLoading, refetch, error } = useQuery(trpc.files.all.queryOptions());
  return { data, isLoading, refetch, error };
};

class SingleChatHistoryResult<TCustomChatMessage> {
  constructor(
    public data: TCustomChatMessage[],
    public error: Error | null = null
  ) {}

  get isError(): boolean {
    return this.error !== null;
  }
}

export const getSingleChatHistoryById = async (id: string): Promise<SingleChatHistoryResult<TCustomChatMessage>> => {
  try {
    const result = await trpc.chatHistory.get.query({ id: id }).catch((err: Error) => {
      console.error(err);
      return new SingleChatHistoryResult([], err);
    });

    if (result instanceof SingleChatHistoryResult) {
      return result;
    }

    let chatMessages: TCustomChatMessage[] = [];

    if (result) {
      const parsedMessages = JSON.parse(result.messages);
      chatMessages = parsedMessages.map((msg: TCustomMessage) => ({
        role: (msg as TCustomChatMessage).role,
        content: (msg as TCustomChatMessage).content,
        provider: (msg as TCustomChatMessage).provider,
      })) as TCustomChatMessage[];

      return new SingleChatHistoryResult(chatMessages);
    }

    return new SingleChatHistoryResult([]);
  } catch (err) {
    console.error(err);
    if (err instanceof Error) {
      return new SingleChatHistoryResult([], err);
    }
    return new SingleChatHistoryResult(
      [],
      new Error(err?.toString() ?? `unknown error in '${getSingleChatHistoryById.name}'`)
    );
  }
};
