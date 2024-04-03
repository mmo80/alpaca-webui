import type { FC } from 'react';
import { Input } from './ui/input';
import { ModelMenu } from './model-menu';
import { Spinner } from './spinner';
import { ArrowUpIcon } from '@radix-ui/react-icons';
import { TModelResponseSchema } from '@/lib/types';
import { useSettingsStore } from '@/lib/store';

type ModelAltsProps = {
  modelName: string | null;
  models: TModelResponseSchema[];
  modelsIsSuccess: boolean;
  modelsIsLoading: boolean;
  hasHydrated: boolean;
  onModelChange: (modelName: string) => void;
};

const ModelAlts: FC<ModelAltsProps> = ({
  modelName,
  models,
  modelsIsSuccess,
  modelsIsLoading,
  hasHydrated,
  onModelChange,
}) => {
  const { modelVariant } = useSettingsStore();

  const onModelChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    onModelChange(e.target.value);
  }

  const renderModelListVariant = () => {
    // if (modelName == null) {
      switch (modelVariant) {
        case 'manual':
          return (
            <Input
              placeholder="Modelname"
              className="mt-2 w-80"
              onChange={onModelChangeHandler}
            />
          );
        case 'ollama':
        case 'openai':
          return (
            <div className="flex pt-2">
              <ModelMenu models={models ?? []} selectedValue={modelName || ''} onModelChange={onModelChange} disabled={!modelsIsSuccess} className="py-3" />
              {modelsIsLoading && (
                <span className="ml-2">
                  <Spinner />
                </span>
              )}
            </div>
          );
        default:
          return (
            <span className="flex items-center px-4 pt-2">
              {hasHydrated ? (
                <>
                  <h4 className="text-xl font-semibold">Configure settings to begin chat</h4>
                  <ArrowUpIcon className="ml-2" />
                </>
              ) : (
                <Spinner />
              )}
            </span>
          );
      }
    // }
    // return <></>;
  };

  return <>{renderModelListVariant()}</>;
};

export default ModelAlts;
