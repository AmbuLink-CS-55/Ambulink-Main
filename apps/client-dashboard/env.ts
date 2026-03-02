import { z } from "zod";

const envSchema = z.object({
  VITE_API_SERVER_URL: z
    .string()
    .url("VITE_API_SERVER_URL must be a valid URL")
    .default("http://localhost:3000/api"),
  VITE_WS_SERVER_URL: z
    .string()
    .url("VITE_WS_SERVER_URL must be a valid URL")
    .default("ws://localhost:3000"),
  VITE_DISPATCHER_ID: z
    .union([z.string().uuid("VITE_DISPATCHER_ID must be a valid UUID"), z.literal("")])
    .optional()
    .transform((value) => (value ? value : undefined)),
  VITE_PROVIDER_ID: z
    .union([z.string().uuid("VITE_PROVIDER_ID must be a valid UUID"), z.literal("")])
    .optional()
    .transform((value) => (value ? value : undefined)),
});

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(import.meta.env);

if (!parsed.success) {
  console.error(
    "❌ Invalid environment variables:",
    JSON.stringify(parsed.error.format(), null, 2)
  );
  throw new Error("Invalid environment variables. Check browser console.");
}

export const env: Env = parsed.data;

export default env;
