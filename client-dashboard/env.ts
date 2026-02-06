import { z } from "zod";
import dotenv from "dotenv";

const envSchema = z.object({
  VITE_API_SERVER_URL: z.url(),
  VITE_WS_SERVER_URL: z.url(),
  VITE_DISPATCHER_ID: z.uuid(),
});

const parsed = envSchema.safeParse(import.meta.env);

if (!parsed.success) {
  console.error("Invalid .env", JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

const env = parsed.data;

export default env;
