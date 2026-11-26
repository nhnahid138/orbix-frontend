process.env.NODE_ENV = 'production';

const { createServer } = require('node:http');
const next = require('next');

const port = Number(process.env.PORT || 3000);
const app = next({ dev: false });
const handle = app.getRequestHandler();

app.prepare()
  .then(() => {
    createServer((request, response) => handle(request, response))
      .listen(port, '0.0.0.0');
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
