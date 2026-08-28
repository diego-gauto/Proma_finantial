import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z
    .string()
    .url()
    .refine(
      (value) => value.startsWith("postgresql://") || value.startsWith("postgres://"),
      "DATABASE_URL must be a PostgreSQL connection string"
    ),
  SESSION_SECRET: z.string().min(32)
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function readServerEnv(
  source: Record<string, string | undefined>
): ServerEnv {
  const result = serverEnvSchema.safeParse(source);

  if (!result.success) {
    throw new Error("Invalid server environment");
  }

  return result.data;
}

export function getServerEnv(): ServerEnv {
  return readServerEnv(process.env);
}
