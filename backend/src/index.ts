import app from "./app";
import { prisma } from "./lib/prisma";

const port = Number(process.env.PORT ?? 3000);

async function startServer() {
  try {
    await prisma.$connect();

    app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
}

void startServer();