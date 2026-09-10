/**
 * Vercel serverless entry.
 *
 * Reuses the same Express app as local development, so the API surface and
 * its rate limiting and input sanitisation cannot drift between the two.
 * server.ts skips binding a port when process.env.VERCEL is set.
 */
import { app } from "../server.ts";

export default app;
