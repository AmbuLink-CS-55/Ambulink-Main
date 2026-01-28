import { z } from "zod";

const envSchema = z.object({
  EXPO_PUBLIC_API_SERVER_URL: z.url(),
  EXPO_PUBLIC_WS_SERVER_URL: z.url(),
  EXPO_PUBLIC_PATIENT_ID: z.uuid(),
  EXPO_PUBLIC_DRIVER_ID: z.uuid(),
  EXPO_PUBLIC_EMT_ID: z.uuid(),
  EXPO_PUBLIC_APP_STAGE: z.enum(["dev", "prod", "test"]).default("dev"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid .env", JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

const env = parsed.data;
export const isDev = env.EXPO_PUBLIC_APP_STAGE === "dev";

if (__DEV__ && isDev) {
  console.log("Running in development mode");
}

export default env;
