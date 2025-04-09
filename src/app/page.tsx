import { HydrateClient } from '@/trpc/server';
import { Main } from './_components/main';
import { Suspense } from 'react';

export default async function Home() {
  return (
    <HydrateClient>
      <Suspense>
        <Main></Main>
      </Suspense>
    </HydrateClient>
  );
}
