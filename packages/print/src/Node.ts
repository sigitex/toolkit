// oxlint-disable typescript/no-explicit-any
import type Writer from "@sigitex/writer"

export type Node = Resolved | Lazy<Resolved>
export type Resolved = Scalar | Node[]
export type Lazy<T> = () => T
export type MaybeLazy<T> = T | Lazy<T>
export type Optional<T> = T | Nothing

export type Nothing = undefined | null | false
export type Primitive = boolean | number | string | bigint
export type BuiltIn = Nothing | Primitive | Date

export type Singular = MaybeLazy<Scalar | Nothing>

export type Scalar =
  | BuiltIn
  | Newline
  | Indent
  | Redact
  | Pre
  | Join<any>
  | Builder
  | Printer

export type Newline = {
  readonly type: "newline"
}

export type Indent = {
  readonly type: "indent"
  readonly contents: Node[]
}

export type Redact = {
  readonly type: "redact"
  readonly content: Node
}

export type Pre = {
  readonly type: "pre"
  readonly content: string
}

export type Join<T> = {
  readonly type: "join"
  readonly separator: Node
  readonly source: T[]
  readonly render: (item: T, index: number) => Node
}

export type Builder = {
  readonly type: "builder"
  readonly build: () => Node
}

export type Printer = {
  readonly type: "printer"
  readonly print: (write: Writer) => string
}

export function isNothing<T>(node: T | Nothing): node is Nothing {
  return node === null || node === undefined || node === false
}

export function resolveLazy<T>(it: MaybeLazy<T>): T {
  if (typeof it === "function") {
    return (it as Lazy<T>)()
  }
  return it
}
