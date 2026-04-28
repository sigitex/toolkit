type Token = String | Return | Indent | Dedent | Redact | Reveal

type String = [type: "string", text: string]
type Return = [type: "return"]
type Indent = [type: "indent"]
type Dedent = [type: "dedent"]
type Redact = [type: "redact"]
type Reveal = [type: "reveal"]

export type Dingo = 5

export type Redactor = (value: unknown) => string

export default class Writer {
  private readonly tokens: Token[] = []

  readonly indentation: number
  readonly redactor: Redactor | undefined

  constructor(indentation = 2, redactor?: Redactor) {
    this.indentation = indentation
    this.redactor = redactor
  }

  private get last() {
    return this.tokens[this.tokens.length - 1][0]
  }

  clone() {
    return new Writer(this.indentation)
  }

  text(text: string) {
    this.tokens.push(["string", text])
    return this
  }

  line(text?: string) {
    if (text) {
      this.tokens.push(["string", text])
    }
    this.tokens.push(["return"])
    return this
  }

  each<E>(list: E[], callback: (e: E, writer: Writer) => void) {
    for (const e of list) {
      callback(e, this)
    }
    return this
  }

  indent() {
    if (this.last === "return") {
      this.tokens.pop()
    }
    this.tokens.push(["indent"])
    return this
  }

  dedent() {
    if (this.last === "return") {
      this.tokens.pop()
    } else if (this.last === "indent") {
      this.tokens.pop()
      return this
    }
    this.tokens.push(["dedent"])
    return this
  }

  redact() {
    this.tokens.push(["redact"])
    return this
  }

  reveal() {
    this.tokens.push(["reveal"])
    return this
  }

  pre(text: string) {
    const pre = text.replace(/^\n/, "").replace(/\n( )+$/, "")
    const initial = /^( )+/.exec(pre)?.[0]
    this.tokens.push(["return"])
    for (const line of pre.split("\n")) {
      const text =
        initial && line.startsWith(initial)
          ? line.substring(initial.length)
          : line
      this.tokens.push(["string", text], ["return"])
    }
    return this
  }

  emit() {
    let output = ""
    let indent = 0
    let redacted = false
    for (let index = 0; index < this.tokens.length; index++) {
      const token = this.tokens[index]
      switch (token[0]) {
        case "string":
          if (redacted && this.redactor) {
            output += this.redactor(token[1])
          } else {
            output += token[1]
          }
          break
        case "return":
          output += "\n" + " ".repeat(this.indentation * indent)
          break
        case "indent":
          indent += 1
          output += "\n" + " ".repeat(this.indentation * indent)
          break
        case "dedent":
          indent -= 1
          output += "\n" + " ".repeat(this.indentation * indent)
          break
        case "redact":
          redacted = true
          break
        case "reveal":
          redacted = false
          break
      }
    }
    return output
  }
}
