// ─────────────────────────────────────────────────────────────────────────────
// Formula Engine — a small, safe expression evaluator (no eval()) supporting the
// blueprint's function set over field values and repeating-grid rows.
// Grammar: arithmetic (+ - * /), comparisons, parens, numeric/string literals,
// field references (apiName identifiers), and function calls.
// Functions: SUM AVG MIN MAX ROUND IF COUNT LOOKUP CONCAT TEXT TODAY YEAR MONTH
// ─────────────────────────────────────────────────────────────────────────────
import type { Answers, LookupTable } from '@/data/types'

type Value = number | string | boolean

interface Ctx {
  answers: Answers
  lookups: Record<string, LookupTable>
}

// ── Tokenizer ────────────────────────────────────────────────────────────────
type Tok =
  | { t: 'num'; v: number }
  | { t: 'str'; v: string }
  | { t: 'id'; v: string }
  | { t: 'op'; v: string }
  | { t: 'punc'; v: string }

function tokenize(src: string): Tok[] {
  const toks: Tok[] = []
  let i = 0
  const isDigit = (c: string) => c >= '0' && c <= '9'
  const isIdStart = (c: string) => /[A-Za-z_]/.test(c)
  const isId = (c: string) => /[A-Za-z0-9_.]/.test(c)

  while (i < src.length) {
    const c = src[i]
    if (c === ' ' || c === '\t' || c === '\n') {
      i++
      continue
    }
    if (isDigit(c) || (c === '.' && isDigit(src[i + 1]))) {
      let n = ''
      while (i < src.length && (isDigit(src[i]) || src[i] === '.')) n += src[i++]
      toks.push({ t: 'num', v: Number(n) })
      continue
    }
    if (c === '"' || c === "'") {
      const quote = c
      let s = ''
      i++
      while (i < src.length && src[i] !== quote) s += src[i++]
      i++ // closing quote
      toks.push({ t: 'str', v: s })
      continue
    }
    if (isIdStart(c)) {
      let id = ''
      while (i < src.length && isId(src[i])) id += src[i++]
      toks.push({ t: 'id', v: id })
      continue
    }
    // multi-char operators
    const two = src.slice(i, i + 2)
    if (['>=', '<=', '==', '!='].includes(two)) {
      toks.push({ t: 'op', v: two })
      i += 2
      continue
    }
    if ('+-*/<>='.includes(c)) {
      toks.push({ t: 'op', v: c })
      i++
      continue
    }
    if ('(),'.includes(c)) {
      toks.push({ t: 'punc', v: c })
      i++
      continue
    }
    // unknown char — skip
    i++
  }
  return toks
}

// ── Parser (recursive descent) → AST evaluated inline ─────────────────────────
class Parser {
  pos = 0
  constructor(
    private toks: Tok[],
    private ctx: Ctx,
  ) {}

  peek(): Tok | undefined {
    return this.toks[this.pos]
  }
  next(): Tok | undefined {
    return this.toks[this.pos++]
  }

  parse(): Value {
    const v = this.parseComparison()
    return v
  }

  parseComparison(): Value {
    let left = this.parseAddSub()
    const p = this.peek()
    if (p && p.t === 'op' && ['>', '<', '>=', '<=', '==', '!='].includes(p.v)) {
      this.next()
      const right = this.parseAddSub()
      const a = Number(left)
      const b = Number(right)
      switch (p.v) {
        case '>':
          return a > b
        case '<':
          return a < b
        case '>=':
          return a >= b
        case '<=':
          return a <= b
        case '==':
          return String(left) === String(right)
        case '!=':
          return String(left) !== String(right)
      }
    }
    return left
  }

  parseAddSub(): Value {
    let left = this.parseMulDiv()
    while (true) {
      const p = this.peek()
      if (p && p.t === 'op' && (p.v === '+' || p.v === '-')) {
        this.next()
        const right = this.parseMulDiv()
        if (p.v === '+') {
          // numeric add when both numeric, else string concat
          if (typeof left === 'number' && typeof right === 'number') left = left + right
          else if (!isNaN(Number(left)) && !isNaN(Number(right)))
            left = Number(left) + Number(right)
          else left = String(left) + String(right)
        } else {
          left = Number(left) - Number(right)
        }
      } else break
    }
    return left
  }

