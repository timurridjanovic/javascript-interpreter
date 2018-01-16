const tokenizer = require('./tokenizer')
const parser = require('./parser')

const js = `
  var books = [
    {
      author: 'timur',
      price: 100
    },
    {
      author: 'ogden',
      price: 100
    }
  ]

  var newBooks = books.map(function(book) {
    return {
      author: book.author
    }
  })
`

const ast = parser(tokenizer(js))
console.log('AST: ', JSON.stringify(ast, null, 2))
