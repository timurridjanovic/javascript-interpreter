'use strict';

const isDigit = char => {
	return char.match(/[0-9]/)
}

const isAlpha = char => {
	return char.match(/[a-z_$]/i)
}

const isAlphaNum = char => {
	return char.match(/^[a-z_$0-9]$/i)
}

const isWhiteSpace = char => {
	return char.match(/\s/)
}

const isNewLine = char => {
	return char === '\n'
}

const isOperator = char => {
	return char === '+' || char === '-' || char === '=' ||
		char === '>' || char === '<' || char === '&' ||
		char === '|' || char === '!' || char === '*' ||
		char === '/' || char === '%'
}

const isSquareBracket = char => {
	return char === '[' || char === ']'
}

const isComma = char => {
	return char === ','
}

const isColon = char => {
	return char === ':'
}

const isDot = char => {
	return char === '.'
}

const isSemiColon = char => {
	return char === ';'
}

const isDoubleQuote = char => {
	return char === '"'
}

const isSingleQuote = char => {
	return char === '\''
}

const isParen = char => {
	return char === ')' || char === '('
}

const isCurlyBracket = char => {
	return char === '{' || char === '}'
}

const accumulator = (obj, char, next) => {
	return Object.assign(obj, { acc: obj.acc + char, next })
}

const addToken = (obj, char, type) => {
	const token = { value: obj.acc + char, type }
	if (token.type === 'operator') {
		token.associativity = 'left'
		if (token.value === '+' || token.value === '-') {
			token.precedence = 2
		} else if (token.value === '*' || token.value === '/') {
			token.precedence = 3
		} else {
			token.precedence = 2
		}
	}
	return { tokens: obj.tokens.concat(token), acc: '' }
}

const handleComment = (char, nextChar, obj) => {
	if (char === '\n') {
		return accumulator(obj, '')
	}

	return accumulator(obj, '', handleComment)
}

const handleComma = (char, nextChar, obj) => {
	return addToken(obj, char, 'comma')
}

const handleColon = (char, nextChar, obj) => {
	return addToken(obj, char, 'colon')
}

const handleDot = (char, nextChar, obj) => {
	return addToken(obj, char, 'dot')
}

const handleSemicolon = (char, nextChar, obj) => {
	return addToken(obj, char, 'semicolon')
}

const handleQuote = (isQuote, char, nextChar, obj) => {
	if (isQuote(char)) {
		if (obj.acc) {
			return addToken(obj, '', 'string')
		}

		return accumulator(obj, '', handleQuote.bind(null, isQuote))
	}

	return accumulator(obj, char, handleQuote.bind(null, isQuote))
}

const handleDigit = (char, nextChar, obj) => {
	if (!isDigit(nextChar) && nextChar !== '.') {
		return addToken(obj, char, 'number')
	}

	if (nextChar === '.') {
		return accumulator(obj, char, handleDigit)
	}

	return accumulator(obj, char)
}

const handleEqual = (char, nextChar, obj) => {
	if (obj.acc + char === '====') {
		throw new Error('SyntaxError: Unexpected token =')
	}

	if (nextChar !== '=') {
		return addToken(obj, char, 'operator')
	}

	return accumulator(obj, char)
}

const handleFrontSlash = (char, nextChar, obj) => {
	if (nextChar !== '/') {
		return addToken(obj, char, 'operator')
	} else {
		return handleComment(char, nextChar, obj)
	}
}

const handleAngles = (char, nextChar, obj) => {
	if (nextChar !== '=') {
		return addToken(obj, char, 'operator')
	}

	return accumulator(obj, char, handleAngles)
}

const handleAndOr = (char, nextChar, obj) => {
	if (nextChar !== '&' && nextChar !== '|') {
		return addToken(obj, char, 'operator')
	}

	return accumulator(obj, char, handleAndOr)
}

const handleMinus = (char, nextChar, obj) => {
	if (obj.acc + char === '---') {
		throw new Error('SyntaxError: Unexpected token -')
	}

	if (nextChar !== '-') {
		return addToken(obj, char, 'operator')
	}

	return accumulator(obj, char)
}

const handlePlus = (char, nextChar, obj) => {
	if (obj.acc + char === '+++') {
		throw new Error('SyntaxError: Unexpected token +')
	}

	if (nextChar !== '+') {
		return addToken(obj, char, 'operator')
	}

	return accumulator(obj, char)
}

