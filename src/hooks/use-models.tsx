import { ApiService } from '@/lib/api-service';
import { useModelStore } from '@/lib/model-store';
import { ProviderFactory } from '@/lib/providers/provider-factory';
import { type TModelsResponseSchema } from '@/lib/types';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

export const useModels = (embeddedOnly: boolean = false) => {
  const { selectedProvider, selectedEmbedProvider } = useModelStore();

  const keyName = embeddedOnly ? 'embed-models' : 'models';
  const apiSelectedService = embeddedOnly ? selectedEmbedProvider : selectedProvider;

  const apiSrv = useMemo(() => new ApiService(), []);
  const providerFactory = useMemo(() => new ProviderFactory(apiSrv), [apiSrv]);

  const {
    isLoading: modelsIsLoading,
    error: modelsError,
    data = [],
    isSuccess: modelsIsSuccess,
    isError: modelsIsError,
  } = useQuery<TModelsResponseSchema>({
    queryKey: [keyName, apiSelectedService],
    queryFn: async () => {
      if (apiSelectedService) {
        const provider = providerFactory.getInstance(apiSelectedService);
        const models = await provider?.models(apiSelectedService, embeddedOnly);
        return models as TModelsResponseSchema;
      }

      return [] as TModelsResponseSchema;
    },
  });

  return { models: { modelsIsLoading, modelsError, data, modelsIsSuccess, modelsIsError } };
};
