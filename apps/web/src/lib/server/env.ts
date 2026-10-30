import "server-only";
import { z } from "zod";

const ServerEnvironmentSchema = z.object({
  AUTH_PROXY_SECRET: z.string().min(32).optional(),
  API_BASE_URL: z
    .string()
    .url()
    .refine((value) => ["http:", "https:"].includes(new URL(value).protocol), {
      message: "API_BASE_URL must use http or https",
    })
    .default("http://127.0.0.1:4000"),
});

let cachedEnvironment: z.infer<typeof ServerEnvironmentSchema> | undefined;

export function getServerEnvironment() {
  cachedEnvironment ??= ServerEnvironmentSchema.parse({
    API_BASE_URL: process.env.API_BASE_URL,
    AUTH_PROXY_SECRET: process.env.AUTH_PROXY_SECRET,
  });
  return cachedEnvironment;
}
