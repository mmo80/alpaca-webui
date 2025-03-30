import {
  TEmbedDocumentResponse,
  EmbedDocumentResponseSchema,
  TApiSettingsSchema,
  TCreateImageRequest,
  CreateImageRequestSchema,
  TCreateImageResponse,
} from '@/lib/types';
import { apiService, HttpMethod } from './api-service';

const generateImage = async (
  prompt: string,
  model: string,
  baseUrl: string | null,
  apiKey: string | null | undefined
): Promise<TCreateImageResponse> => {
  const url = `${apiService.validUrl(baseUrl)}/v1/images/generations`;
  const values: Partial<TCreateImageRequest> = { prompt: prompt, model: model };
  const payload = CreateImageRequestSchema.parse(values);

  const fetchResponse = await apiService.executeFetch(url, HttpMethod.POST, apiKey, payload);
  if (fetchResponse.response == null) {
    return { created: -1, data: [] };
  }

  const response = (await fetchResponse.response.json()) as TCreateImageResponse;

  return response;
};

const embedDocument = async (
  documentId: number,
  embedModel: string,
  apiSetting: TApiSettingsSchema
): Promise<TEmbedDocumentResponse> => {
  apiService.validUrl(apiSetting.url);

  const payload = {
    embedModel: embedModel,
    documentId: documentId,
    apiSetting: apiSetting,
  };
  const response = await apiService.executeFetch(`/api/documents/embed`, HttpMethod.POST, null, payload);
  if (response.response == null || response.error.isError) {
    return { success: false, errorMessage: response.error.errorMessage };
  }
  const data = await response.response.json();

  const validator = await EmbedDocumentResponseSchema.safeParseAsync(data);
  if (!validator.success) {
    throw validator.error;
  }
  return validator.data;
};

export const api = {
  embedDocument,
  generateImage,
};
