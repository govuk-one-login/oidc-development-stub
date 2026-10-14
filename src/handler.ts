import { createApp } from "./app.js";

const app = await createApp();

// AWS_LAMBDA_HTTP_ENDPOINT is set by the execution env
// if not set we can use localhost on port 3002
const [host, port] = (
  process.env.AWS_LAMBDA_HTTP_ENDPOINT || "127.0.0.1:3002"
).split(":");

app.listen(Number(port), host, () => {
  console.log(`Server is running at http://${host}:${port}`);
});
