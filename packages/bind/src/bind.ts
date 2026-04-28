// oxlint-disable typescript/no-explicit-any
// TODO: Injector.toString, Injector.toJSON

export type Resolve = <T>(key: string) => T
export type Binders = { [key: string]: any }
export type Bindings = { [key: string]: Binding }
export type Instances = { [key: string]: any }
export type InjectableFactory = ((deps: any) => any) | (() => any)
export type InjectableConstructor<T> = { new (): T } | { new (deps: any): T }
export type Resolver = { readonly resolve: Resolve }

export function bind(bindings: Binders) {
  return new Container().bind(bindings)
}

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

  get resolve() {
    return this.resolver.resolve as Resolve
  }

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

  createInjector<T>() {
    return createInjector<T>(this.resolver)
  }

  call(fn: InjectableFactory, thisArg?: object) {
    const dependencies = this.createInjector()
    return fn.call(thisArg, dependencies)
  }

  new<T>(ctor: InjectableConstructor<T>): T {
    const dependencies = this.createInjector()
    return new ctor(dependencies)
  }

  clone(): Container {
    return bind(this.bindings)
  }
}

export abstract class Binding {
  abstract getInstance(resolver: Resolver): any
}

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

export function value(value: any) {
  return new ValueBinding(value)
}

export function factory(factory: InjectableFactory) {
  return new FactoryBinding(factory)
}

export function constructor(constructor: InjectableConstructor<any>) {
  return new ConstructorBinding(constructor)
}

export function singleton(binding: any) {
  return new SingletonBinding(binding)
}