const handleMultiply = (char, nextChar, obj) => {
	if (obj.acc + char === '***') {
		throw new Error('SyntaxError: Unexpected token *')
	}

	if (nextChar !== '*') {
		return addToken(obj, char, 'operator')
	}

	return accumulator(obj, char)
}

const handleSquareBracket = (char, nextChar, obj) => {
	if (char === '[') {
		return addToken(obj, char, 'lsquare_bracket')
	}

	return addToken(obj, char, 'rsquare_bracket')
}

const handleCurlyBracket = (char, nextChar, obj) => {
	if (char === '{') {
		return addToken(obj, char, 'lcurly_bracket')
	}

	return addToken(obj, char, 'rcurly_bracket')
}

const handleParen = (char, nextChar, obj) => {
	if (char === '(') {
		return addToken(obj, char, 'lparen')
	}

	return addToken(obj, char, 'rparen')
}

const handleOperator = (char, nextChar, obj) => {
	if (char === '+') {
		return handlePlus(char, nextChar, obj)
	} else if (char === '-') {
		return handleMinus(char, nextChar, obj)
	} else if (char === '*') {
		return handleMultiply(char, nextChar, obj)
	} else if (char === '/') {
		return handleFrontSlash(char, nextChar, obj)
	} else if (char === '%') {
		return handleModulo(char, nextChar, obj)
	} else if (char === '=') {
		return handleEqual(char, nextChar, obj)
	} else if (char === '&' || char === '|') {
		return handleAndOr(char, nextChar, obj)
	} else if (char === '>' || char === '<') {
		return handleAngles(char, nextChar, obj)
	} else {
		return handleNot(char, nextChar, obj)
	}
}

const handleAlpha = (char, nextChar, obj) => {
	const acc = obj.acc + char
	if (!isAlphaNum(nextChar)) {
		if (acc === 'var') {
			return addToken(obj, char, 'var')
		} else if (acc === 'function') {
			return addToken(obj, char, 'function')
		} else if (acc === 'return') {
			return addToken(obj, char, 'return')
		} else if (acc === 'if') {
			return addToken(obj, char, 'if')
		} else if (acc === 'else') {
			return addToken(obj, char, 'else')
		} else if (acc === 'for') {
			return addToken(obj, char, 'for')
		} else if (acc === 'while') {
			return addToken(obj, char, 'while')
		} else if (acc === 'true' || obj.acc === 'false') {
			return addToken(obj, char, 'boolean')
		} else {
			return addToken(obj, char, 'id')
		}
	}

	return accumulator(obj, char, handleAlpha)
}

const handleChar = (char, nextChar, obj) => {
	if (isDigit(char)) {
		return handleDigit(char, nextChar, obj)
	} else if (isAlpha(char)) {
		return handleAlpha(char, nextChar, obj)
	} else if (isWhiteSpace(char)) {
		return obj
	} else if (isOperator(char)) {
		return handleOperator(char, nextChar, obj)
	} else if (isSemiColon(char)) {
		return handleSemicolon(char, nextChar, obj)
	} else if (isDoubleQuote(char)) {
		return handleQuote(isDoubleQuote, char, nextChar, obj)
	} else if (isSingleQuote(char)) {
		return handleQuote(isSingleQuote, char, nextChar, obj)
	} else if (isParen(char)) {
		return handleParen(char, nextChar, obj)
	} else if (isCurlyBracket(char)) {
		return handleCurlyBracket(char, nextChar, obj)
	} else if (isSquareBracket(char)) {
		return handleSquareBracket(char, nextChar, obj)
	} else if (isComma(char)) {
		return handleComma(char, nextChar, obj)
	} else if (isColon(char)) {
		return handleColon(char, nextChar, obj)
	} else if (isDot(char)) {
		return handleDot(char, nextChar, obj)
	} else {
		throw new Error('Syntax Error')
	}
}

const tokenizer = code => {
	const codeArr = code.split('').concat('EOF')
	const result = codeArr.reduce((obj, char, i) => {
		if (char === 'EOF') return obj
		const nextChar = codeArr[i + 1]
		if (obj.next) return obj.next(char, nextChar, obj)
		return handleChar(char, nextChar, obj)
	}, { tokens: [], acc: '' })

	return result.tokens
}

module.exports = tokenizer
