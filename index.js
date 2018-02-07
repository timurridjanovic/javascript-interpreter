const tokenizer = require('./tokenizer')
const parser = require('./parser')

const js = `
function add(a, b) {
  return a + b;
}

add(100, 10)
`

const ast = parser(tokenizer(js))
console.log('AST: ', JSON.stringify(ast, null, 2))

