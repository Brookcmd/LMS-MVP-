import app from "./app";
import { prisma } from "./lib/prisma";

const port = Number(process.env.PORT ?? 5000);

async function startServer() {
  try {
    await prisma.$connect();

    const server = app.listen(port, () => {
      console.log(`Server listening on port ${port}`);
    });

    server.on("error", (error: any) => {
      if (error.code === "EADDRINUSE") {
        console.error(`Port ${port} is already in use. The backend server is ALREADY running on port ${port}.`);
      } else {
        console.error("Server error:", error);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
}

void startServer();