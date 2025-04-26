import { ApiService } from '@/lib/api-service';
import { useModelStore } from '@/lib/model-store';
import { ProviderFactory } from '@/lib/providers/provider-factory';
import { type TModelsResponseSchema } from '@/lib/types';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

export const useModelList = (embeddedOnly: boolean = false) => {
  const { selectedService, selectedEmbedService } = useModelStore();

  const keyName = embeddedOnly ? 'embed-models' : 'models';
  const apiSelectedService = embeddedOnly ? selectedEmbedService : selectedService;

  const apiSrv = useMemo(() => new ApiService(), []);
  const providerFactory = useMemo(() => new ProviderFactory(apiSrv), [apiSrv]);

  const {
    isLoading: modelsIsLoading,
    error: modelsError,
    data: models,
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

  return { modelList: { modelsIsLoading, modelsError, models, modelsIsSuccess, modelsIsError } };
};
