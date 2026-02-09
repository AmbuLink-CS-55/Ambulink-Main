import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),

  // Server
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  APP_STAGE: z.enum(['dev', 'prod', 'test']).default('dev'),

  // Security
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters').optional(),
  JWT_EXPIRATION: z.string().default('24h'),

  // Redis (optional)
  REDIS_URL: z.string().url().optional(),

  // Frontend CORS
  FRONTEND_URL: z.string().url().optional(),

  // Logging
  LOG_LEVEL: z
    .enum(['debug', 'info', 'warn', 'error'])
    .default('info'),

  // Test seeds
  PATIENT_ID: z.string().uuid('PATIENT_ID must be a valid UUID'),
  DRIVER_ID: z.string().uuid('DRIVER_ID must be a valid UUID'),
  EMT_ID: z.string().uuid('EMT_ID must be a valid UUID'),
  DISPATCHER_ID: z.string().uuid('DISPATCHER_ID must be a valid UUID'),
});

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    '❌ Invalid environment variables:',
    JSON.stringify(parsed.error.format(), null, 2),
  );
  process.exit(1);
}

export const env: Env = parsed.data;

const isDev = env.APP_STAGE === 'dev';

if (isDev) {
  console.log('🚀 Running in development mode');
}

export default env;
