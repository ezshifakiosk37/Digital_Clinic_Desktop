import { date, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    username: varchar("username", { length: 50 }).notNull().unique(),
    password: text("password").notNull(),
    location: text("location").notNull().default("Pilot"),
    createdAt: date("created_at").defaultNow().notNull(),
});
