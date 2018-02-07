'use strict'

class Iter {
  init (tokens) {
    this.tokens = tokens.concat('EOF')
    this.i = -1
    this.maxLength = tokens.length - 1
  }

  next () {
    if (this.i < this.maxLength) {
      this.i += 1
      return this.tokens[this.i]
    }
    return 'EOF'
  }

  get () {
    return this.tokens[this.i]
  }

  peek (i = 0) {
    return this.tokens[this.i + (1 + i)]
  }
}

const tokens = new Iter()

const isId = token => {
  return token.type === 'id'
}

const isNumber = token => {
  return token.type === 'number'
}

const isString = token => {
  return token.type === 'string'
}

const isOperator = token => {
  return token.type === 'operator'
}

const isEqual = token => {
  return token.value === '='
}

const isDot = token => {
  return token.type === 'dot'
}

const isComma = token => {
  return token.type === 'comma'
}

const isSemiColon = token => {
  return token.type === 'semicolon'
}

const isLCurlyBracket = token => {
  return token.type === 'lcurly_bracket'
}

const isRCurlyBracket = token => {
  return token.type === 'rcurly_bracket'
}

const isNot = token => {
  return token.type === 'operator' &&  token.value === '!'
}

const isFunction = token => {
  return token.type === 'function'
}

const isBoolean = token => {
  return token.type === 'boolean'
}

const isFor = token => {
  return token.type === 'for'
}

const isIf = token => {
  return token.type === 'if'
}

const isElse = token => {
  return token.type === 'else'
}

const isReturn = token => {
  return token.type === 'return'
}

const isVar = token => {
  return token.type === 'var'
}

const isLParen = token => {
  return token.type === 'lparen'
}

const isRParen = token => {
  return token.type === 'rparen'
}

const isLSquareBracket = token => {
  return token.type === 'lsquare_bracket'
}

const isRSquareBracket = token => {
  return token.type === 'rsquare_bracket'
}

const isStatement = token => {
  if (token === 'EOF' || isRCurlyBracket(token)) {
    return false
  }

  return true
}

const isMathExpression = (token, parenStack) => {
  if ((!isRParen(token) && !isSemiColon(token) &&
    !isFunction(token) && !isComma(token) &&
    !isRCurlyBracket(token) && !isVar(token) &&
    (!isId(token) || !isEqual(tokens.peek(1))) &&
    !isIf(token) && token !== 'EOF') || parenStack.length > 0) {
    return true
  }

  return false
}

const consume = (expectedType, expectedValue) => {
  const token = tokens.next()
  if (token.type === expectedType || expectedType === 'any') {
    if (expectedValue && token.value !== expectedValue) {
      throw new Error(`Expected token value ${expectedValue} but got ${token.value}`)
    }

    return token
  }

  throw new Error(`Expected token type ${expectedType} but got ${token.type}`)
}

const objectNode = (object, property) => {
  return {
    type: 'Object',
    object: object.value,
    property: property
  }
}

const callNode = (token, args) => {
  return {
    type: 'call',
    name: token.value,
    args
  }
}

const numberNode = token => {
  return token
}

const stringNode = token => {
  return token
}

const variableNode = token => {
  return token
}

const functionNode = (name, argNames, body) => {
  return { type: 'function', name, argNames, body }
}

const returnExpressionNode = expression => {
  return { type: 'return', expression }
}

const forNode = (expressions, body) => {
  return { type: 'for', expressions, body }
}

const ifElseNode = (condition, body, elseIf, elseBody) => {
  const expression = { type: 'if', condition, body }
  if (elseIf.length > 0) {
    expression.elseIf = elseIf
  }

  if (elseBody) {
    expression.elseBody = elseBody
  }

  return expression
}

const varAssignmentNode = (name, expression, isGlobal) => {
  if (isGlobal) {
    return { type: 'assignment', var: name, expression, isGlobal }
  }

  return { type: 'assignment', var: name, expression }
}

const arrayNode = elements => {
  return { type: 'array', elements }
}

const notNode = expression => {
  return { type: 'not', expression }
}

const objectLiteralNode = dict => {
  return { type: 'dict', dict }
}

const parseBoolean = () => {
  const value = consume('boolean').value
  return { type: 'boolean', value }
}

const parseArgNames = () => {
  const argNames = []
  consume('lparen')
  if (isId(tokens.peek())) {
    argNames.push(consume('id').value)
    while (isComma(tokens.peek())) {
      consume('comma')
      argNames.push(consume('id').value)
    }
  }
  consume('rparen')
  return argNames
}

const parseFunction = () => {
  consume('function')
  let name = 'lambda'
  if (isId(tokens.peek())) {
    name = consume('id').value
  }
  const argNames = parseArgNames()
  consume('lcurly_bracket')
  const body = parseStatements()
  consume('rcurly_bracket')
  return functionNode(name, argNames, body)
}

const parseVariable = () => {
  const token = consume('id')
  return variableNode(token)
}

const parseNumber = () => {
  const token = consume('number')
  return numberNode(token)
}

const parseString = () => {
  const token = consume('string')
  return stringNode(token)
}

