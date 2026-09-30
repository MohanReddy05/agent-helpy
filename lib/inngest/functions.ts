import { inngest } from './client';
import { and, eq, lte } from 'drizzle-orm';
import { db } from '@/db';
import { agentConfig, routine, routineExecution, tools } from '@/db/schema';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { executeOpenAIAgentChat } from '@/lib/openai/MyAgent';
import { getConnectedToolkitSlugs } from '@/lib/composio';
import { getNextRunAt, type RoutineSchedule } from '@/lib/routines';

/**
 * Example 1: Event-driven Background Job
 * Triggered by sending an event with name: 'app/task.process'
 * Demonstrates multi-step durable execution with retries and sleep.
 */
export const processTaskBackgroundJob = inngest.createFunction(
  {
    id: 'process-task-job',
    name: 'Process Task Background Job',
    retries: 3,
  },
  { event: 'app/task.process' },
  async ({ event, step }) => {
    // Step 1: Initialize background task
    const initialResult = await step.run('init-task', async () => {
      console.log('Starting background processing for task payload:', event.data);
      return { taskId: event.data?.taskId || 'task_default', status: 'initialized' };
    });

    // Step 2: Pause or simulate asynchronous workflow delays
    await step.sleep('wait-for-processing', '2s');

    // Step 3: Complete background processing
    const completedResult = await step.run('complete-task', async () => {
      console.log('Completed processing task:', initialResult.taskId);
      return {
        taskId: initialResult.taskId,
        status: 'completed',
        completedAt: new Date().toISOString(),
      };
    });

    return {
      success: true,
      data: completedResult,
    };
  }
);

/**
 * Example 2: Scheduled Cron Job
 * Triggered automatically on a recurring schedule (e.g. daily at midnight: '0 0 * * *')
 */
export const dailySyncScheduledJob = inngest.createFunction(
  {
    id: 'daily-sync-job',
    name: 'Daily Sync Scheduled Cron Job',
  },
  { cron: '0 0 * * *' }, // Runs every day at 00:00 UTC
  async ({ step }) => {
    const syncResult = await step.run('run-scheduled-sync', async () => {
      console.log('Running scheduled daily maintenance & sync...');
      return {
        syncedRecords: 0,
        syncedAt: new Date().toISOString(),
      };
    });

    return {
      success: true,
      summary: syncResult,
    };
  }
);

export const runDueAgentRoutines = inngest.createFunction(
  { id: 'run-due-agent-routines', name: 'Run Due Agent Schedules', retries: 1 },
  { cron: '* * * * *' },
  async ({ step }) => {
    const dueAt = new Date();
    const dueRoutines = await step.run('find-due-routines', () =>
      db.select().from(routine).where(and(eq(routine.isActive, true), lte(routine.nextRunAt, dueAt))),
    );

    for (const scheduled of dueRoutines) {
      await step.run(`execute-routine-${scheduled.id}`, async () => {
        const schedule = scheduled.schedule as RoutineSchedule;
        const nextRunAt = schedule.frequency === 'once'
          ? null
          : getNextRunAt(schedule, scheduled.timeZone || 'UTC', new Date());
        const [claimed] = await db.update(routine).set({
          nextRunAt,
          isActive: nextRunAt !== null,
        }).where(and(
          eq(routine.id, scheduled.id),
          eq(routine.isActive, true),
          lte(routine.nextRunAt, dueAt),
        )).returning({ id: routine.id });
        if (!claimed) return { skipped: true };

        try {
          const [agent] = await db.select().from(agentConfig).where(and(
            eq(agentConfig.agentId, scheduled.agentId),
            eq(agentConfig.userEmail, scheduled.userEmail),
          ));
          if (!agent) throw new Error('Agent configuration was not found.');
          const catalog = await db.select().from(tools).where(eq(tools.isActive, true));
          const agentTools = Array.isArray(agent.tools)
            ? agent.tools.filter((slug): slug is string => typeof slug === 'string').map((slug) => slug.toLowerCase())
            : [];
          const requiredTools = Array.isArray(scheduled.requiredTools)
            ? scheduled.requiredTools.filter((slug): slug is string => typeof slug === 'string').map((slug) => slug.toLowerCase())
            : agentTools;
          const allowed = requiredTools.filter((slug) => agentTools.includes(slug) && catalog.some((tool) => tool.slug.toLowerCase() === slug));
          const connected = process.env.COMPOSIO_API_KEY
            ? await getConnectedToolkitSlugs(scheduled.userEmail, allowed)
            : [];
          const response = await executeOpenAIAgentChat({
            agentName: agent.name,
            instructions: agent.description || '',
            messages: [{
              role: 'user',
              text: `Run the scheduled task "${scheduled.name}". Goal: ${scheduled.goal}\nInstructions: ${scheduled.instructions || scheduled.goal}`,
            }],
            enabledToolkits: connected,
            availableTools: connected.map((slug) => {
              const match = catalog.find((tool) => tool.slug.toLowerCase() === slug);
              return { slug, name: match?.name || slug, description: match?.description || '' };
            }),
            userEmail: scheduled.userEmail,
            model: DEFAULT_CHAT_MODEL,
          });
          await db.insert(routineExecution).values({
            routineId: scheduled.id,
            status: 'completed',
            result: response.content,
          });
          return { status: 'completed' };
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Routine execution failed.';
          await db.insert(routineExecution).values({
            routineId: scheduled.id,
            status: 'failed',
            result: message,
          });
          return { status: 'failed', error: message };
        }
      });
    }
    return { processed: dueRoutines.length };
  },
);
