// oxlint-disable typescript/consistent-type-definitions
export { };

// WinterCG-compatible encoding types
// Works across: Web, Node 16+, Bun, Cloudflare Workers

declare global {
  function atob(data: string): string
  function btoa(data: string): string

  interface TextEncoder {
    readonly encoding: "utf8"
    encode(input?: string): Uint8Array
    encodeInto(
      input: string,
      dest: Uint8Array,
    ): { read: number; written: number }
  }

  var TextEncoder: {
    prototype: TextEncoder
    new (): TextEncoder
  }

  interface TextDecoder {
    readonly encoding: string
    readonly fatal: boolean
    readonly ignoreBOM: boolean
    decode(
      input?: ArrayBufferView | ArrayBuffer,
      options?: { stream?: boolean },
    ): string
  }

  var TextDecoder: {
    prototype: TextDecoder
    new (
      label?: string,
      options?: { fatal?: boolean; ignoreBOM?: boolean },
    ): TextDecoder
  }
}
