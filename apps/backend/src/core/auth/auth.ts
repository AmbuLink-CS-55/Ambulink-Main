import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../database/schema";
import env from "env";

// Standalone DB connection for better-auth 
const client = postgres(env.DATABASE_URL, { prepare: false });
const db = drizzle(client, { schema });

export const auth = betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,

    databaseHooks: {
      user: {                                                                
        create: { 
          before: async (user) => {
            return { data: { ...user, id: crypto.randomUUID() } };
          },
        },                                                                         },
    },

    database: drizzleAdapter(db, {
      provider: "pg",
      schema: {
        user: schema.users,
        session: schema.sessions,
        account: schema.accounts,
      },
    }),
    emailAndPassword: {
      enabled: true,
    }, 
    user: {
      fields: {
        name: "fullName",
      },
      additionalFields: {
        role: {
          type: "string",
          required: true,
        },
        status: {
          type: "string",
          required: false,
        },
        providerId: {
          type: "string",
          required: false,
        },
      },
    },
});

export type Auth = typeof auth;