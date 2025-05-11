import { ApiService } from '../api-service';
import { type TProviderSettings } from '../types';
import { ApiServiceEnum } from './data';
import { type Provider } from './provider';
import { providerMap } from './provider-map';

export class ProviderFactory {
  service: ApiService;

  constructor(service: ApiService) {
    this.service = service;
  }

  public getInstance(providerSetting: TProviderSettings): Provider | undefined {
    const ProviderClass = providerMap[providerSetting.providerId as ApiServiceEnum];
    if (!ProviderClass) {
      throw new Error(`No matching provider found for ${providerSetting.providerId}`);
    }
    return new ProviderClass(this.service);
  }
}
