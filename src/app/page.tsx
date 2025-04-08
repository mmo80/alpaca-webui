import { HydrateClient } from '@/trpc/server';
import { Main } from './_components/main';

export default async function Home() {
  return (
    <HydrateClient>
      <Main></Main>
    </HydrateClient>
  );
}
