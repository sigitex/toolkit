# writer

`bun add @sigitex/writer`

> **Note:** This package currently exports TypeScript sources directly. A TypeScript-compatible runtime or bundler (Bun, etc.) is required.

A lightweight, chainable string builder with support for indentation, iteration, preformatted text, and content redaction. Useful for code generation, structured text output, and templating.

For a higher-level, declarative approach to string building, see [`@sigitex/print`](../print), which is built on top of `Writer`.

## Quick start

```ts
import Writer from "@sigitex/writer"

const w = new Writer()
const output = w
  .line("function greet(name) {")
  .indent()
  .line("console.log(`Hello, ${name}!`)")
  .dedent()
  .line("}")
  .emit()
```

## API

### `new Writer(indentation?, redactor?)`

Creates a new `Writer` instance.

- **`indentation`** (`number`, default `2`) — number of spaces per indent level.
- **`redactor`** (`(value: unknown) => string`, optional) — a function applied to any text written inside a `redact()`/`reveal()` block.

### `.text(text)`

Appends `text` to the output without a trailing newline. Returns `this` for chaining.

```ts
w.text("hello ").text("world")
// "hello world"
```

### `.line(text?)`

Appends optional `text` followed by a newline (plus current indentation on the next line). Returns `this`.

```ts
w.line("first line")
 .line("second line")
```

### `.indent()`

Increases the indent level by one. The next line will be indented accordingly. If the previous token was a newline, it is replaced (avoiding a blank line before the indent).

### `.dedent()`

Decreases the indent level by one. If the previous token was a newline, it is replaced. If the previous token was an `indent` (i.e. an empty indented block), the indent is simply removed.

### `.each(list, callback)`

Iterates over `list`, calling `callback(element, writer)` for each item. Returns `this`. Useful for generating repetitive structures inline:

```ts
const items = ["a", "b", "c"]

w.line("const items = [")
 .indent()
 .each(items, (item) => {
   w.line(`"${item}",`)
 })
 .dedent()
 .line("]")
```

### `.pre(text)`

Appends a preformatted block of text. Leading/trailing newlines are trimmed, and common leading indentation is stripped — so you can write template literals naturally:

```ts
w.line("header").pre(`
    line one
    line two
    line three
`).line("footer")
```

The three lines will be emitted without their original 4-space indent.

### `.redact()` / `.reveal()`

Marks a region of output as redacted. Any `.text()` or `.line()` calls between `.redact()` and `.reveal()` will have their content passed through the `redactor` function provided in the constructor. If no redactor was set, text is emitted normally.

```ts
const w = new Writer(2, (value) => "***")
w.text("user: ")
 .redact()
 .text("secret-token")
 .reveal()
 .emit()
// "user: ***"
```

### `.clone()`

Creates a new `Writer` with the same `indentation` setting but no tokens. Useful when you need a fresh writer with matching formatting.

### `.emit()`

Renders all accumulated tokens into a string and returns it.

## Real-world example

Generating TypeScript declarations (from [`@hypeup/generator`](https://github.com/sigitex)):

```ts
import Writer from "@sigitex/writer"

function generateHtml(elements: Element[]) {
  const ts = new Writer()

  return ts
    .line("// GENERATED")
    .line(`import type { ElementBuilder } from "@hypeup/runtime"`)
    .line()
    .line("declare global {")
    .indent()
    .each(elements, (element) => {
      ts.line(`/** ${element.help} */`)
        .line(`const ${element.jsName}: ElementBuilder`)
        .line()
    })
    .dedent()
    .line("}")
    .line()
    .emit()
}
```

## Types

```ts
// Redactor function signature
type Redactor = (value: unknown) => string
```
