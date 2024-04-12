import { api } from '@/lib/api';
import { useModelStore } from '@/lib/model-store';
import { TModelsResponseSchema } from '@/lib/types';
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
      switch (apiService?.modelListType) {
        case 'ollama': {
          const models = await api.getTag(apiService.url, embeddedOnly);
          return models.map((model) => ({ id: model.name, object: 'model', created: 0, type: null }));
        }
        case 'openai':
          return await api.getModelList(apiService, embeddedOnly);
        case 'manual':
          return [] as TModelsResponseSchema;
      }
      return [] as TModelsResponseSchema;
    },
  });

  return { modelList: { modelsIsLoading, modelsError, models, modelsIsSuccess, modelsIsError } };
};
