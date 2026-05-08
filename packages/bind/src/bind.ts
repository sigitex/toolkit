// oxlint-disable typescript/no-explicit-any
// TODO: Injector.toString, Injector.toJSON

/** Resolves a dependency by key. */
export type Resolve = <T>(key: string) => T
/** A map of keys to raw values or Binding instances. */
export type Binders = { [key: string]: any }
/** A map of keys to resolved Binding instances. */
export type Bindings = { [key: string]: Binding }
/** A map of keys to cached instances. */
export type Instances = { [key: string]: any }
/** A factory function that receives an injector proxy and returns an instance. */
export type InjectableFactory = ((deps: any) => any) | (() => any)
/** A constructor that optionally receives an injector proxy. */
export type InjectableConstructor<T> = { new (): T } | { new (deps: any): T }
/** Internal resolver interface used by bindings and injectors. */
export type Resolver = { readonly resolve: Resolve }

/** Creates a new Container with the given bindings. */
export function bind(bindings: Binders) {
  return new Container().bind(bindings)
}

/** DI container with lazy resolution and proxy-based injection. */
export class Container {
  private readonly bindings: Bindings = {}

  private readonly instances: Instances = {}

  private readonly resolver: Resolver = {
    resolve: (key) => {
      if (key === "container") {
        return this
      }
      if (key in this.instances) {
        return this.instances[key]
      }
      if (key in this.bindings) {
        this.instances[key] = this.bindings[key].getInstance(this.resolver)
        return this.instances[key]
      }
      throw new Error(`No binding found for key "${key}".`)
    },
  }

  /** Resolves a binding by key; throws if not found. */
  get resolve() {
    return this.resolver.resolve as Resolve
  }

  /** Registers bindings; plain values are auto-wrapped. Returns this for chaining. */
  bind(bindings: Binders) {
    for (const [key, binding] of Object.entries(bindings)) {
      if (binding instanceof Binding) {
        this.bindings[key] = binding
      } else {
        this.bindings[key] = new ValueBinding(binding)
      }
      delete this.instances[key]
    }
    return this
  }

  /** Returns a proxy that lazily resolves dependencies on property access. */
  createInjector<T>() {
    return createInjector<T>(this.resolver)
  }

  /** Calls a function with an injector as its first argument. */
  call(fn: InjectableFactory, thisArg?: object) {
    const dependencies = this.createInjector()
    return fn.call(thisArg, dependencies)
  }

  /** Instantiates a class, passing an injector to the constructor. */
  new<T>(ctor: InjectableConstructor<T>): T {
    const dependencies = this.createInjector()
    return new ctor(dependencies)
  }

  /** Clones the container with the same bindings but a fresh instance cache. */
  clone(): Container {
    return bind(this.bindings)
  }
}

/** Base class for all binding types. */
export abstract class Binding {
  abstract getInstance(resolver: Resolver): any
}

/** Binding that creates an instance by calling a factory function with an injector. */
export class FactoryBinding extends Binding {
  private readonly factory: InjectableFactory

  constructor(factory: InjectableFactory) {
    super()
    this.factory = factory
  }

  getInstance(resolver: Resolver) {
    const injector = createInjector(resolver)
    return this.factory(injector)
  }
}

/** Binding that creates an instance via `new Ctor(injector)`. */
export class ConstructorBinding extends Binding {
  private readonly ctor: InjectableConstructor<any>

  constructor(ctor: InjectableConstructor<any>) {
    super()
    this.ctor = ctor
  }

  getInstance(resolver: Resolver) {
    const injector = createInjector(resolver)
    return new this.ctor(injector)
  }
}

/** Binding that returns a static value. */
export class ValueBinding extends Binding {
  private readonly value: any

  constructor(value: any) {
    super()
    this.value = value
  }

  getInstance(_resolver: Resolver) {
    return this.value
  }
}

const singletons: Instances = {}

/** Binding that caches its instance globally, surviving container clones. */
export class SingletonBinding extends Binding {
  private readonly innerBinding: Binding
  private readonly key: string

  constructor(binding: any) {
    super()
    this.innerBinding = binding instanceof Binding ? binding : value(binding)
    this.key = Math.random().toString()
  }

  getInstance(resolver: Resolver) {
    if (this.key in singletons) {
      return singletons[this.key]
    }
    singletons[this.key] = this.innerBinding.getInstance(resolver)
    return singletons[this.key]
  }
}

/** Creates a proxy that resolves dependencies on property access. */
export function createInjector<T>(resolver: Resolver) {
  return new Proxy(
    {},
    {
      get(_target, property: string) {
        const dependency = resolver.resolve(property)
        return dependency
      },
    },
  ) as T
}

// Binders

/** Wraps a static value as a binding. */
export function value(value: any) {
  return new ValueBinding(value)
}

/** Creates a binding that calls a factory function with an injector. */
export function factory(factory: InjectableFactory) {
  return new FactoryBinding(factory)
}

/** Creates a binding that instantiates a class with an injector. */
export function constructor(constructor: InjectableConstructor<any>) {
  return new ConstructorBinding(constructor)
}

/** Wraps a binding so its instance is cached globally across containers. */
export function singleton(binding: any) {
  return new SingletonBinding(binding)
}
