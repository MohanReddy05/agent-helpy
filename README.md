# Helpy

Helpy is a personal AI workspace for creating focused agents, chatting with them, connecting integrations, and scheduling recurring work. Each agent has its own instructions, enabled tools, and conversation history.

## Contents

- [Features](#features)
- [Technology](#technology)
- [Requirements](#requirements)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Database and tool catalog](#database-and-tool-catalog)
- [Running scheduled work locally](#running-scheduled-work-locally)
- [Application routes](#application-routes)
- [API overview](#api-overview)
- [Project structure](#project-structure)
- [Available commands](#available-commands)
- [Deployment notes](#deployment-notes)

## Features

- Create agents with a name, description, and generated avatar.
- Chat with an agent and keep conversation history between visits.
- Choose an OpenAI or Google Gemini model for a conversation.
- Connect integrations through Composio, then choose which connected tools each agent can use.
- Create one-time, daily, weekly, or monthly schedules for an agent.
- Run due schedules through Inngest and retain execution results.
- Sync scheduled work to Google Calendar when the user has connected that integration.
- Review agents, connected tools, and upcoming schedules from the workspace overview.
- Sign in with Google or GitHub OAuth.
- Use the workspace, agent configuration, and integration catalog on mobile and desktop screens.

## Technology

- Next.js App Router and React with TypeScript
- Tailwind CSS 4, with shared UI primitives in `components/ui`
- PostgreSQL with Drizzle ORM and `postgres-js`
- NextAuth.js for Google and GitHub OAuth sessions
- OpenAI and Google Gemini for agent responses
- Composio for connected apps and agent tool execution
- Inngest for scheduled/background functions

## Requirements

- Node.js `>=22.22.3` (as specified by `package.json`)
- npm
- A PostgreSQL database
- OAuth credentials for at least one supported sign-in provider
- An OpenAI API key, a Gemini API key, or both, depending on which chat models you want to use
- A Composio API key to connect app integrations or sync schedules to Google Calendar
- An Inngest account and keys for deployed scheduled jobs; the local Inngest dev server can be used during development

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create a local environment file from the example:

   ```bash
   cp .env.example .env.local
   ```

   Fill in the values you need. See [Environment variables](#environment-variables). Do not commit `.env.local` or any file containing real credentials.

3. Create a PostgreSQL database and set `DATABASE_URL` to its connection string.

4. Apply the current Drizzle schema:

   ```bash
   npm run db:push
   ```

   This pushes the schema in `db/schema.ts` to the configured database. `npm run db:generate` can generate migration files under `drizzle/` when you prefer a migration workflow.

5. Add the integrations you want to offer to the database tool catalog. The catalog setup is described in [Database and tool catalog](#database-and-tool-catalog). The repository does not currently include a tool-catalog seed command.

6. Start the Next.js development server:

   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000), sign in with a configured OAuth provider, and create an agent.

To use scheduled work locally, start the Inngest development server in a second terminal as described below.

## Environment variables

The checked-in `.env.example` lists the application variables. Set secrets only in a local environment file or your deployment provider's secret store.

| Variable | Required for | Description |
| --- | --- | --- |
| `DATABASE_URL` | App data and Drizzle commands | PostgreSQL connection string. |
| `NEXTAUTH_URL` | OAuth authentication | Public base URL of the app, such as `http://localhost:3000` locally. |
| `NEXTAUTH_SECRET` | Session signing | A long, random secret used by NextAuth. Set a secure value outside local development. |
| `GITHUB_CLIENT_ID` | GitHub sign-in | GitHub OAuth application client ID. |
| `GITHUB_CLIENT_SECRET` | GitHub sign-in | GitHub OAuth application client secret. |
| `GOOGLE_CLIENT_ID` | Google sign-in | Google OAuth client ID. |
| `GOOGLE_CLIENT_SECRET` | Google sign-in | Google OAuth client secret. |
| `OPENAI_API_KEY` | OpenAI chat models | API key for the OpenAI models exposed in the model selector. |
| `OPENAI_MODEL` | OpenAI fallback | Optional default model fallback used by the OpenAI agent implementation. |
| `GEMINI_API_KEY` | Gemini chat models | API key for Google Gemini models. |
| `GEMINI_FALLBACK_MODEL` | Gemini fallback | Optional Gemini model fallback; the implementation has a default if this is unset. |
| `COMPOSIO_API_KEY` | Integration connections and Calendar sync | Composio key used to create user sessions, authorize toolkits, and execute connected tools. |
| `NEXT_PUBLIC_APP_URL` | Integration OAuth callbacks | Optional public app URL used when constructing Composio callback URLs. Defaults to the incoming request origin. |
| `INNGEST_EVENT_KEY` | Inngest event publishing | Inngest event key used by the Inngest client. |
| `INNGEST_SIGNING_KEY` | Deployed Inngest endpoint | Signing key for validating Inngest requests in deployment. |

At least one OAuth provider must be configured for users to sign in. Configure the matching ID and secret together. OpenAI and Gemini keys are independently required only when using models from those providers. Composio is needed for integrations and Google Calendar sync; basic agent chat can run without it.

The app's default chat model is configured in `lib/ai/models.ts`. Keep the model IDs and provider access configured there aligned with the credentials available in the deployment.

The model selector currently includes GPT-4.1 mini, GPT-5.6 Luna, GPT-5.6 Terra, GPT-5.6, Gemini 3.8 Flash, and Gemini 3.5 Flash-Lite. Scheduled routine execution currently uses the default OpenAI model, so configure `OPENAI_API_KEY` if you plan to run scheduled work, even if interactive chats use Gemini.

## Database and tool catalog

The Drizzle schema is in `db/schema.ts`. It defines tables for:

- `users`: OAuth user records.
- `agentConfig`: agent names, instructions, avatars, selected tool slugs, and ownership.
- `tools`: the integration catalog shown in Marketplace and agent settings.
- `routine`: schedule definitions, next-run times, and required tools.
- `agentChatHistory`: saved conversations for each user and agent.
- `routineExecution`: results and status for completed or failed schedule runs.

### Add integrations to the catalog

Marketplace displays active rows from the `tools` table. There is no automatic catalog import or seed script in this repository, so add the Composio toolkit slugs you intend to support. For example, to make Google Calendar available:

```sql
INSERT INTO tools (name, slug, description, category, is_active)
VALUES (
  'Google Calendar',
  'googlecalendar',
  'Create and manage calendar events for scheduled agent work.',
  'Calendar',
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  is_active = EXCLUDED.is_active;
```

Use toolkit slugs supported by Composio. The `icon` column is optional and can hold an image URL. Set `is_active` to `false` to hide a catalog entry without deleting it. After a user connects an app in Marketplace, they can enable or remove it for individual agents.

For Google Calendar synchronization, the Google Calendar toolkit must be in the active catalog, `COMPOSIO_API_KEY` must be configured, and the user must connect Google Calendar in Marketplace.

## Running scheduled work locally

Start the Next.js app in one terminal:

```bash
npm run dev
```

Start the Inngest local development server in another terminal:

```bash
npm run inngest:dev
```

The configured Inngest CLI command points to `http://localhost:3000/api/inngest`. The app serves its Inngest functions from `app/api/inngest/route.ts`. The `runDueAgentRoutines` function checks for due active routines every minute, executes the task with the agent, and records a success or failure in `routineExecution`.

For a deployed environment, expose the Inngest endpoint and configure the event and signing keys from your Inngest environment. The `app/api/inngest/trigger` route is a sample endpoint for sending an `app/task.process` event.

## Application routes

| Route | Description |
| --- | --- |
| `/` | Public landing page; signed-in users are redirected to the workspace. |
| `/sign-in` | Sign in with Google or GitHub. |
| `/sign-up` | Start an account with Google or GitHub. |
| `/workspace` | Agent list, workspace summary, and upcoming schedules. |
| `/workspace/create-agent` | Create an agent and choose its initial tools. |
| `/workspace/[agentId]` | Agent chat and configuration for settings, tools, schedules, and agent actions. |
| `/marketplace` | Browse and connect integrations. |
| `/sign-out` | Signed-out confirmation page. |

## API overview

The API routes are implemented under `app/api/`. User-facing data operations validate the signed-in session; the Inngest endpoints are called by the Inngest service.

| Endpoint | Methods | Purpose |
| --- | --- | --- |
| `/api/auth/[...nextauth]` | `GET`, `POST` | NextAuth OAuth and session handlers. |
| `/api/user` | `POST` | Create the signed-in user's database record if needed. |
| `/api/agent` | `GET`, `POST`, `PUT`, `PATCH`, `DELETE` | List, create, update, duplicate, pause/resume, reset, and delete agents. |
| `/api/agent/chat` | `GET`, `POST` | Load conversation history, generate a model response, and save the updated history. |
| `/api/tools` | `GET`, `PATCH` | Read the active integration catalog and update an agent's enabled tool list. |
| `/api/tools/connect` | `POST` | Create a Composio authorization link for an integration. |
| `/api/routine` | `GET`, `POST`, `PATCH`, `DELETE` | Create, list, pause/resume, and delete agent schedules. |
| `/api/inngest` | `GET`, `POST`, `PUT` | Serve registered Inngest functions. |
| `/api/inngest/trigger` | `POST` | Send the sample `app/task.process` background event. |

## Project structure

```text
app/
  (auth)/                  Sign-in and sign-up pages
  api/                     Next.js route handlers
  marketplace/             Integration marketplace page
  workspace/               Workspace, agent creation, and agent detail pages
  globals.css              Global styles and theme tokens
components/
  custom/agentspace/       Chat, agent configuration, tools, and schedule UI
  custom/workspace/        Workspace navigation and agent data provider
  ui/                      Shared UI primitives
context/                   Agent configuration React context
db/
  index.ts                 PostgreSQL client and Drizzle instance
  schema.ts                Database tables and inferred types
lib/
  ai/                      Chat model definitions
  googleAI/                Gemini agent implementation and response schema
  openai/                  OpenAI agent implementation
  inngest/                 Background job client and functions
  routines.ts              Schedule validation and next-run calculation
  composio.ts              Composio sessions and connected toolkit helpers
  googleCalendar.ts        Google Calendar event create/delete helpers
drizzle.config.ts          Drizzle Kit configuration
```

## Available commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Next.js development server. |
| `npm run build` | Create a production build. |
| `npm run start` | Start the production server after building. |
| `npm run lint` | Run the lint command configured in `package.json`. |
| `npm run db:generate` | Generate Drizzle migration files from schema changes. |
| `npm run db:push` | Push the Drizzle schema to the configured database. |
| `npm run db:studio` | Open Drizzle Studio for the configured database. |
| `npm run inngest:dev` | Start the local Inngest development server for this app. |

## Deployment notes

- Configure a reachable PostgreSQL database and apply the Drizzle schema before serving user traffic.
- Set a strong `NEXTAUTH_SECRET` and the correct public `NEXTAUTH_URL` for the deployed domain.
- Add the deployed callback URLs to each configured Google or GitHub OAuth application.
- Set `NEXT_PUBLIC_APP_URL` to the deployed HTTPS origin when Composio callbacks need an explicit public URL.
- Provide the provider API keys for the models you expose to users.
- Configure `COMPOSIO_API_KEY` and populate the active tool catalog before enabling integration features.
- Configure Inngest event/signing keys and register `/api/inngest` with the Inngest deployment for scheduled routines.
- Keep all credentials server-side. Only variables prefixed with `NEXT_PUBLIC_` are intended to be exposed to browser code.
