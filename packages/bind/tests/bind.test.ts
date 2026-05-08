import { describe, expect, test } from "bun:test"
import {
  bind,
  constructor,
  type Container,
  factory,
  singleton,
  value,
} from "../src/bind"

// ---------------------------------------------------------------------------
// Core resolution
// ---------------------------------------------------------------------------

describe("core resolution", () => {
  test("resolves plain values", () => {
    const c = bind({ x: 42, y: "hello" })
    expect(c.resolve<number>("x")).toBe(42)
    expect(c.resolve<string>("y")).toBe("hello")
  })

  test("resolves factory bindings", () => {
    const c = bind({
      x: 10,
      doubled: factory(({ x }: { x: number }) => x * 2),
    })
    expect(c.resolve<number>("doubled")).toBe(20)
  })

  test("resolves constructor bindings", () => {
    class Greeter {
      greeting: string
      constructor({ name }: { name: string }) {
        this.greeting = `hello ${name}`
      }
    }
    const c = bind({ name: "world", greeter: constructor(Greeter) })
    const g = c.resolve<Greeter>("greeter")
    expect(g).toBeInstanceOf(Greeter)
    expect(g.greeting).toBe("hello world")
  })

  test("throws on unknown key", () => {
    const c = bind({ x: 1 })
    expect(() => c.resolve("missing")).toThrow(
      'No binding found for key "missing"',
    )
  })

  test("resolves 'container' to the container itself", () => {
    const c = bind({ x: 1 })
    expect(c.resolve<Container>("container")).toBe(c)
  })
})

// ---------------------------------------------------------------------------
// Caching / laziness
// ---------------------------------------------------------------------------

describe("caching and laziness", () => {
  test("caches instances — factory called once", () => {
    let calls = 0
    const c = bind({
      svc: factory(() => {
        calls++
        return { id: 1 }
      }),
    })
    const a = c.resolve("svc")
    const b = c.resolve("svc")
    expect(a).toBe(b)
    expect(calls).toBe(1)
  })

  test("factory is not called until key is accessed", () => {
    let called = false
    bind({
      lazy: factory(() => {
        called = true
        return "value"
      }),
    })
    expect(called).toBe(false)
  })

  test("re-binding clears the cached instance", () => {
    const c = bind({ x: 1 })
    expect(c.resolve<number>("x")).toBe(1)
    c.bind({ x: 2 })
    expect(c.resolve<number>("x")).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// Injector proxy
// ---------------------------------------------------------------------------

describe("injector proxy", () => {
  test("proxy resolves on property access", () => {
    const c = bind({ a: 10, b: 20 })
    const inj = c.createInjector<{ a: number; b: number }>()
    expect(inj.a).toBe(10)
    expect(inj.b).toBe(20)
  })

  test("transitive dependencies", () => {
    const c = bind({
      base: 5,
      mid: factory(({ base }: { base: number }) => base * 2),
      top: factory(({ mid }: { mid: number }) => mid + 1),
    })
    expect(c.resolve<number>("top")).toBe(11)
  })
})

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

describe("singleton", () => {
  test("returns the same instance across resolves", () => {
    const c = bind({
      svc: singleton(factory(() => ({ id: Math.random() }))),
    })
    const a = c.resolve("svc")
    const b = c.resolve("svc")
    expect(a).toBe(b)
  })

  test("persists across container clones", () => {
    const c = bind({
      svc: singleton(factory(() => ({ id: Math.random() }))),
    })
    const a = c.resolve("svc")
    const c2 = c.clone()
    const b = c2.resolve("svc")
    expect(a).toBe(b)
  })

  test("wraps plain values automatically", () => {
    const obj = { x: 1 }
    const c = bind({ val: singleton(obj) })
    expect(c.resolve("val")).toBe(obj as any)
  })
})

// ---------------------------------------------------------------------------
// Clone
// ---------------------------------------------------------------------------

describe("clone", () => {
  test("produces independent instance caches", () => {
    let calls = 0
    const c = bind({
      svc: factory(() => ({ n: ++calls })),
    })
    c.resolve("svc")
    const c2 = c.clone()
    const inst = c2.resolve<{ n: number }>("svc")
    expect(inst.n).toBe(2) // separate factory call
  })

  test("clone shares the same binding keys", () => {
    const c = bind({ a: 1, b: 2 })
    const c2 = c.clone()
    expect(c2.resolve<number>("a")).toBe(1)
    expect(c2.resolve<number>("b")).toBe(2)
  })

  test("re-bind in clone does not affect original", () => {
    const c = bind({ x: 1 })
    const c2 = c.clone()
    c2.bind({ x: 99 })
    expect(c.resolve<number>("x")).toBe(1)
    expect(c2.resolve<number>("x")).toBe(99)
  })
})

// ---------------------------------------------------------------------------
// container.call() and container.new()
// ---------------------------------------------------------------------------

describe("call and new", () => {
  test("call passes injector to function and returns result", () => {
    const c = bind({ x: 3, y: 4 })
    const sum = c.call(({ x, y }: { x: number; y: number }) => x + y)
    expect(sum).toBe(7)
  })

  test("call respects thisArg", () => {
    const c = bind({ x: 1 })
    const obj = { multiplier: 10 }
    const result = c.call(function (this: typeof obj, { x }: { x: number }) {
      return x * this.multiplier
    }, obj)
    expect(result).toBe(10)
  })

  test("new constructs class with injector", () => {
    class Adder {
      result: number
      constructor({ a, b }: { a: number; b: number }) {
        this.result = a + b
      }
    }
    const c = bind({ a: 3, b: 7 })
    const inst = c.new(Adder)
    expect(inst).toBeInstanceOf(Adder)
    expect(inst.result).toBe(10)
  })
})

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe("edge cases", () => {
  test("Binding instance passed to bind() is not double-wrapped", () => {
    const fb = factory(() => 42)
    const c = bind({ x: fb })
    expect(c.resolve<number>("x")).toBe(42)
  })

  test("value() is equivalent to a plain value", () => {
    const c = bind({ a: value(99), b: 99 })
    expect(c.resolve("a")).toBe(c.resolve("b"))
  })

  test("circular dependency throws (stack overflow)", () => {
    const c = bind({
      a: factory(({ b }: { b: unknown }) => b),
      b: factory(({ a }: { a: unknown }) => a),
    })
    expect(() => c.resolve("a")).toThrow()
  })
})
