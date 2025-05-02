import { ApiService } from '@/lib/api-service';
import type { Provider } from '@/lib/providers/provider';
import { ProviderFactory } from '@/lib/providers/provider-factory';
import type { TApiSetting } from '@/lib/types';
import { useMemo, useState } from 'react';

export const useProvider = (apiSetting: TApiSetting | null | undefined) => {
  const [provider, setProvider] = useState<Provider | undefined>(undefined);

  const apiService = useMemo(() => new ApiService(), []);
  const providerFactory = useMemo(() => new ProviderFactory(apiService), [apiService]);

  const currentProvider = useMemo(() => {
    if (provider && provider.providerId() === apiSetting?.serviceId) {
      return provider;
    }

    if (!apiSetting) {
      return undefined;
    }

    const providerInstance = providerFactory.getInstance(apiSetting);
    if (providerInstance) {
      setProvider(providerInstance);
      return providerInstance;
    }

    return undefined;
  }, [provider, providerFactory, apiSetting]);

  return { provider: currentProvider };
};
