import { NextRequest, NextResponse } from 'next/server';
import { ApiService, HttpMethod } from '@/lib/api-service';
import { AnthropicModelsResponseSchema, type TModelSchema } from '@/lib/types';

export async function GET(request: NextRequest): Promise<NextResponse<TModelSchema[]>> {
  const apiKey = request.nextUrl.searchParams.get('apiKey');
  const baseUrl = request.nextUrl.searchParams.get('baseUrl');

  if (!apiKey || !baseUrl) {
    return NextResponse.json([], { status: 400 });
  }

  const url = `${baseUrl}/v1/models`;

  const headers = new Headers({
    'Content-Type': 'application/json',
    'x-api-key': apiKey ?? '',
    'anthropic-version': '2023-06-01',
  });

  const apiService = new ApiService();
  const response = await apiService.executeFetch(url, HttpMethod.GET, null, null, null, headers);

  if (response.response == null || response.error.isError) {
    return NextResponse.json([], { status: 400 });
  }

  const data = await response.response.json();

  const validatedModelList = await AnthropicModelsResponseSchema.safeParseAsync(data.data);
  if (!validatedModelList.success) {
    console.error(validatedModelList.error);
    return NextResponse.json([], { status: 400 });
  }

  const models = validatedModelList.data.map(
    (m) =>
      ({
        id: m.id,
        object: m.display_name,
        created: m.created_at ? new Date(m.created_at).getTime() : 0,
        type: m.type,
        embedding: false,
      }) as TModelSchema
  );

  return NextResponse.json(models, { status: 200 });
}