const parseMathExpression = (node) => {
  const createExpression = (operator, args) => {
    return Object.assign(operator, { args })
  }

  const expressionStack = []
  const operatorStack = []
  const parenStack = []

  if (node) {
    expressionStack.push(node)
  }

  while (isMathExpression(tokens.peek(), parenStack)) {
    if (isId(tokens.peek())) {
      if (isOperator(tokens.peek(1))) {
        expressionStack.push(parseVariable())
      } else {
        expressionStack.push(parseExpression())
      }
    } else if (isLSquareBracket(tokens.peek())) {
      expressionStack.push(parseArray())
    } else if (isLCurlyBracket(tokens.peek())) {
      expressionStack.push(parseObjectLiteral())
    } else {
      const token = consume('any')
      if (token.type === 'number' || token.type === 'string' || token.type === 'boolean') {
        expressionStack.push(token)
      } else if (token.type === 'operator') {
        let stackTop = operatorStack[operatorStack.length - 1]
        while (
          stackTop &&
          ((stackTop.precedence > token.precedence) ||
          (stackTop.precedence === token.precedence && token.associativity === 'left')) &&
          token.value !== '('
        ) {
          const operator = operatorStack.pop()
          const right = expressionStack.pop()
          const left = expressionStack.pop()
          expressionStack.push(createExpression(operator, [left, right]))
          stackTop = operatorStack[operatorStack.length - 1]
        }

        operatorStack.push(token)
      } else if (token.value === '(') {
        operatorStack.push(token)
        parenStack.push('(')
      } else if (token.value === ')') {
        parenStack.pop()
        let stackTop = operatorStack[operatorStack.length - 1]
        while (stackTop && stackTop.value !== '(') {
          const operator = operatorStack.pop()
          const right = expressionStack.pop()
          const left = expressionStack.pop()
          expressionStack.push(createExpression(operator, [left, right]))
          stackTop = operatorStack[operatorStack.length - 1]
        }

        operatorStack.pop()
      } else {
        throw new Error(`SyntaxError: unexpected token ${token.value}`)
      }
    }
  }

  while (operatorStack.length > 0) {
    const operator = operatorStack.pop()
    const right = expressionStack.pop()
    const left = expressionStack.pop()
    expressionStack.push(createExpression(operator, [left, right]))
  }

  return expressionStack.pop()
}

const parseReturnExpression = () => {
  consume('return')
  if (isSemiColon(tokens.peek())) {
    consume('semicolon')
  }

  if (isRCurlyBracket(tokens.peek())) {
    return returnExpressionNode()
  }

  const expression = parseExpression()
  if (isSemiColon(tokens.peek())) {
    consume('semicolon')
  }
  return returnExpressionNode(expression)
}

const parseFor = () => {
  consume('for')
  consume('lparen')
  let expressions = []
  expressions.push(parseVarAssignment())
  expressions.push(parseExpression())
  if (isSemiColon(tokens.peek())) {
    consume('semicolon')
  }
  expressions.push(parseExpression())
  consume('rparen')
  consume('lcurly_bracket')
  const body = parseStatements()
  return forNode(expressions, body)
}

const parseIfElse = () => {
  consume('if')
  consume('lparen')
  const condition = parseExpression()
  consume('rparen')
  consume('lcurly_bracket')
  const body = parseStatements()
  consume('rcurly_bracket')
  const elseIf = []
  while (isElse(tokens.peek()) && isIf(tokens.peek(1))) {
    consume('else')
    const elseIfExpression = parseIfElse()
    elseIf.push(elseIfExpression)
  }

  let elseBody
  if (isElse(tokens.peek())) {
    consume('else')
    consume('lcurly_bracket')
    elseBody = parseStatements()
    consume('rcurly_bracket')
  }

  return ifElseNode(condition, body, elseIf, elseBody)
}

const parseVarAssignment = (options = { isGlobal: false }) => {
  const { isGlobal } = options
  if (!isGlobal) {
    consume('var')
  }
  const name = consume('id').value
  consume('operator', '=')
  const expression = parseExpression()
  if (isSemiColon(tokens.peek())) {
    consume('semicolon')
  }

  return varAssignmentNode(name, expression, isGlobal)
}

