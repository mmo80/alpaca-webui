import { queryClient, useTRPC } from '@/trpc/react';
import { useQuery } from '@tanstack/react-query';

export const useChatHistoryQuery = () => {
  const trpc = useTRPC();
  const { data = [], isLoading, refetch, error } = useQuery(trpc.chatHistory.all.queryOptions());
  return { data, isLoading, refetch, error };
};

export const useSingleChatHistoryQuery = (id: string) => {
  const trpc = useTRPC();
  const { data, isLoading, refetch, error } = useQuery(trpc.chatHistory.get.queryOptions({ id: id }));
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
