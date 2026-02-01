import dotenv from 'dotenv';
import z from "zod";

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.url(),
  PATIENT_ID: z.uuidv4(),
  DRIVER_ID: z.uuidv4(),
  EMT_ID: z.uuidv4(),
  DISPATCHER_ID: z.uuidv4(),
  APP_STAGE: z.enum(["dev", "prod", "test"]).default("dev"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid .env", JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

const env = parsed.data;
const isDev = env.APP_STAGE === "dev";

if (isDev) {
  console.log("Running in development mode");
}

export default env;
