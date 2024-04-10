import { api } from '@/lib/api';
import { useModelStore } from '@/lib/model-store';
import { TModelsResponseSchema } from '@/lib/types';
import { useQuery } from '@tanstack/react-query';

export const useModelList = (embeddedOnly: boolean = false) => {
  const { selectedService, selectedEmbedService } = useModelStore();

  const keyName = embeddedOnly ? 'embed-models' : 'models';
  const modelListVariant = embeddedOnly ? selectedEmbedService?.modelListVariant : selectedService?.modelListVariant;
  const apiKey = embeddedOnly ? selectedEmbedService?.apiKey : selectedService?.apiKey;
  const url = embeddedOnly ? selectedEmbedService?.url : selectedService?.url;

  const {
    isLoading: modelsIsLoading,
    error: modelsError,
    data: models,
    isSuccess: modelsIsSuccess,
    isError: modelsIsError,
  } = useQuery<TModelsResponseSchema>({
    queryKey: [keyName, modelListVariant, apiKey, url],
    queryFn: async () => {
      switch (modelListVariant) {
        case 'ollama': {
          const models = await api.getTag(url, embeddedOnly);
          return models.map((model) => ({ id: model.name, object: 'model', created: 0, type: null }));
        }
        case 'openai':
          return await api.getModelList(url, apiKey, embeddedOnly);
        case 'manual':
          return [] as TModelsResponseSchema;
      }
      return [] as TModelsResponseSchema;
    },
  });

  return { modelList: { modelsIsLoading, modelsError, models, modelsIsSuccess, modelsIsError } };
};
