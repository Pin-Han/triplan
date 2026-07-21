/**
 * In-memory rate limiter for demo deployment.
 * Limits the number of distinct planning sessions per contextId per day.
 * A "planning session" is counted once per unique taskId that triggers call_agent.
 */

const DEFAULT_DAILY_LIMIT = parseInt(process.env.DAILY_PLAN_LIMIT || "3", 10);

interface UsageRecord {
  count: number;
  taskIds: Set<string>;
  resetAt: number; // epoch ms
}

const usage = new Map<string, UsageRecord>();

function getOrCreate(contextId: string): UsageRecord {
  const now = Date.now();
  let record = usage.get(contextId);

  if (!record || now >= record.resetAt) {
    // New day — reset
    const tomorrow = new Date();
    tomorrow.setHours(24, 0, 0, 0);
    record = { count: 0, taskIds: new Set(), resetAt: tomorrow.getTime() };
    usage.set(contextId, record);
  }

  return record;
}

/** Check if this contextId can start a new planning session. */
export function canPlan(contextId: string): boolean {
  const record = getOrCreate(contextId);
  return record.count < DEFAULT_DAILY_LIMIT;
}

/**
 * Record a call_agent invocation.
 * Only increments the count once per unique taskId (= one planning session).
 * Returns true if allowed, false if rate limited.
 */
export function recordPlanningCall(contextId: string, taskId: string): boolean {
  const record = getOrCreate(contextId);

  // Already counted this taskId — allow without incrementing
  if (record.taskIds.has(taskId)) return true;

  // New taskId — check limit
  if (record.count >= DEFAULT_DAILY_LIMIT) return false;

  record.taskIds.add(taskId);
  record.count++;
  console.log(`[RateLimiter] contextId=${contextId} taskId=${taskId} — plan ${record.count}/${DEFAULT_DAILY_LIMIT}`);
  return true;
}

/** Get remaining plans for a contextId. */
export function remainingPlans(contextId: string): number {
  const record = getOrCreate(contextId);
  return Math.max(0, DEFAULT_DAILY_LIMIT - record.count);
}

/** Get the daily limit. */
export function getDailyLimit(): number {
  return DEFAULT_DAILY_LIMIT;
}
