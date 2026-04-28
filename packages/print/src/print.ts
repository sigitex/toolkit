import Writer, { type Redactor } from "@sigitex/writer"
import { type Node, isNothing, resolveLazy } from "./Node"

const DEFAULT_INDENTATION = 2

export function print(options: PrintOptions, nodes: Node[]): string
export function print(nodes: Node[]): string
export function print(
  nodesOrOptions: PrintOptions | Node[],
  maybeNodes?: Node[],
): string {
  if (Array.isArray(nodesOrOptions)) {
    return printRaw(nodesOrOptions)
  } else if (maybeNodes && nodesOrOptions.redact) {
    return printRedacted(
      maybeNodes,
      nodesOrOptions.redact,
      nodesOrOptions.indentation,
    )
  } else if (maybeNodes) {
    return printRaw(maybeNodes)
  }
  throw new Error("Unreachable")
}

export type PrintOptions = {
  readonly redact?: Redactor
  readonly indentation?: number
}

export function printRaw(nodes: Node[], indentation = DEFAULT_INDENTATION) {
  const write = new Writer(indentation)
  for (const node of nodes) {
    printNode(write, node)
  }
  return write.emit()
}

export function printRedacted(
  nodes: Node[],
  redact: Redactor,
  indentation = 2,
) {
  const write = new Writer(indentation, redact)
  for (const node of nodes) {
    printNode(write, node)
  }
  return write.emit()
}

export function printNode(write: Writer, node: Node) {
  if (isNothing(node) || node === "") {
    return
  } else if (node === Infinity) {
    write.text(`"Infinity"`)
  } else if (node === -Infinity) {
    write.text(`"-Infinity"`)
  } else if (node instanceof Date) {
    return `"${node.toISOString()}"`
  } else if (
    typeof node === "number" ||
    typeof node === "bigint" ||
    typeof node === "boolean"
  ) {
    write.text(String(node))
  } else if (typeof node === "string") {
    write.text(node)
  } else if (typeof node === "function") {
    printNode(write, node())
  } else if (Array.isArray(node)) {
    for (const content of node) {
      printNode(write, content)
    }
  } else if (node.type === "newline") {
    write.line()
  } else if (node.type === "builder") {
    printNode(write, node.build())
  } else if (node.type === "pre") {
    write.pre(node.content)
  } else if (node.type === "indent") {
    write.indent()
    for (const content of node.contents) {
      printNode(write, content)
    }
    write.dedent()
  } else if (node.type === "redact") {
    write.redact()
    printNode(write, node.content)
    write.reveal()
  } else if (node.type === "join") {
    let separateIndex = 0
    node.source.forEach((content, index) => {
      const resolved = resolveLazy(node.render(content, index))
      if (isNothing(resolved)) {
        return
      }
      if (separateIndex > 0) {
        printNode(write, node.separator)
      }
      printNode(write, resolved)
      separateIndex++
    })
  } else {
    write.text(`[Unhandled value: ${String(node)}]`)
  }
}
