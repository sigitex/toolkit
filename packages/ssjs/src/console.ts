// oxlint-disable typescript/consistent-type-definitions
export {}

// WinterCG-compatible Console types
// Works across: Web, Node, Bun, Cloudflare Workers

declare global {
  interface Console {
    log(...args: unknown[]): void
    error(...args: unknown[]): void
    warn(...args: unknown[]): void
    info(...args: unknown[]): void
    debug(...args: unknown[]): void
  }

  var console: Console
}
