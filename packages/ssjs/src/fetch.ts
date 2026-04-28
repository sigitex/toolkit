// oxlint-disable typescript/consistent-type-definitions
export { }

// WinterCG-compatible Web API types for fetch/Request/Response
// Works across: Web, Node 18+, Bun, Cloudflare Workers

declare global {
  interface ReadableStreamReadDoneResult {
    done: true
    value?: undefined
  }

  interface ReadableStreamReadValueResult<T> {
    done: false
    value: T
  }

  interface ReadableStreamDefaultReader<R = unknown> {
    readonly closed: Promise<undefined>
    cancel(reason?: unknown): Promise<void>
    read(): Promise<
      ReadableStreamReadValueResult<R> | ReadableStreamReadDoneResult
    >
    releaseLock(): void
  }

  interface ReadableStream<R = unknown> {
    readonly locked: boolean
    cancel(reason?: unknown): Promise<void>
    getReader(): ReadableStreamDefaultReader<R>
    pipeTo(
      destination: WritableStream<R>,
      options?: { preventClose?: boolean; preventAbort?: boolean; preventCancel?: boolean; signal?: AbortSignal },
    ): Promise<void>
    pipeThrough<T>(
      transform: { writable: WritableStream<R>; readable: ReadableStream<T> },
      options?: { preventClose?: boolean; preventAbort?: boolean; preventCancel?: boolean; signal?: AbortSignal },
    ): ReadableStream<T>
    tee(): [ReadableStream<R>, ReadableStream<R>]
    [Symbol.asyncIterator](): AsyncIterableIterator<R>
  }

  var ReadableStream: {
    prototype: ReadableStream
    new <R = unknown>(
      underlyingSource?: {
        start?(controller: unknown): void | Promise<void>
        pull?(controller: unknown): void | Promise<void>
        cancel?(reason?: unknown): void | Promise<void>
        type?: undefined | "bytes"
      },
      strategy?: { highWaterMark?: number; size?(chunk: R): number },
    ): ReadableStream<R>
  }

  interface WritableStream<W = unknown> {
    readonly locked: boolean
    abort(reason?: unknown): Promise<void>
    close(): Promise<void>
    getWriter(): WritableStreamDefaultWriter<W>
  }

  interface WritableStreamDefaultWriter<W = unknown> {
    readonly closed: Promise<undefined>
    readonly desiredSize: number | null
    readonly ready: Promise<undefined>
    abort(reason?: unknown): Promise<void>
    close(): Promise<void>
    releaseLock(): void
    write(chunk?: W): Promise<void>
  }

  var WritableStream: {
    prototype: WritableStream
    new <W = unknown>(
      underlyingSink?: {
        start?(controller: unknown): void | Promise<void>
        write?(chunk: W, controller: unknown): void | Promise<void>
        close?(): void | Promise<void>
        abort?(reason?: unknown): void | Promise<void>
      },
      strategy?: { highWaterMark?: number; size?(chunk: W): number },
    ): WritableStream<W>
  }

  interface Blob {
    readonly size: number
    readonly type: string
    arrayBuffer(): Promise<ArrayBuffer>
    bytes(): Promise<Uint8Array>
    slice(start?: number, end?: number, contentType?: string): Blob
    stream(): ReadableStream<Uint8Array>
    text(): Promise<string>
  }

  var Blob: {
    prototype: Blob
    new (
      blobParts?: (ArrayBufferView | ArrayBuffer | Blob | string)[],
      options?: { type?: string; endings?: "transparent" | "native" },
    ): Blob
  }

  interface FormData {
    append(name: string, value: string | Blob, fileName?: string): void
    delete(name: string): void
    get(name: string): string | Blob | null
    getAll(name: string): (string | Blob)[]
    has(name: string): boolean
    set(name: string, value: string | Blob, fileName?: string): void
    forEach(
      callback: (value: string | Blob, key: string, parent: FormData) => void,
    ): void
    entries(): IterableIterator<[string, string | Blob]>
    keys(): IterableIterator<string>
    values(): IterableIterator<string | Blob>
    [Symbol.iterator](): IterableIterator<[string, string | Blob]>
  }

  var FormData: {
    prototype: FormData
    new (): FormData
  }

  interface AbortSignal {
    readonly aborted: boolean
    readonly reason: unknown
    throwIfAborted(): void
    addEventListener(
      type: "abort",
      listener: (event: Event) => void,
      options?: { once?: boolean },
    ): void
    removeEventListener(
      type: "abort",
      listener: (event: Event) => void,
    ): void
  }

  var AbortSignal: {
    prototype: AbortSignal
    abort(reason?: unknown): AbortSignal
    timeout(milliseconds: number): AbortSignal
    any(signals: AbortSignal[]): AbortSignal
  }

  interface AbortController {
    readonly signal: AbortSignal
    abort(reason?: unknown): void
  }

  var AbortController: {
    prototype: AbortController
    new (): AbortController
  }

  interface Event {
    readonly type: string
    readonly target: unknown
    readonly currentTarget: unknown
    readonly bubbles: boolean
    readonly cancelable: boolean
    readonly defaultPrevented: boolean
    readonly timeStamp: number
    preventDefault(): void
    stopPropagation(): void
    stopImmediatePropagation(): void
  }

  type HeadersInit = Headers | Record<string, string> | [string, string][]

  type BodyInit =
    | ReadableStream<Uint8Array>
    | ArrayBufferView
    | ArrayBuffer
    | URLSearchParams
    | FormData
    | Blob
    | string
    | null

  type RequestInfo = string | URL | Request

  type RequestRedirect = "follow" | "error" | "manual"

  interface RequestInit {
    method?: string
    headers?: HeadersInit
    body?: BodyInit
    signal?: AbortSignal | null
    redirect?: RequestRedirect
    integrity?: string
    keepalive?: boolean
    duplex?: "half"
  }

  interface ResponseInit {
    status?: number
    statusText?: string
    headers?: HeadersInit
  }

  interface Body {
    readonly body: ReadableStream<Uint8Array> | null
    readonly bodyUsed: boolean
    arrayBuffer(): Promise<ArrayBuffer>
    blob(): Promise<Blob>
    formData(): Promise<FormData>
    json(): Promise<unknown>
    text(): Promise<string>
  }

  interface Headers {
    append(name: string, value: string): void
    delete(name: string): void
    get(name: string): string | null
    getSetCookie(): string[]
    has(name: string): boolean
    set(name: string, value: string): void
    forEach(
      callback: (value: string, name: string, parent: Headers) => void,
    ): void
    entries(): IterableIterator<[string, string]>
    keys(): IterableIterator<string>
    values(): IterableIterator<string>
    [Symbol.iterator](): IterableIterator<[string, string]>
  }

  var Headers: {
    prototype: Headers
    new (init?: HeadersInit): Headers
  }

  interface Request extends Body {
    readonly method: string
    readonly url: string
    readonly headers: Headers
    readonly signal: AbortSignal
    readonly redirect: RequestRedirect
    readonly integrity: string
    readonly keepalive: boolean
    clone(): Request
  }

  var Request: {
    prototype: Request
    new (input: RequestInfo, init?: RequestInit): Request
  }

  interface Response extends Body {
    readonly status: number
    readonly statusText: string
    readonly ok: boolean
    readonly headers: Headers
    readonly url: string
    readonly redirected: boolean
    clone(): Response
  }

  var Response: {
    prototype: Response
    new (body?: BodyInit, init?: ResponseInit): Response
    json(data: unknown, init?: ResponseInit): Response
    redirect(url: string | URL, status?: number): Response
    error(): Response
  }

  function fetch(input: RequestInfo, init?: RequestInit): Promise<Response>
}
