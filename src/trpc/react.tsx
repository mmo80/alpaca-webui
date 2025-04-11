'use client';

import type { QueryClient } from '@tanstack/react-query';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTRPCClient, httpBatchStreamLink, loggerLink } from '@trpc/client';
import { createTRPCContext } from '@trpc/tanstack-react-query';
import SuperJSON from 'superjson';

import { createQueryClient } from './query-client';
import type { AppRouter } from '@/server/api/root';

let clientQueryClientSingleton: QueryClient | undefined = undefined;
let trpcClientSingleton: ReturnType<typeof createTRPCClient<AppRouter>> | undefined = undefined;

const getBaseUrl = () => {
  if (typeof window !== 'undefined') return window.location.origin;
  //if (env.VERCEL_URL) return `https://${env.VERCEL_URL}`;
  // eslint-disable-next-line no-restricted-properties
  return `http://localhost:${process.env.PORT ?? 3000}`;
};

const getQueryClient = () => {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return createQueryClient();
  } else {
    // Browser: use singleton pattern to keep the same query client
    return (clientQueryClientSingleton ??= createQueryClient());
  }
};

export const trpc = (() => {
  // Use singleton pattern for the client
  if (trpcClientSingleton) return trpcClientSingleton;

  const client = createTRPCClient<AppRouter>({
    links: [
      loggerLink({
        enabled: (op) => process.env.NODE_ENV === 'development' || (op.direction === 'down' && op.result instanceof Error),
      }),
      httpBatchStreamLink({
        transformer: SuperJSON,
        url: getBaseUrl() + '/api/trpc',
        headers() {
          const headers = new Headers();
          headers.set('x-trpc-source', 'nextjs-react');
          return headers;
        },
      }),
    ],
  });

  // In browser environments, save the singleton
  if (typeof window !== 'undefined') {
    trpcClientSingleton = client;
  }

  return client;
})();

export const { useTRPC, TRPCProvider } = createTRPCContext<AppRouter>();

export const queryClient = getQueryClient();

export function TRPCReactProvider(props: Readonly<{ children: React.ReactNode }>) {
  const trpcClient = trpc;

  // const [trpcClient] = useState(() =>
  //   createTRPCClient<AppRouter>({
  //     links: [
  //       loggerLink({
  //         enabled: (op) => process.env.NODE_ENV === 'development' || (op.direction === 'down' && op.result instanceof Error),
  //       }),
  //       httpBatchStreamLink({
  //         transformer: SuperJSON,
  //         url: getBaseUrl() + '/api/trpc',
  //         headers() {
  //           const headers = new Headers();
  //           headers.set('x-trpc-source', 'nextjs-react');
  //           return headers;
  //         },
  //       }),
  //     ],
  //   })
  // );

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        {props.children}
      </TRPCProvider>
    </QueryClientProvider>
  );
}
