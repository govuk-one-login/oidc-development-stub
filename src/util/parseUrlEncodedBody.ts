import type { IncomingMessage } from "node:http";

export const parseUrlEncodedBody = async (
  req: IncomingMessage
): Promise<URLSearchParams> => {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });
    req.on("end", () => {
      resolve(new URLSearchParams(Buffer.concat(chunks).toString()));
    });
    req.on("error", reject);
  });
};
