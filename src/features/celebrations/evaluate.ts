import { getDb } from "@/db/client";
import { getSetting } from "@/db/repositories/settings";
import { formatShortDate, toDateKey } from "@/lib/dates";
import { computeHabitStats } from "@/lib/habitStats";
import { runSerial } from "@/lib/serial";
import type { SQLiteDatabase } from "expo-sqlite";
import { messageFor } from "./messages";
import {
    useCelebrationStore,
    type Celebration,
    type CelebrationAction,
    type CelebrationKind,
} from "./store";

export const CELEBRATION_CONFIG = {
  /** Only things completed this recently can celebrate, so opening a screen or restoring data never does. */
  recentMs: 60_000,
  /** A day with fewer commitments than this is not worth a celebration. */
  minDailyCommitments: 2,
  /** Collapses a burst of changes into one check. */
  debounceMs: 500,
} as const;

/** When several things happen at once, only the most meaningful one is shown. */
const PRIORITY: Record<CelebrationKind, number> = {
  goal: 5,
  review: 4,
  streak: 3,
  milestone: 2,
  daily: 1,
};

type Candidate = {
  kind: CelebrationKind;
  ref: string;
  goalId?: string;
  celebration: Celebration;
};

const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;

function build(
  kind: CelebrationKind,
  ref: string,
  name: string | null,
  summary: string | null,
  action: CelebrationAction | null,
  streak = 0,
): Celebration {
  return {
    id: `${kind}:${ref}`,
    kind,
    ...messageFor(kind, ref, name, streak),
    summary,
    action,
  };
}

const progressAction: CelebrationAction = {
  label: "View progress",
  target: { type: "progress" },
};

/** Records a celebration as shown. Returns false if it was already recorded, so it can never repeat. */
async function claim(
  db: SQLiteDatabase,
  kind: CelebrationKind,
  ref: string,
): Promise<boolean> {
  const result = await db.runAsync(
    "INSERT OR IGNORE INTO celebrations (id, kind, ref_id, shown_at) VALUES (?, ?, ?, ?)",
    `${kind}:${ref}`,
    kind,
    ref,
    new Date().toISOString(),
  );
  return result.changes > 0;
}

async function collect(
  db: SQLiteDatabase,
  name: string | null,
  now: number,
): Promise<Candidate[]> {
  const cutoff = new Date(now - CELEBRATION_CONFIG.recentMs).toISOString();
  const today = toDateKey(new Date(now));
  const out: Candidate[] = [];

  // Goals completed in the last minute.
  const goals = await db.getAllAsync<{
    id: string;
    title: string;
    steps: number;
  }>(
    `SELECT g.id AS id, g.title AS title,
            (SELECT COUNT(*) FROM goal_steps s WHERE s.goal_id = g.id) AS steps
     FROM goals g WHERE g.status = 'completed' AND g.completed_at >= ?`,
    cutoff,
  );
  for (const g of goals) {
    const summary =
      g.steps > 0
        ? `${g.title}: ${plural(g.steps, "step", "steps")} done`
        : g.title;
    out.push({
      kind: "goal",
      ref: g.id,
      goalId: g.id,
      celebration: build("goal", g.id, name, summary, {
        label: "View goal",
        target: { type: "goal", id: g.id },
      }),
    });
  }

  // Milestones whose last open step was finished in the last minute.
  const milestones = await db.getAllAsync<{
    id: string;
    title: string;
    goal_id: string;
    goal_title: string;
  }>(
    `SELECT m.id AS id, m.title AS title, g.id AS goal_id, g.title AS goal_title,
            SUM(CASE WHEN s.completed_at IS NULL THEN 1 ELSE 0 END) AS open_steps,
            MAX(s.completed_at) AS last_done
     FROM milestones m
     JOIN goals g ON g.id = m.goal_id AND g.status = 'active'
     JOIN goal_steps s ON s.milestone_id = m.id
     GROUP BY m.id
     HAVING open_steps = 0 AND last_done >= ?`,
    cutoff,
  );
  for (const m of milestones) {
    out.push({
      kind: "milestone",
      ref: m.id,
      goalId: m.goal_id,
      celebration: build(
        "milestone",
        m.id,
        name,
        `${m.title} in ${m.goal_title}`,
        {
          label: "View goal",
          target: { type: "goal", id: m.goal_id },
        },
      ),
    });
  }

  // Habit streak milestones, for habits completed in the last minute.
  const habits = await db.getAllAsync<{
    id: string;
    name: string;
    start_date: string;
  }>(
    `SELECT h.id AS id, h.name AS name, h.start_date AS start_date
     FROM habit_completions hc JOIN habits h ON h.id = hc.habit_id
     WHERE hc.date = ? AND hc.completed_at >= ? AND h.status = 'active'`,
    today,
    cutoff,
  );
  for (const h of habits) {
    const [days, dates] = await Promise.all([
      db.getAllAsync<{ weekday: number }>(
        "SELECT weekday FROM habit_schedules WHERE habit_id = ?",
        h.id,
      ),
      db.getAllAsync<{ date: string }>(
        "SELECT date FROM habit_completions WHERE habit_id = ?",
        h.id,
      ),
    ]);
    const stats = computeHabitStats({
      weekdays: days.map((d) => d.weekday),
      startDate: h.start_date,
      completionDates: dates.map((d) => d.date),
      today,
    });
    if (stats.streakMilestoneToday === null) continue;
    const n = stats.streakMilestoneToday;
    const ref = `${h.id}:${n}`;
    out.push({
      kind: "streak",
      ref,
      celebration: build(
        "streak",
        ref,
        name,
        `${h.name}, ${n} scheduled days in a row`,
        { label: "View habit", target: { type: "habit", id: h.id } },
        n,
      ),
    });
  }

  // Weekly reviews completed in the last minute.
  const reviews = await db.getAllAsync<{ week_start: string }>(
    "SELECT week_start FROM weekly_reviews WHERE completed_at >= ?",
    cutoff,
  );
  for (const r of reviews) {
    out.push({
      kind: "review",
      ref: r.week_start,
      celebration: build(
        "review",
        r.week_start,
        name,
        `Week of ${formatShortDate(r.week_start)}`,
        progressAction,
      ),
    });
  }

  // Everything on today's list done, with the last completion in the last minute.
  const weekday = new Date(now).getDay();
  const [taskRows, stepRows, habitRows] = await Promise.all([
    db.getAllAsync<{ status: string; completed_at: string | null }>(
      "SELECT status, completed_at FROM tasks WHERE date = ?",
      today,
    ),
    db.getAllAsync<{ completed_at: string | null }>(
      `SELECT s.completed_at AS completed_at
       FROM goal_steps s JOIN goals g ON g.id = s.goal_id
       WHERE s.scheduled_date = ? AND g.status = 'active'`,
      today,
    ),
    db.getAllAsync<{ completed_at: string | null }>(
      `SELECT hc.completed_at AS completed_at
       FROM habits h
       JOIN habit_schedules hs ON hs.habit_id = h.id AND hs.weekday = ?
       LEFT JOIN habit_completions hc ON hc.habit_id = h.id AND hc.date = ?
       WHERE h.status = 'active' AND h.start_date <= ?`,
      weekday,
      today,
      today,
    ),
  ]);

  const total = taskRows.length + stepRows.length + habitRows.length;
  const doneTasks = taskRows.filter((t) => t.status === "done");
  const stamps = [
    ...doneTasks.map((t) => t.completed_at),
    ...stepRows.map((s) => s.completed_at),
    ...habitRows.map((h) => h.completed_at),
  ].filter((s): s is string => s !== null);
  const done =
    doneTasks.length +
    stepRows.filter((s) => s.completed_at !== null).length +
    habitRows.filter((h) => h.completed_at !== null).length;
  const latest = stamps.reduce<string | null>(
    (a, b) => (a === null || b > a ? b : a),
    null,
  );

  if (
    total >= CELEBRATION_CONFIG.minDailyCommitments &&
    done === total &&
    latest !== null &&
    latest >= cutoff
  ) {
    out.push({
      kind: "daily",
      ref: today,
      celebration: build(
        "daily",
        today,
        name,
        `${done} of ${total} commitments done`,
        progressAction,
      ),
    });
  }

  return out;
}

