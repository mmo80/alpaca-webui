import type { FC } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from './ui/input';
import { ModelMenu } from './model-menu';
import { Spinner } from './spinner';
import { TApiSettingsSchema, TModelResponseSchema } from '@/lib/types';
import { useSettingsStore } from '@/lib/settings-store';
import Link from 'next/link';
import { Button } from './ui/button';
import { ArrowUturnLeftIcon } from '@heroicons/react/24/outline';

type ModelAltsProps = {
  selectedService: TApiSettingsSchema | null | undefined;
  selectedModel: string | null | undefined;
  models: TModelResponseSchema[];
  modelsIsSuccess: boolean;
  modelsIsLoading: boolean;
  hasHydrated: boolean;
  onModelChange: (model: string) => void;
  onServiceChange: (service: TApiSettingsSchema) => void;
  onReset: () => void;
};

const ModelAlts: FC<ModelAltsProps> = ({
  selectedService,
  selectedModel,
  models,
  modelsIsSuccess,
  modelsIsLoading,
  hasHydrated,
  onModelChange,
  onServiceChange,
  onReset,
}) => {
  const { services } = useSettingsStore();

  const onModelChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    onModelChange(e.target.value);
  };

  const renderServiceMenu = () => {
    if (services.length == 0) {
      return renderConfigureSettings();
    }

    return (
      <>
        <div className="flex flex-wrap items-start gap-2 pt-2">
          {services.map((s) => (
            <Badge key={s.serviceId} className="cursor-pointer" onClick={() => onServiceChange(s)}>
              {s.serviceId}
            </Badge>
          ))}
        </div>
      </>
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
      <div className="flex items-center pt-2">
        {models.length == 0 ? (
          <>
            <span className="me-2">No models available</span>
            <Button variant="secondary" size="icon" className="shrink-0 p-2" onClick={onReset}>
              <ArrowUturnLeftIcon />
              <span className="sr-only">Reset service and model choice</span>
            </Button>
          </>
        ) : (
          <>
            <ModelMenu
              models={models ?? []}
              selectedModel={selectedModel ?? ''}
              onModelChange={onModelChange}
              disabled={!modelsIsSuccess}
              className="py-3"
            />
            <Button variant="secondary" size="icon" className="ms-2 shrink-0 p-2" onClick={onReset}>
              <ArrowUturnLeftIcon />
              <span className="sr-only">Reset service and model choice</span>
            </Button>
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

    switch (selectedService?.modelListVariant) {
      case 'manual':
        return <Input placeholder="Modelname" className="mt-2 w-80" onChange={onModelChangeHandler} />;
      case 'ollama':
      case 'openai':
        return renderModelMenu();
      default:
        return <span className="flex items-center px-4 pt-2">{hasHydrated ? renderConfigureSettings() : <Spinner />}</span>;
    }
  };

  return <>{renderModelSelector()}</>;
};

export default ModelAlts;
