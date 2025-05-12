import type { FC } from 'react';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ModelMenu } from './model-menu';
import Link from 'next/link';
import { ArrowUpIcon } from 'lucide-react';
import { useSettings } from '@/hooks/use-settings';
import type { TOpenAIModelResponseSchema, TProviderSettings } from '@/lib/types';
import { Skeleton } from './ui/skeleton';

type ModelAltsProps = {
  selectedProvider: TProviderSettings | null;
  selectedModel: string | null;
  models: TOpenAIModelResponseSchema[];
  modelsIsSuccess: boolean;
  modelsIsLoading: boolean;
  embeddingModels: boolean;
  onModelChange: (model: string) => void;
  onProviderChange: (provider: TProviderSettings) => void;
  onReset: () => void;
};

const ProviderModelMenu: FC<ModelAltsProps> = ({
  selectedProvider,
  selectedModel,
  models,
  modelsIsSuccess,
  modelsIsLoading,
  embeddingModels,
  onModelChange,
  onProviderChange,
  onReset,
}) => {
  const { providers, isFetched, isLoading } = useSettings();

  const providersMenu = () => {
    if (providers.length === 0) {
      return;
    }

    return (
      <div className="flex flex-wrap items-start gap-2">
        {providers.map((s) => (
          <React.Fragment key={s.providerId}>
            {(embeddingModels && s.hasEmbedding) || !embeddingModels ? (
              <Badge
                className="cursor-pointer"
                onClick={() => onProviderChange(s)}
                variant={`${selectedProvider?.providerId === s.providerId ? 'default' : 'secondary'}`}
              >
                {s.providerId}
              </Badge>
            ) : (
              <Badge className="cursor-not-allowed" variant={'outline'}>
                {s.providerId}
              </Badge>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const modelsMenu = () => {
    return (
      <>
        {!selectedProvider ? (
          <div className="bg-secondary flex h-9 w-80 place-content-center items-center gap-2 rounded-lg">
            <span>Choose Provider</span>
            <ArrowUpIcon />
          </div>
        ) : (
          <div className="flex items-start">
            {models.length == 0 ? (
              <span>No models available</span>
            ) : (
              <ModelMenu
                models={models ?? []}
                selectedModel={selectedModel ?? ''}
                onModelChange={onModelChange}
                disabled={!modelsIsSuccess}
                className="py-3"
              />
            )}
          </div>
        )}
      </>
    );
  };

  return (
    <section className="flex flex-col gap-2 pt-3">
      {isFetched && providers.length === 0 ? (
        <h4 className="text-xl font-semibold">
          Configure{' '}
          <Link href={'/settings'} className="underline">
            settings
          </Link>{' '}
          to begin chat
        </h4>
      ) : (
        <>
          {isFetched ? providersMenu() : <Skeleton className="h-5 w-44 rounded-lg" />}
          {!isFetched || isLoading || modelsIsLoading ? <Skeleton className="h-9 w-80 rounded-lg" /> : modelsMenu()}
        </>
      )}
    </section>
  );
};

export default ProviderModelMenu;
