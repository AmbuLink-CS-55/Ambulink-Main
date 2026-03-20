import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),

  // Server
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  APP_STAGE: z.enum(["dev", "prod", "test"]).default("dev"),

  // Security
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters").optional(),
  JWT_EXPIRATION: z.string().default("24h"),
  AUTH_DISABLED: z.coerce.boolean().default(false),

  // Redis (optional)
  REDIS_URL: z.string().url().optional(),

  // Frontend CORS
  FRONTEND_URL: z.string().url().optional(),
  FRONTEND_URLS: z.string().optional(),

  // Logging
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),

  // Booking media uploads
  BOOKING_MEDIA_ROOT: z.string().optional(),
  BOOKING_UPLOAD_SESSION_TTL_HOURS: z.coerce.number().int().positive().default(24),
});

const seedSchema = z.object({
  PROVIDER_ID: z.string().uuid("PROVIDER_ID must be a valid UUID"),
  PATIENT_ID: z.string().uuid("PATIENT_ID must be a valid UUID"),
  DRIVER_ID: z.string().uuid("DRIVER_ID must be a valid UUID"),
  DISPATCHER_ID: z.string().uuid("DISPATCHER_ID must be a valid UUID"),
});

export type Env = z.infer<typeof envSchema>;

const envSource: NodeJS.ProcessEnv = { ...process.env };

// Unit tests in CI should not require real database credentials.
if (envSource.NODE_ENV === "test" && !envSource.DATABASE_URL) {
  envSource.DATABASE_URL = "postgres://localhost:5432/ambulink_test";
}

const parsed = envSchema.safeParse(envSource);

if (!parsed.success) {
  const missingKeys = Array.from(
    new Set(
      parsed.error.issues
        .filter(
          (issue) =>
            issue.code === "invalid_type" &&
            "received" in issue &&
            issue.received === "undefined"
        )
        .map((issue) => issue.path.join("."))
        .filter(Boolean)
    )
  );

  if (missingKeys.length > 0) {
    console.error(`Missing required environment variables: ${missingKeys.join(", ")}`);
  }

  const nonMissingIssues = parsed.error.issues.filter(
    (issue) =>
      !(
        issue.code === "invalid_type" &&
        "received" in issue &&
        issue.received === "undefined"
      )
  );

  if (nonMissingIssues.length > 0) {
    console.error("Invalid environment variables:");
    for (const issue of nonMissingIssues) {
      const key = issue.path.join(".") || "(root)";
      console.error(`- ${key}: ${issue.message}`);
    }
  }

  if (missingKeys.length === 0 && nonMissingIssues.length === 0) {
    console.error("Invalid environment variables.");
  }

  process.exit(1);
}

export const env: Env = parsed.data;
const parsedSeed = seedSchema.partial().parse(process.env);
export const seedEnv = parsedSeed;

const isDev = env.APP_STAGE === "dev";

if (isDev) {
  console.log("Running in development mode");
}

export default env;
