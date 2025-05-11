import type { FC } from 'react';
import React, { useEffect, useState } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { ModelMenu } from './model-menu';
import { Spinner } from './spinner';
import Link from 'next/link';
import { Button } from './ui/button';
import { ArrowLeftRightIcon } from 'lucide-react';
import { ApiTypeEnum } from '@/lib/providers/data';
import { useSettings } from '@/hooks/use-settings';
import type { TOpenAIModelResponseSchema, TProviderSettings } from '@/lib/types';

type ModelAltsProps = {
  selectedProvider: TProviderSettings | null;
  selectedModel: string | null | undefined;
  models: TOpenAIModelResponseSchema[];
  modelsIsSuccess: boolean;
  modelsIsLoading: boolean;
  embeddingModels: boolean;
  onModelChange: (model: string) => void;
  onServiceChange: (service: TProviderSettings) => void;
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
  onServiceChange,
  onReset,
}) => {
  const { providers, isFetched } = useSettings();
  const [noSettings, setNoSettings] = useState(false);

  useEffect(() => {
    if (isFetched && providers.length === 0) {
      setNoSettings(true);
    }
  }, [isFetched, providers]);

  const providersMenu = () => {
    if (providers.length == 0) {
      return;
    }

    return (
      <div className="flex flex-wrap items-start gap-2 pt-2">
        {providers.map((s) => (
          <React.Fragment key={s.providerId}>
            {(embeddingModels && s.hasEmbedding) || !embeddingModels ? (
              <Badge className="cursor-pointer" onClick={() => onServiceChange(s)}>
                {s.providerId}
              </Badge>
            ) : (
              <Badge className="cursor-not-allowed" variant={'secondary'}>
                {s.providerId}
              </Badge>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const resetButton = () => {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="secondary" size="icon" className="ms-1 shrink-0 p-2" onClick={onReset}>
              <ArrowLeftRightIcon />
              <span className="sr-only">Switch provider and model</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Switch provider and model</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const modelsMenu = () => {
    if (!isFetched || modelsIsLoading) {
      return (
        <span className="m-2">
          <Spinner />
        </span>
      );
    }

    return (
      <div className="flex items-start pt-2">
        {models.length == 0 ? (
          <>
            <span>No models available</span>
            {resetButton()}
          </>
        ) : (
          <>
            <div className="flex w-full flex-col md:w-auto">
              <ModelMenu
                models={models ?? []}
                selectedModel={selectedModel ?? ''}
                onModelChange={onModelChange}
                disabled={!modelsIsSuccess}
                className="py-3"
              />
              <span className="bg-secondary rounded-b-lg p-1 pl-4 text-xs">{selectedProvider?.providerId}</span>
            </div>
            {resetButton()}
          </>
        )}
      </div>
    );
  };

  const configureSettings = () => {
    return (
      <h4 className="text-xl font-semibold">
        Configure{' '}
        <Link href={'/settings'} className="underline">
          settings
        </Link>{' '}
        to begin chat
      </h4>
    );
  };

  const renderModelSelector = () => {
    if (providers.length > 0 && selectedProvider == null) {
      return providersMenu();
    }

    switch (selectedProvider?.apiType) {
      case ApiTypeEnum.OLLAMA:
      case ApiTypeEnum.OPENAI:
      case ApiTypeEnum.GOOGLE:
        return modelsMenu();
      default:
        return <span className="flex items-center px-4 pt-2">{isFetched ? configureSettings() : <Spinner />}</span>;
    }
  };

  return <>{noSettings ? configureSettings() : renderModelSelector()}</>;
};

export default ProviderModelMenu;
