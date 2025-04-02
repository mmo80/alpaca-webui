import { ApiService, HttpMethod } from '@/lib/api-service';
import { TLocalCompletionsRequest, TChatCompletionRequest } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.json();
  const { model, messages, apiKey, baseUrl } = body as TLocalCompletionsRequest;

  const controller = new AbortController();
  const signal = controller.signal;

  request.signal.addEventListener('abort', () => {
    controller.abort();
  });

  const apiService = new ApiService();

  if (!apiKey || !baseUrl) {
    return NextResponse.json({ error: { isError: true, errorMessage: 'apiKey & baseUrl is required' } }, { status: 400 });
  }

  const url = `${baseUrl}/v1/chat/completions`;

  const headers = new Headers({
    'Content-Type': 'application/json',
    'x-api-key': apiKey ?? '',
    'anthropic-version': '2023-06-01',
  });

  const payload: TChatCompletionRequest = {
    model: model,
    messages: messages,
    stream: true,
  };

  const response = await apiService.executeFetch(url, HttpMethod.POST, null, payload, signal, headers);

  if (response.response == null || response.error.isError) {
    return NextResponse.json({ error: { isError: true, errorMessage: response.error.errorMessage } }, { status: 400 });
  }

  if (response.response.body == null) {
    return NextResponse.json(
      { error: { isError: true, errorMessage: `API request failed with empty response body` } },
      { status: 400 }
    );
  }

  const stream = new ReadableStream({
    start(controller) {
      const reader = response.response!.body!.getReader();

      function push() {
        reader.read().then(({ done, value }) => {
          if (done) {
            controller.close();
            return;
          }
          controller.enqueue(value);
          push();
        });
      }

      push();
    },
  });

  return new NextResponse(stream, {
    headers: { 'Content-Type': 'application/json' },
  });
}
