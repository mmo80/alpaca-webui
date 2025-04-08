import { useTRPC } from '@/trpc/react';
import { useQuery } from '@tanstack/react-query';

// export const useChatHistoryQuery = () => {
//   const trpc = useTRPC();
//   const { data = [], isLoading, refetch, error } = useQuery(trpc.chatHistory.all.queryOptions());
//   return { data, isLoading, refetch, error };
// };

export const useFilesQuery = () => {
  const trpc = useTRPC();
  const { data = [], isLoading, refetch, error } = useQuery(trpc.files.all.queryOptions());
  return { data, isLoading, refetch, error };
};
