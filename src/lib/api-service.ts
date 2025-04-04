export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
}

type ChatResponse = {
  response: Response | null;
  error: ChatError;
};

export type ChatError = {
  isError: boolean;
  errorMessage: string;
};

export class ApiService {
  public validUrl = (url: string | null | undefined): string => {
    if (url == null || url == undefined) {
      throw new Error('Invalid URL');
    }
    return url;
  };

  public executeFetch = async <T>(
    url: string,
    method: HttpMethod,
    apiKey: string | null = null,
    payload: T | null = null,
    abortSignal: AbortSignal | null = null,
    headers: Headers | null = null
  ): Promise<ChatResponse> => {
    if (headers === null) {
      headers = new Headers({
        'Content-Type': 'application/json',
      });
    } else if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    if (apiKey != null && apiKey.length > 0) {
      headers.set('Authorization', `Bearer ${apiKey}`);
    }

    //console.debug(console.log(JSON.stringify(payload, null, 2)));

    let response;
    try {
      response = await fetch(url, {
        method: method,
        headers: headers,
        body: payload != null ? JSON.stringify(payload) : null,
        signal: abortSignal,
      });
    } catch (error) {
      console.error(`Failed to fetch data from ${url}. Check that server is online and reachable. ${error}`);
      return {
        response: null,
        error: {
          isError: true,
          errorMessage: `Failed to fetch data from ${url}. Check that server is online and reachable. ${error}`,
        },
      };
    }

    if (response.status !== 200) {
      console.error(`API request failed with status code: ${response.status}:`);
      return {
        response,
        error: {
          isError: true,
          errorMessage: `${(await response.json())?.error?.message ?? `API request failed with status code: ${response.status}`}`,
        },
      };
    }

    return { response: response, error: { isError: false, errorMessage: '' } };
  };

  public createEmptyStreamReader(): ReadableStreamDefaultReader<Uint8Array> {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        // Immediately close the stream without enqueuing any data
        controller.close();
      },
    });

    return stream.getReader();
  }
}

export const apiService = new ApiService();
