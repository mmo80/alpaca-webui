import { ApiService } from '../api-service';
import { TApiSettingsSchema } from '../types';
import { ApiServiceEnum } from './data';
import { Provider } from './provider';
import { providerMap } from './provider-map';

export class ProviderFactory {
  service: ApiService;

  constructor(service: ApiService) {
    this.service = service;
  }

  public getInstance(apiSetting: TApiSettingsSchema): Provider | undefined {
    const ProviderClass = providerMap[apiSetting.serviceId as ApiServiceEnum];
    if (!ProviderClass) {
      throw new Error(`No matching provider found for ${apiSetting.serviceId}`);
    }
    return new ProviderClass(this.service);
  }
}
