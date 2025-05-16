import { NextRequest, NextResponse } from 'next/server';
import { ApiService, HttpMethod } from '@/lib/api-service';
import { OllamaTagResponseSchema, type TModelSchema } from '@/lib/types';

export async function GET(request: NextRequest): Promise<NextResponse<TModelSchema[]>> {
  const baseUrl = request.nextUrl.searchParams.get('baseUrl');

  if (!baseUrl) {
    return NextResponse.json([], { status: 400 });
  }

  const url = `${baseUrl}/api/tags`;

  const headers = new Headers({
    'Content-Type': 'application/json',
  });

  const apiService = new ApiService();
  const response = await apiService.executeFetch(url, HttpMethod.GET, null, null, null, headers);

  if (response.response == null || response.error.isError) {
    return NextResponse.json([], { status: 400 });
  }

  const data = await response.response.json();

  const validatedModelList = await OllamaTagResponseSchema.safeParseAsync(data);
  if (!validatedModelList.success) {
    console.error(validatedModelList.error);
    return NextResponse.json([], { status: 400 });
  }

  const models = validatedModelList.data.models.map(
    (m) =>
      ({
        id: m.name,
        object: 'model',
        created: 0,
        embedding: m.details.family.includes('bert'),
      }) as TModelSchema
  );

  return NextResponse.json(models, { status: 200 });
}
