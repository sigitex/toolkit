// oxlint-disable typescript/consistent-type-definitions
export { }

// WinterCG-compatible URL types
// Works across: Web, Node 10+, Bun, Cloudflare Workers

declare global {
  interface URL {
    hash: string
    host: string
    hostname: string
    href: string
    readonly origin: string
    password: string
    pathname: string
    port: string
    protocol: string
    search: string
    readonly searchParams: URLSearchParams
    username: string
    toString(): string
    toJSON(): string
  }

  var URL: {
    prototype: URL
    new (url: string | URL, base?: string | URL): URL
    canParse(url: string | URL, base?: string | URL): boolean
  }

  interface URLSearchParams {
    append(name: string, value: string): void
    delete(name: string, value?: string): void
    get(name: string): string | null
    getAll(name: string): string[]
    has(name: string, value?: string): boolean
    set(name: string, value: string): void
    sort(): void
    readonly size: number
    toString(): string
    forEach(
      callback: (value: string, name: string, parent: URLSearchParams) => void,
    ): void
    entries(): IterableIterator<[string, string]>
    keys(): IterableIterator<string>
    values(): IterableIterator<string>
    [Symbol.iterator](): IterableIterator<[string, string]>
  }

  var URLSearchParams: {
    prototype: URLSearchParams
    new (
      init?:
        | string
        | URLSearchParams
        | Record<string, string>
        | [string, string][],
    ): URLSearchParams
  }
}
