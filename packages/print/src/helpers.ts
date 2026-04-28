import type { Indent, Join, Newline, Node, Pre, Redact } from "./Node"

export const newline: Newline = { type: "newline" }

export function indent(...contents: Node[]): Indent {
  return { type: "indent", contents }
}

// TODO: indentTail

export function redact(content: Node): Redact {
  return { type: "redact", content }
}

export function pre(content: string): Pre {
  return { type: "pre", content }
}

export function join<T>(
  separator: Node,
  source: T[],
  render: (node: T, index: number) => Node,
): Join<T> {
  return { type: "join", separator, render, source }
}
