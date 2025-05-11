import { ApiService } from '@/lib/api-service';
import type { Provider } from '@/lib/providers/provider';
import { ProviderFactory } from '@/lib/providers/provider-factory';
import type { TProviderSettings } from '@/lib/types';
import { useMemo, useState } from 'react';

export const useProvider = (providerSetting: TProviderSettings | null) => {
  const [provider, setProvider] = useState<Provider | null>(null);

  const apiService = useMemo(() => new ApiService(), []);
  const providerFactory = useMemo(() => new ProviderFactory(apiService), [apiService]);

  const currentProvider = useMemo(() => {
    if (provider && provider.providerId() === providerSetting?.providerId) {
      return provider;
    }

    if (!providerSetting) {
      return null;
    }

    const providerInstance = providerFactory.getInstance(providerSetting);
    if (providerInstance) {
      setProvider(providerInstance);
      return providerInstance;
    }

    return null;
  }, [provider, providerFactory, providerSetting]);

  return { provider: currentProvider };
};
