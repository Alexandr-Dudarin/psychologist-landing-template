export type MockRequest = {
  method?: string;
  headers?: Record<string, string | undefined>;
  query?: Record<string, unknown>;
  body?: unknown;
};

export type MockResponse = {
  statusCode: number;
  jsonBody: unknown;
  headers: Record<string, string | string[]>;
  status: (code: number) => MockResponse;
  json: (payload: unknown) => MockResponse;
  setHeader: (name: string, value: string | string[]) => void;
};

export function createMockRequest(overrides: MockRequest = {}): MockRequest {
  return {
    method: "GET",
    headers: {},
    query: {},
    body: undefined,
    ...overrides,
  };
}

export function createMockResponse(): MockResponse {
  return {
    statusCode: 200,
    jsonBody: undefined,
    headers: {},
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.jsonBody = payload;
      return this;
    },
    setHeader(name: string, value: string | string[]) {
      this.headers[name] = value;
    },
  };
}
