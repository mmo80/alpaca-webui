import { ApiService } from '../api-service';
import { type TProviderSettings } from '../types';
import { ApiProviderEnum } from './data';
import { type Provider } from './provider';
import { providerMap } from './provider-map';

export class ProviderFactory {
  service: ApiService;

  constructor(service: ApiService) {
    this.service = service;
  }

  public getInstance(providerSetting: TProviderSettings): Provider | undefined {
    const ProviderClass = providerMap[providerSetting.providerId as ApiProviderEnum];
    if (!ProviderClass) {
      throw new Error(`No matching provider found for ${providerSetting.providerId}`);
    }
    return new ProviderClass(this.service);
  }
}
