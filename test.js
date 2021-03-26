const http = require('http')

let server = http.createServer((res, req) => {
  console.log(res.url)
}).listen(8088, () => {
  console.log('listen sucess on 8088')
})