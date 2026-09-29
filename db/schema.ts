import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

//  Users Table (No changes)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  credits: integer("credits").default(5),
});

//  Agent Config Table (Updated with Composio, Tools, and E2B Sandbox tracking)
export const agentConfig = pgTable("agentConfig", {
  id: serial("id").primaryKey(),
  agentId: varchar("agentId").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  agentImage: text("agent_image").notNull(),
  tools: jsonb("tools").default([]), // Stores connected tool slugs
  composioSessionId: varchar("composio_session_id"), // Tracks Composio MCP session
  e2bSandboxId: varchar("e2b_sandbox_id"), // Tracks Cloud Desktop VM session
  isE2bActive: boolean("is_e2b_active").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  userEmail: text("user_email")
    .notNull()
    .references(() => users.email),
});

//  Tools Catalog Table (Stores available Composio MCP tools)
export const tools = pgTable("tools", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  slug: varchar("slug").notNull().unique(),
  description: text("description"),
  icon: text("icon"),
  category: varchar("category"),
  isActive: boolean("is_active").default(true),
});

//  Routine Table (For Inngest Background Jobs)
export const routine = pgTable("routine", {
  id: serial("id").primaryKey(),
  agentId: varchar("agent_id")
    .notNull()
    .references(() => agentConfig.agentId),
  userEmail: text("user_email")
    .notNull()
    .references(() => users.email),
  name: text("name").notNull(),
  goal: text("goal").notNull(),
  instructions: text("instructions"),
  schedule: jsonb("schedule"), // Stores frequency, time, days
  timeZone: varchar("time_zone").default("UTC"),
  requiredTools: jsonb("required_tools").default([]),
  isActive: boolean("is_active").default(true),
  nextRunAt: timestamp("next_run_at"), // Calculated time for next Inngest execution
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

//  Agent Chat History (Maintains conversation context)
export const agentChatHistory = pgTable("agentChatHistory", {
  id: serial("id").primaryKey(),
  agentId: varchar("agent_id")
    .notNull()
    .references(() => agentConfig.agentId),
  userEmail: text("user_email")
    .notNull()
    .references(() => users.email),
  messages: jsonb("messages").notNull(), // Stores chat log array
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

//  Routine Execution Logs (Tracks success/failures from Inngest)
export const routineExecution = pgTable("routineExecution", {
  id: serial("id").primaryKey(),
  routineId: integer("routine_id")
    .notNull()
    .references(() => routine.id),
  status: varchar("status").notNull(), // "running", "completed", "failed"
  result: text("result"), // Agent's output or error trace
  executedAt: timestamp("executed_at").defaultNow().notNull(),
});

// Type Exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Agent = typeof agentConfig.$inferSelect;
export type NewAgent = typeof agentConfig.$inferInsert;

export type Tool = typeof tools.$inferSelect;
export type Routine = typeof routine.$inferSelect;
export type RoutineExecution = typeof routineExecution.$inferSelect;
export type ChatHistory = typeof agentChatHistory.$inferSelect;
