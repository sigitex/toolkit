# print

`bun add @sigitex/print`

> **Note:** This package currently exports TypeScript sources directly. A TypeScript-compatible runtime or bundler (Bun, etc.) is required.

A declarative string builder for generating structured text output. You describe output as a tree of **nodes** -- strings, arrays, helper objects -- and `print` renders them into a formatted string.

## Quick start

```ts
import { print, newline, indent } from "@sigitex/print"

const output = print([
  "select *", newline,
  "from users", newline,
  "where active = 1", newline,
])
```

## How it works

The `print` function takes an array of values and renders them to a string. A value (type `Node`) can be:

- A **string** -- emitted as-is.
- A **number**, **bigint**, or **boolean** -- converted to a string.
- A **`Date`** -- emitted as an ISO string.
- An **array** of nodes -- each element is rendered in sequence.
- A **function** (lazy node) -- called at render time, its return value is rendered.
- Specific **falsy values** (`false`, `null`, `undefined`) -- silently skipped. This makes conditional nodes easy.
- A **helper object** (`newline`, `indent`, `join`, `pre`, `redact`) -- see below.

## API

### `print(nodes)`

Renders an array of nodes into a string with the default indentation (2 spaces).

```ts
import { print } from "@sigitex/print"

const sql = print(["select ", "name", newline, "from users"])
```

### `print(options, nodes)`

Renders with options:

```ts
import { print, type PrintOptions } from "@sigitex/print"

const output = print(
  { indentation: 4, redact: (v) => "***" },
  nodes,
)
```

**`PrintOptions`:**
- **`indentation`** (`number`) -- spaces per indent level (default `2`).
- **`redact`** (`(value: unknown) => string`) -- redactor function for `redact()` nodes.

## Helpers

### `newline`

A node that emits a line break followed by the current indentation.

```ts
import { newline } from "@sigitex/print"

print(["line one", newline, "line two"])
```

### `indent(...contents)`

Wraps `contents` in an indented block. Indentation increases by one level for the contents, then decreases after.

```ts
import { indent, newline } from "@sigitex/print"

print([
  "create table users (", 
  indent(
    "id integer primary key,", newline,
    "name text not null,", newline,
    "email text not null",
  ),
  ");", newline,
])
```

Output:

```
create table users (
  id integer primary key,
  name text not null,
  email text not null
);
```

### `join(separator, source, render)`

Renders each item in `source` through the `render` callback, interleaving `separator` nodes between non-empty results. Items that render to nothing (`null`, `undefined`, `false`) are skipped without producing extra separators.

```ts
import { join, newline } from "@sigitex/print"

const columns = ["id", "name", "email"]

print([
  "select ",
  join(", ", columns, (col) => col),
  newline,
  "from users",
])
// "select id, name, email\nfrom users"
```

### `pre(content)`

Emits a preformatted text block. Leading/trailing newlines are trimmed and common leading whitespace is stripped, so you can use indented template literals:

```ts
import { pre } from "@sigitex/print"

print([
  "header", 
  pre(`
    line one
    line two
  `),
  "footer",
])
```

### `redact(content)`

Wraps a node so its text content is passed through the `redact` function from `PrintOptions`. If no redactor was provided, text is emitted normally.

```ts
import { print, redact } from "@sigitex/print"

const output = print(
  { redact: () => "***" },
  ["token: ", redact("my-secret")],
)
// "token: ***"
```

## Conditional nodes

Falsy values are silently skipped, so you can use `&&` for conditional output:

```ts
const hasLimit = true
const limit = 10

print([
  "select * from users", newline,
  hasLimit && ["limit ", String(limit), newline],
])
```

If `hasLimit` is `false`, the array is not emitted.

## Composing nodes

Since a `Node` can be an array of nodes, you can break output into composable functions that each return a `Node`:

```ts
import { indent, newline, type Node } from "@sigitex/print"

function whereClause(conditions: string[]): Node {
  return [
    "where ",
    indent(
      conditions.map((cond, i) => [
        i > 0 && "and ",
        cond, newline,
      ]),
    ),
  ]
}

// Use it in a larger structure:
print([
  "select *", newline,
  "from users", newline,
  whereClause(["active = 1", "age > 18"]),
])
```

## Lazy nodes

A function returning a node is evaluated at render time. Useful for deferring expensive computation:

```ts
print([
  "result: ",
  () => computeExpensiveValue(),
])
```

## Types

```ts
type Node = Resolved | Lazy<Resolved>
type Resolved = Scalar | Node[]
type Lazy<T> = () => T

type Scalar =
  | boolean | number | string | bigint
  | undefined | null
  | Date
  | Newline
  | Indent
  | Redact
  | Pre
  | Join<any>
  | Builder
  | Printer
```