async function runEvaluation(): Promise<void> {
  if ((await getSetting("celebrations_enabled")) === "0") return;

  const db = await getDb();
  const name = await getSetting("user_name");
  const candidates = await collect(db, name, Date.now());
  if (candidates.length === 0) return;

  // Drop anything that has already been celebrated.
  const fresh: Candidate[] = [];
  for (const c of candidates) {
    const seen = await db.getFirstAsync<{ x: number }>(
      "SELECT 1 AS x FROM celebrations WHERE kind = ? AND ref_id = ?",
      c.kind,
      c.ref,
    );
    if (!seen) fresh.push(c);
  }
  if (fresh.length === 0) return;

  fresh.sort((a, b) => PRIORITY[b.kind] - PRIORITY[a.kind]);
  const winner = fresh[0];

  // Recorded before it is shown, so a crash or a quick repeat can never replay it.
  if (!(await claim(db, winner.kind, winner.ref))) return;

  // A completed goal absorbs the celebration of its own milestones.
  if (winner.kind === "goal") {
    for (const c of fresh) {
      if (c.kind === "milestone" && c.goalId === winner.goalId)
        await claim(db, c.kind, c.ref);
    }
  }

  useCelebrationStore.getState().enqueue(winner.celebration);
}

let timer: ReturnType<typeof setTimeout> | null = null;

/** Call after any change that could be a milestone. Bursts collapse into a single check. */
export function requestCelebrationCheck(): void {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    runSerial(runEvaluation).catch((error) =>
      console.warn("Celebration check failed", error),
    );
  }, CELEBRATION_CONFIG.debounceMs);
}

/** Dev only. Shows a sample without recording anything. */
export async function previewCelebration(kind: CelebrationKind): Promise<void> {
  const name = await getSetting("user_name");
  const ref = `preview-${Date.now()}`;
  const samples: Record<
    CelebrationKind,
    { summary: string; action: CelebrationAction | null; streak?: number }
  > = {
    daily: { summary: "5 of 5 commitments done", action: progressAction },
    goal: { summary: "Learn TypeScript: 6 steps done", action: null },
    milestone: {
      summary: "Understand the fundamentals in Learn TypeScript",
      action: null,
    },
    streak: {
      summary: "Read for 20 minutes, 7 scheduled days in a row",
      action: null,
      streak: 7,
    },
    review: { summary: "Week of 27 Oct", action: progressAction },
  };
  const sample = samples[kind];
  useCelebrationStore
    .getState()
    .enqueue(
      build(kind, ref, name, sample.summary, sample.action, sample.streak ?? 0),
    );
}
