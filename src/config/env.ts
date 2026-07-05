import { z } from "zod";

const clientEnvSchema = z.object({
  VITE_SUPABASE_URL: z.string().url().optional(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1).optional(),
});

const serverEnvSchema = z.object({
  PORT: z.string().default("3000"),
  DATABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
});

export const getClientEnv = () => {
  return clientEnvSchema.parse({
    VITE_SUPABASE_URL: import.meta.env?.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env?.VITE_SUPABASE_ANON_KEY,
  });
};

export const getServerEnv = () => {
  return serverEnvSchema.parse({
    PORT: process.env.PORT,
    DATABASE_URL: process.env.DATABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });
};
