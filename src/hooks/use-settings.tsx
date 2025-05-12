import { Constants, defaultValues } from '@/lib/constants';
import type { TProviderSettings } from '@/lib/types';
import { useTRPC } from '@/trpc/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

export const useSettings = () => {
  const trpc = useTRPC();
  const { data = [], isLoading, refetch, isFetched } = useQuery(trpc.setting.all.queryOptions());
  const updateSettings = useMutation(trpc.setting.insertUpdate.mutationOptions());

  const setSetting = async (key: string, value: string) => {
    try {
      await updateSettings.mutateAsync({ key, value });
    } catch (error) {
      console.error('Error updating setting:', error);
    } finally {
      refetch(); // Refresh cached data
    }
  };

  const setProviders = async (providers: TProviderSettings[]) => {
    try {
      const jsonString = JSON.stringify(providers);
      await setSetting(Constants.settingKeys.providers, jsonString);
    } catch (error) {
      console.error('Error persisting providers:', error);
    }
  };

  const providers = useMemo(() => {
    const settingValue = data?.find((setting) => setting.key === Constants.settingKeys.providers)?.value;

    if (settingValue) {
      try {
        const providers = JSON.parse(settingValue) as TProviderSettings[];
        return providers.sort((a, b) => a.providerId.localeCompare(b.providerId));
      } catch (error) {
        console.error('Error parsing provider settings:', error);
      }
    }

    return [];
  }, [data]);

  const systemPrompt = useMemo(() => {
    const settingValue = data?.find((setting) => setting.key === Constants.settingKeys.systemPrompt)?.value;
    return settingValue ?? defaultValues.systemPrompt;
  }, [data]);

  const systemPromptForRag = useMemo(() => {
    const settingValue = data?.find((setting) => setting.key === Constants.settingKeys.systemPromptForRag)?.value;
    return settingValue ?? defaultValues.systemPromptForRag;
  }, [data]);

  const systemPromptForRagSlim = useMemo(() => {
    const settingValue = data?.find((setting) => setting.key === Constants.settingKeys.systemPromptForRagSlim)?.value;
    return settingValue ?? defaultValues.systemPromptForRagSlim;
  }, [data]);

  const systemPromptForChatTitle = useMemo(() => {
    const settingValue = data?.find((setting) => setting.key === Constants.settingKeys.systemPromptForChatTitle)?.value;
    return settingValue ?? defaultValues.systemPromptForChatTitle;
  }, [data]);

  return {
    settings: data,
    isLoading,
    isFetched,
    setSetting,
    setProviders,
    providers,
    systemPrompt,
    systemPromptForRag,
    systemPromptForRagSlim,
    systemPromptForChatTitle,
  };
};
