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

export class QueryResult<T> {
  constructor(
    public data: T | null = null,
    public error: Error | null = null
  ) {}

  get isError(): boolean {
    return this.error !== null;
  }
}

type SingleChatHistoryByIdResponse = {
  messages: TCustomChatMessage[];
  title: string | null;
};

export class TRPCQuery {
  public getSingleChatHistoryById = async (id: string): Promise<QueryResult<SingleChatHistoryByIdResponse>> => {
    try {
      const result = await trpc.chatHistory.get.query({ id: id });

      if (!result) {
        return new QueryResult<SingleChatHistoryByIdResponse>(null, new Error(`No chat history found for id: ${id}`));
      }

      const parsedMessages = JSON.parse(result.messages);
      const chatMessages = CustomMessagesSchema.parse(parsedMessages) as TCustomChatMessage[];

      return new QueryResult<SingleChatHistoryByIdResponse>({ messages: chatMessages, title: result.title });
    } catch (err) {
      console.error(err);

      if (err instanceof Error) {
        return new QueryResult<SingleChatHistoryByIdResponse>(null, err);
      }

      return new QueryResult<SingleChatHistoryByIdResponse>(
        null,
        new Error(err?.toString() ?? `unknown error in '${this.getSingleChatHistoryById.name}'`)
      );
    }
  };

  public getDocumentChunks = async (req: TDocumentChunkRequest): Promise<QueryResult<Documents[] | undefined>> => {
    try {
      const documents = await trpc.document.getDocumentChunks.query(req);

      return new QueryResult<Documents[] | undefined>(documents);
    } catch (error) {
      if (error instanceof TRPCClientError) {
        console.error('Error fetching document chunks:', error.message);
        return new QueryResult<Documents[] | undefined>(null, error);
      }

      console.error('Unexpected error fetching document chunks:', error);
      return new QueryResult<Documents[] | undefined>(null, new Error('Unexpected error fetching document chunks'));
    }
  };

  public getDocument = async (req: TDocumentIdRequest): Promise<QueryResult<TFile | undefined>> => {
    try {
      const document = await trpc.document.get.query(req);
      return new QueryResult<TFile | undefined>(document);
    } catch (error) {
      if (error instanceof TRPCClientError) {
        console.error('Error fetching document:', error.message);
        return new QueryResult<TFile | undefined>(null, error);
      }

      console.error('Unexpected error fetching document:', error);
      return new QueryResult<TFile | undefined>(null, new Error('Unexpected error fetching document'));
    }
  };
}

export const TrpcQuery = new TRPCQuery();
