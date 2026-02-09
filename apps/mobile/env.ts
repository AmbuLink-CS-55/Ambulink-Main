import { z } from 'zod';

const envSchema = z.object({
  EXPO_PUBLIC_API_SERVER_URL: z
    .string()
    .url('EXPO_PUBLIC_API_SERVER_URL must be a valid URL'),
  EXPO_PUBLIC_WS_SERVER_URL: z
    .string()
    .url('EXPO_PUBLIC_WS_SERVER_URL must be a valid URL'),
  EXPO_PUBLIC_PATIENT_ID: z
    .string()
    .uuid('EXPO_PUBLIC_PATIENT_ID must be a valid UUID'),
  EXPO_PUBLIC_DRIVER_ID: z
    .string()
    .uuid('EXPO_PUBLIC_DRIVER_ID must be a valid UUID'),
  EXPO_PUBLIC_EMT_ID: z
    .string()
    .uuid('EXPO_PUBLIC_EMT_ID must be a valid UUID'),
  EXPO_PUBLIC_APP_STAGE: z
    .enum(['dev', 'prod', 'test'])
    .default('dev'),
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
export const isDev = env.EXPO_PUBLIC_APP_STAGE === 'dev';

if (__DEV__ && isDev) {
  console.log('🚀 Running in development mode');
}

export default env;
