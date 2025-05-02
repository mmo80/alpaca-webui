import type { FC } from 'react';
import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { ModelMenu } from './model-menu';
import { Spinner } from './spinner';
import type { TApiSetting, TOpenAIModelResponseSchema } from '@/lib/types';
import { useSettingsStore } from '@/lib/settings-store';
import Link from 'next/link';
import { Button } from './ui/button';
import { ArrowLeftRightIcon } from 'lucide-react';
import { ApiTypeEnum } from '@/lib/providers/data';

type ModelAltsProps = {
  selectedService: TApiSetting | null | undefined;
  selectedModel: string | null | undefined;
  models: TOpenAIModelResponseSchema[];
  modelsIsSuccess: boolean;
  modelsIsLoading: boolean;
  hasHydrated: boolean;
  embeddingModels: boolean;
  onModelChange: (model: string) => void;
  onServiceChange: (service: TApiSetting) => void;
  onReset: () => void;
};

const ModelAlts: FC<ModelAltsProps> = ({
  selectedService,
  selectedModel,
  models,
  modelsIsSuccess,
  modelsIsLoading,
  hasHydrated,
  embeddingModels,
  onModelChange,
  onServiceChange,
  onReset,
}) => {
  const { services } = useSettingsStore();

  const renderServiceMenu = () => {
    if (services.length == 0) {
      return renderConfigureSettings();
    }

    return (
      <div className="flex flex-wrap items-start gap-2 pt-2">
        {services.map((s) => (
          <React.Fragment key={s.serviceId}>
            {(embeddingModels && s.hasEmbedding) || !embeddingModels ? (
              <Badge className="cursor-pointer" onClick={() => onServiceChange(s)}>
                {s.serviceId}
              </Badge>
            ) : (
              <Badge className="cursor-not-allowed" variant={'secondary'}>
                {s.serviceId}
              </Badge>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const renderResetButton = () => {
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

  const renderModelMenu = () => {
    if (!hasHydrated || modelsIsLoading) {
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
            {renderResetButton()}
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
              <span className="bg-secondary rounded-b-lg p-1 pl-4 text-xs">{selectedService?.serviceId}</span>
            </div>
            {renderResetButton()}
          </>
        )}
      </div>
    );
  };

  const renderConfigureSettings = () => {
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
    if (services.length > 0 && selectedService == null) {
      return renderServiceMenu();
    }

    switch (selectedService?.apiType) {
      // case 'manual':
      //   return <Input placeholder="Modelname" className="mt-2 w-80" onChange={onModelChangeHandler} />;
      case ApiTypeEnum.OLLAMA:
      case ApiTypeEnum.OPENAI:
      case ApiTypeEnum.GOOGLE:
        return renderModelMenu();
      default:
        return <span className="flex items-center px-4 pt-2">{hasHydrated ? renderConfigureSettings() : <Spinner />}</span>;
    }
  };

  return <>{renderModelSelector()}</>;
};

export default ModelAlts;
