# bind

A lightweight dependency injection container.

`bun add @sigitex/bind`

> **Note:** This package currently exports TypeScript sources directly. A TypeScript-compatible runtime or bundler (Bun, etc.) is required.

## Quick Start

```ts
import { bind, factory, singleton, constructor } from "@sigitex/bind"

const container = bind({
  dbUrl: "postgres://localhost/mydb",
  db: factory(({ dbUrl }) => createPool(dbUrl)),
  userService: factory(({ db }) => new UserService(db)),
})

const userService = container.resolve<UserService>("userService")
```

## API

### `bind(bindings)`

Creates a new `Container` with the given bindings. This is a shorthand for `new Container().bind(bindings)`.

```ts
const container = bind({
  port: 3000,
  host: "localhost",
})
```

### `Container`

The core class. Manages bindings and resolves dependencies lazily (instances are created on first access and then cached).

#### `container.bind(bindings)`

Registers bindings. Plain values are wrapped in a `ValueBinding` automatically. Returns the container for chaining.

```ts
container.bind({
  logger: factory(({ config }) => new Logger(config)),
  config: { level: "debug" },
})
```

Re-binding a key clears its cached instance, so subsequent resolves will use the new binding.

#### `container.resolve<T>(key)`

Resolves a binding by key. Throws if the key is not found.

```ts
const logger = container.resolve<Logger>("logger")
```

The special key `"container"` always resolves to the container itself.

#### `container.createInjector<T>()`

Returns a proxy object that lazily resolves dependencies on property access. This is how dependencies are injected into factories and constructors.

```ts
type Deps = { db: Database; logger: Logger }
const deps = container.createInjector<Deps>()
// deps.db triggers resolve("db") on first access
```

#### `container.call(fn)`

Calls a function with an injector as its first argument.

```ts
container.call(({ db, logger }) => {
  logger.info("connected")
  return db.query("SELECT 1")
})
```

#### `container.new(Constructor)`

Instantiates a class, passing an injector to the constructor.

```ts
class UserService {
  constructor({ db, logger }: Deps) { /* ... */ }
}

const service = container.new(UserService)
```

#### `container.clone()`

Creates a new container with the same bindings (but fresh instance cache). Useful for per-request scoping.

```ts
async function handleRequest(request: Request) {
  const requestContainer = container.clone()
  requestContainer.bind({ identity: await authenticate(request) })
  // ...
}
```

## Binding Types

### Plain values

Any value that is not a `Binding` instance is treated as a value binding:

```ts
bind({ port: 3000, name: "my-app" })
```

### `value(v)`

Explicit value binding (equivalent to passing a plain value):

```ts
import { value } from "@sigitex/bind"
bind({ port: value(3000) })
```

### `factory(fn)`

Creates the instance by calling `fn` with an injector. A new instance is created each time the container resolves the key (though the container caches the result after the first resolve).

```ts
import { factory } from "@sigitex/bind"

bind({
  db: factory(({ connectionString }) => new Pool(connectionString)),
})
```

### `constructor(Class)`

Like `factory`, but calls `new Class(injector)` instead.

```ts
import { constructor } from "@sigitex/bind"

class EmailService {
  constructor({ smtp, templates }: Deps) { /* ... */ }
}

bind({ emailService: constructor(EmailService) })
```

### `singleton(binding)`

Wraps any other binding so that its instance persists across container clones and outlives any single container. Useful for expensive resources that should be shared globally (connection pools, etc.).

```ts
import { factory, singleton } from "@sigitex/bind"

bind({
  pool: singleton(factory(({ dbUrl }) => new Pool(dbUrl))),
})
```

## Resolution Behavior

- Dependencies are resolved **lazily** -- a factory/constructor is not called until its key is first accessed.
- Once resolved, instances are **cached** within that container. Subsequent resolves return the same instance.
- The injector proxy resolves each property access independently -- you only pay for dependencies you actually use.
- `singleton` caches globally (across all containers), while regular bindings cache per-container instance.

## Usage with Frameworks

The container is designed to be cloned per-request so each request gets its own scope while sharing the base bindings:

```ts
const baseContainer = bind({
  db: singleton(factory(() => createPool())),
  userRepo: factory(({ db }) => new UserRepo(db)),
})

// Per-request:
const container = baseContainer.clone()
container.bind({ identity: currentUser })
```
