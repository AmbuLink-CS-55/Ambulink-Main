import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);

const envSchema = z.object({
  // Database
  DATABASE_URL: z.preprocess(
    emptyToUndefined,
    z.string().url("DATABASE_URL must be a valid URL")
  ),

  // Server
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  APP_STAGE: z.enum(["dev", "prod", "test"]).default("dev"),

  // Security
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters").optional(),
  JWT_EXPIRATION: z.string().default("24h"),
  AUTH_DISABLED: z.coerce.boolean().default(false),

  // Redis (optional)
  REDIS_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),

  // Frontend CORS
  FRONTEND_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
  FRONTEND_URLS: z.string().optional(),

  // Logging
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

const seedSchema = z.object({
  PROVIDER_ID: z.string().uuid("PROVIDER_ID must be a valid UUID"),
  PATIENT_ID: z.string().uuid("PATIENT_ID must be a valid UUID"),
  DRIVER_ID: z.string().uuid("DRIVER_ID must be a valid UUID"),
  DISPATCHER_ID: z.string().uuid("DISPATCHER_ID must be a valid UUID"),
});

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const flattened = parsed.error.flatten();
  const fieldErrors = Object.entries(flattened.fieldErrors)
    .map(([key, messages]) => `- ${key}: ${(messages ?? []).join(", ")}`)
    .join("\n");

  console.error(
    "❌ Invalid environment variables in apps/backend/env.ts\n" +
      "This file is imported during module startup (including tests), so validation fails early.\n" +
      "Provide required vars in your runtime/CI env before bootstrapping Nest.\n\n" +
      `${fieldErrors || JSON.stringify(parsed.error.format(), null, 2)}`
  );

  if (process.env.GITHUB_ACTIONS === "true") {
    console.error(
      "CI hint: define required vars under the job `env:` block in .github/workflows/ci.yml."
    );
  }

  throw new Error("Environment validation failed");
}

export const env: Env = parsed.data;
const parsedSeed = seedSchema.partial().parse(process.env);
export const seedEnv = parsedSeed;

const isDev = env.APP_STAGE === "dev";

if (isDev) {
  console.log("🚀 Running in development mode");
}

export default env;
