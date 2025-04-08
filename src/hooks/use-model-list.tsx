import { ApiService } from '@/lib/api-service';
import { useModelStore } from '@/lib/model-store';
import { ProviderFactory } from '@/lib/providers/provider-factory';
import { type TModelsResponseSchema } from '@/lib/types';
import { useQuery } from '@tanstack/react-query';

export const useModelList = (embeddedOnly: boolean = false) => {
  const { selectedService, selectedEmbedService } = useModelStore();

  const keyName = embeddedOnly ? 'embed-models' : 'models';
  const apiService = embeddedOnly ? selectedEmbedService : selectedService;

  const {
    isLoading: modelsIsLoading,
    error: modelsError,
    data: models,
    isSuccess: modelsIsSuccess,
    isError: modelsIsError,
  } = useQuery<TModelsResponseSchema>({
    queryKey: [keyName, apiService],
    queryFn: async () => {
      const apiSrv = new ApiService();
      const providerFactory = new ProviderFactory(apiSrv);

      if (apiService) {
        const provider = providerFactory.getInstance(apiService);
        const models = await provider?.models(apiService, embeddedOnly);
        return models as TModelsResponseSchema;
      }

      return [] as TModelsResponseSchema;
    },
  });

  return { modelList: { modelsIsLoading, modelsError, models, modelsIsSuccess, modelsIsError } };
};