const parseExpression = () => {
  if (isBoolean(tokens.peek())) {
    return parseBoolean()
  }

  if (isFunction(tokens.peek())) {
    return parseFunction()
  }

  if (isReturn(tokens.peek())) {
    return parseReturnExpression()
  }

  if (isId(tokens.peek()) && isDot(tokens.peek(1))) {
    const object = parseObject()
    if (isOperator(tokens.peek())) {
      return parseMathExpression(object)
    }
    return object
  }

  if (isId(tokens.peek()) && isLParen(tokens.peek(1))) {
    const call = parseCall()
    if (isOperator(tokens.peek())) {
      return parseMathExpression(call)
    }
    return call
  }

  if (isId(tokens.peek()) && isOperator(tokens.peek(1))) {
    return parseMathExpression()
  }

  if (isId(tokens.peek())) {
    return parseVariable()
  }

  if (isNumber(tokens.peek()) && isOperator(tokens.peek(1))) {
    return parseMathExpression()
  }

  if (isNumber(tokens.peek())) {
    if (isId(tokens.peek(1))) {
      throw new Error(`SyntaxError: Unexpected token ${tokens.peek(1).value}`)
    }

    return parseNumber()
  }

  if (isString(tokens.peek()) && isOperator(tokens.peek(1))) {
    if (isEqual(tokens.peek(1))) {
      throw new Error('Uncaught ReferenceError: Invalid left-hand side in assignment')
    }

    return parseMathExpression()
  }

  if (isString(tokens.peek())) {
    return parseString()
  }

  if (isLParen(tokens.peek())) {
    return parseMathExpression()
  }

  if (isLSquareBracket(tokens.peek())) {
    const array = parseArray()
    if (isOperator(tokens.peek())) {
      return parseMathExpression(array)
    }
  }

  if (isLCurlyBracket(tokens.peek())) {
    return parseObjectLiteral()
  }

  if (isNot(tokens.peek())) {
    const expression = parseNotExpression()
    if (isOperator(tokens.peek())) {
      return parseMathExpression(expression)
    }
  }
  console.log('TOKEN: ', tokens.peek())
  throw new Error(`SyntaxError: Unexpected token ${tokens.peek().value}`)
}

const parseArgsExpressions = () => {
  const argsExpressions = []
  consume('lparen')
  if (!isRParen(tokens.peek())) {
    argsExpressions.push(parseExpression())
    while (isComma(tokens.peek())) {
      consume('comma')
      argsExpressions.push(parseExpression())
    }
  }

  consume('rparen')

  return argsExpressions
}

const parseArray = () => {
  const elements = []
  consume('lsquare_bracket')
  if (!isRSquareBracket(tokens.peek())) {
    elements.push(parseExpression())
    while (isComma(tokens.peek())) {
      consume('comma')
      elements.push(parseExpression())
    }
  }

  consume('rsquare_bracket')
  return arrayNode(elements)
}

const parseNotExpression = () => {
  consume('operator')
  if (isId(tokens.peek()) && isDot(tokens.peek(1))) {
    const object = parseObject()
    return notNode(object)
  } else if (isId(tokens.peek()) && isLParen(tokens.peek(1))) {
    const call = parseCall()
    return notNode(call)
  } else if (isLParen(tokens.peek())) {
    consume('lparen')
    const expression = parseMathExpression()
    consume('rparen')
    return notNode(expression)
  } else if (isId(tokens.peek())) {
    return notNode(parseVariable())
  } else if (isNumber(tokens.peek())) {
    return notNode(parseNumber())
  } else if (isBoolean(tokens.peek())) {
    return notNode(parseBoolean())
  } else if (isString(tokens.peek())) {
    return notNode(parseString())
  } else if (isLSquareBracket(tokens.peek())) {
    return notNode(parseArray())
  } else if (isLCurlyBracket(tokens.peek())) {
    return notNode(parseObjectLiteral())
  }
}

const parseObjectLiteral = () => {
  const dict = {}
  const parseKeyValuePair = () => {
    let keyName
    if (isString(tokens.peek())) {
      keyName = consume('string').value
    } else if (isId(tokens.peek())) {
      keyName = consume('id').value
    } else {
      throw new Error(`SyntaxError: Unexpected token type ${tokens.peek().value}`)
    }

    consume('colon')
    const value = parseExpression()
    dict[keyName] = value
  }

  consume('lcurly_bracket')
  if (!isRCurlyBracket(tokens.peek())) {
    parseKeyValuePair()
    while (isComma(tokens.peek())) {
      consume('comma')
      if (isRCurlyBracket(tokens.peek())) {
        break
      }

      parseKeyValuePair()
    }
  }

  consume('rcurly_bracket')

  return objectLiteralNode(dict)
}

const parseCall = () => {
  const token = consume('id')
  const args = parseArgsExpressions()
  return callNode(token, args)
}

const parseObject = () => {
  const object = consume('id')
  consume('dot')
  if (isId(tokens.peek())) {
    if (isLParen(tokens.peek(1))) {
      return objectNode(object, parseCall())
    }

    if (isDot(tokens.peek(1))) {
      return objectNode(object, parseObject())
    }

    const property = consume('id')
    return objectNode(object, property)
  }
}

const parseStatements = () => {
  const statements = []
  while (isStatement(tokens.peek())) {
    if (isFunction(tokens.peek())) {
      statements.push(parseFunction())
    } else if (isVar(tokens.peek())) {
      statements.push(parseVarAssignment())
    } else if (isId(tokens.peek()) && isEqual(tokens.peek(1))) {
      statements.push(parseVarAssignment({ isGlobal: true }))
    } else if (isIf(tokens.peek())) {
      statements.push(parseIfElse())
    } else if (isFor(tokens.peek())) {
      statements.push(parseFor())
    } else if (tokens.peek()) {
      statements.push(parseExpression())
      if (isSemiColon(tokens.peek())) {
        consume('semicolon')
      }
    }
  }

  return statements
}

const parser = tokenList => {
  tokens.init(tokenList)
  return parseStatements()
}

module.exports = parser
