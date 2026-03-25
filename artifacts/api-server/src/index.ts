import app from "./app";
import { ensureTables } from "@workspace/db/migrate";
import { initBridgeWebSocket } from "./routes/bridge";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

async function start() {
  await ensureTables();
  const server = app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
  initBridgeWebSocket(server);
}

start().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
