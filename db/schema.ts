import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  credits: integer("credits").default(5),
});

export const agentConfig = pgTable("agentConfig", {
  id: serial("id").primaryKey(),
  agentId: varchar("agentId").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  agentImage: text("agent_image").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  userEmail: text("user_email")
    .notNull()
    .references(() => users.email),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type newAgent = typeof agentConfig.$inferInsert;
export type agent = typeof agentConfig.$inferSelect;
