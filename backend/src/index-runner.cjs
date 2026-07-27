const { prisma } = require('./lib/prisma');
const appModule = require('./app');
const app = appModule.default ?? appModule;

const port = Number(process.env.PORT ?? 5000);

async function startServer() {
  try {
    await prisma.$connect();

    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
}

void startServer();
