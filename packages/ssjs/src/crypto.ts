// oxlint-disable typescript/consistent-type-definitions
export {}

// WinterCG-compatible Web Crypto types
// Works across: Web, Node 15+, Bun, Cloudflare Workers

declare global {
  interface Crypto {
    randomUUID(): `${string}-${string}-${string}-${string}-${string}`
    getRandomValues<T extends ArrayBufferView>(array: T): T
  }

  var crypto: Crypto
}
