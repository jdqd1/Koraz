import { PLATFORM_TIME_ZONE, TimeZoneSchema, localDateInTimeZone } from "@cediah/contracts";
import type { Transaction } from "kysely";
import type { CediahDatabase, DatabaseClient } from "../db/database.js";

export async function learningTimeZone(database: DatabaseClient | Transaction<CediahDatabase>, userId: string) {
  const preference = await database.selectFrom("learning_preferences").select("timezone").where("user_id", "=", userId).executeTakeFirst();
  const parsed = TimeZoneSchema.safeParse(preference?.timezone);
  return parsed.success ? parsed.data : PLATFORM_TIME_ZONE;
}

export async function learningEventTime(database: DatabaseClient | Transaction<CediahDatabase>, userId: string, acceptedAt: Date) {
  const timezone = await learningTimeZone(database, userId);
  return { timezone, local_date: localDateInTimeZone(acceptedAt, timezone), occurred_at: acceptedAt };
}
