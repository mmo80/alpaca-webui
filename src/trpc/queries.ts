import type { TFile } from '@/db/schema';
import type { Documents } from '@/db/vector-db';
import { CustomMessagesSchema, type TCustomChatMessage } from '@/lib/types';
import type { TDocumentChunkRequest, TDocumentIdRequest } from '@/server/api/routers/document';
import { trpc, useTRPC } from '@/trpc/react';
import { useQuery } from '@tanstack/react-query';
import { TRPCClientError } from '@trpc/client';

export const useChatHistoryQuery = () => {
  const trpc = useTRPC();
  const { data = [], isLoading, refetch, error } = useQuery(trpc.chatHistory.all.queryOptions());
  return { data, isLoading, refetch, error };
};

export const useDocumentsQuery = () => {
  const trpc = useTRPC();
  const { data = [], isLoading, refetch, error } = useQuery(trpc.document.all.queryOptions());
  return { data, isLoading, refetch, error };
};

class SingleChatHistoryResult<TCustomChatMessage> {
  constructor(
    public messages: TCustomChatMessage[],
    public title: string | null = null,
    public error: Error | null = null
  ) {}

  get isError(): boolean {
    return this.error !== null;
  }
}

export const getSingleChatHistoryById = async (id: string): Promise<SingleChatHistoryResult<TCustomChatMessage>> => {
  try {
    const result = await trpc.chatHistory.get.query({ id: id });

    if (!result) {
      return new SingleChatHistoryResult([]);
    }

    const parsedMessages = JSON.parse(result.messages);
    const chatMessages = CustomMessagesSchema.parse(parsedMessages) as TCustomChatMessage[];

    return new SingleChatHistoryResult(chatMessages, result.title);
  } catch (err) {
    console.error(err);

    if (err instanceof Error) {
      return new SingleChatHistoryResult([], null, err);
    }

    return new SingleChatHistoryResult(
      [],
      null,
      new Error(err?.toString() ?? `unknown error in '${getSingleChatHistoryById.name}'`)
    );
  }
};

export const getDocumentChunks = async (req: TDocumentChunkRequest): Promise<Documents[]> => {
  try {
    const documents = await trpc.document.getDocumentChunks.query(req);
    return documents;
  } catch (error) {
    if (error instanceof TRPCClientError) {
      console.error('Error fetching documents:', error.message);
      return [];
    }

    console.error('Unexpected error fetching documents:', error);
    return [];
  }
};

type GetDocumentResponse = {
  document: TFile | undefined;
  error: string | undefined;
};

export const getDocument = async (req: TDocumentIdRequest): Promise<GetDocumentResponse> => {
  try {
    const document = await trpc.document.get.query(req);
    return { document, error: undefined };
  } catch (error) {
    if (error instanceof TRPCClientError) {
      if (error.data?.code === 'NOT_FOUND') {
        return { document: undefined, error: error.message };
      }

      console.error('Error fetching document:', error.message);
      return { document: undefined, error: error.message };
    }

    console.error('Unexpected error fetching document:', error);
    return { document: undefined, error: 'Unexpected error fetching document' };
  }
};