  parseMulDiv(): Value {
    let left = this.parseUnary()
    while (true) {
      const p = this.peek()
      if (p && p.t === 'op' && (p.v === '*' || p.v === '/')) {
        this.next()
        const right = this.parseUnary()
        left = p.v === '*' ? Number(left) * Number(right) : Number(left) / Number(right)
      } else break
    }
    return left
  }

  parseUnary(): Value {
    const p = this.peek()
    if (p && p.t === 'op' && p.v === '-') {
      this.next()
      return -Number(this.parseUnary())
    }
    return this.parsePrimary()
  }

  parsePrimary(): Value {
    const tok = this.next()
    if (!tok) return 0
    if (tok.t === 'num') return tok.v
    if (tok.t === 'str') return tok.v
    if (tok.t === 'punc' && tok.v === '(') {
      const v = this.parseComparison()
      if (this.peek()?.v === ')') this.next()
      return v
    }
    if (tok.t === 'id') {
      // function call?
      if (this.peek()?.t === 'punc' && this.peek()?.v === '(') {
        this.next() // (
        const args: Value[] = []
        const rawArgs: string[] = []
        if (!(this.peek()?.t === 'punc' && this.peek()?.v === ')')) {
          do {
            const start = this.pos
            args.push(this.parseComparison())
            rawArgs.push(this.toks.slice(start, this.pos).map((t) => t.v).join(''))
          } while (this.peek()?.t === 'punc' && this.peek()?.v === ',' && this.next())
        }
        if (this.peek()?.v === ')') this.next()
        return this.callFn(tok.v.toUpperCase(), args, rawArgs)
      }
      // identifier → field reference / boolean / keyword
      const up = tok.v.toUpperCase()
      if (up === 'TRUE') return true
      if (up === 'FALSE') return false
      return this.resolveRef(tok.v)
    }
    return 0
  }

  /** Resolve a bare identifier to an answer value (number when possible). */
  resolveRef(name: string): Value {
    const raw = this.ctx.answers[name]
    if (raw === undefined || raw === null) return 0
    if (Array.isArray(raw)) return raw.length
    if (typeof raw === 'boolean') return raw
    const n = Number(raw)
    return isNaN(n) ? String(raw) : n
  }

  callFn(name: string, args: Value[], rawArgs: string[]): Value {
    const nums = args.map((a) => Number(a)).filter((n) => !isNaN(n))
    switch (name) {
      case 'SUM':
        return nums.reduce((a, b) => a + b, 0)
      case 'AVG':
        return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0
      case 'MIN':
        return nums.length ? Math.min(...nums) : 0
      case 'MAX':
        return nums.length ? Math.max(...nums) : 0
      case 'ROUND': {
        const d = args[1] !== undefined ? Number(args[1]) : 0
        const f = 10 ** d
        return Math.round(Number(args[0]) * f) / f
      }
      case 'IF':
        return args[0] ? args[1] : args[2]
      case 'COUNT': {
        // COUNT(gridField) → number of rows. COUNT(singleRef) → 0/1 by emptiness.
        const ref = rawArgs[0]
        const raw = this.ctx.answers[ref]
        if (Array.isArray(raw)) return raw.length
        if (rawArgs.length === 1) return raw === undefined || raw === '' || raw === null ? 0 : 1
        return args.filter((a) => a !== '' && a !== undefined && a !== 0).length
      }
      case 'CONCAT':
        return args.map((a) => String(a)).join('')
      case 'TEXT':
        return String(args[0] ?? '')
      case 'LOOKUP': {
        // LOOKUP(tableId, key, column)
        const table = this.ctx.lookups[String(args[0])]
        if (!table) return ''
        const key = String(args[1])
        const col = String(args[2])
        const row = table.rows.find((r) => Object.values(r).includes(key))
        return row ? (row[col] ?? '') : ''
      }
      case 'TODAY':
        return ''
      case 'YEAR':
        return Number(String(args[0]).slice(0, 4)) || 0
      case 'MONTH':
        return Number(String(args[0]).slice(5, 7)) || 0
      default:
        return 0
    }
  }
}

export function evaluateFormula(
  expr: string,
  answers: Answers,
  lookups: Record<string, LookupTable> = {},
): Value {
  if (!expr) return ''
  try {
    const toks = tokenize(expr)
    return new Parser(toks, { answers, lookups }).parse()
  } catch {
    return ''
  }
}
