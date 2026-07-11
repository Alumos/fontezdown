import { getManagedSettings } from "./settingsStore.js";
import {
  type SequentialSyncResult,
  runConfiguredSyncSequence,
} from "./syncTasks.js";
import dayjs from "dayjs";

let timer: NodeJS.Timeout | null = null;
let scheduleGeneration = 0;
let running = false;
let nextRunAt = "";
const SCHEDULE_RETRY_MS = 60 * 60 * 1000;

export function nextDailySyncAt(now: Date, time: string): Date {
  const [hoursText = "3", minutesText = "0"] = time.split(":");
  const hours = Number(hoursText);
  const minutes = Number(minutesText);
  const next = new Date(now);
  next.setHours(hours, minutes, 0, 0);
  if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
  return next;
}

function phaseLabel(result: SequentialSyncResult): string {
  const fonts = result.fonts.success
    ? "腾讯文档成功"
    : `腾讯文档失败：${result.fonts.error || "未知错误"}`;
  const articles = result.articles.success
    ? "公众号文章成功"
    : `公众号文章失败：${result.articles.error || "未知错误"}`;
  return `${fonts}；${articles}`;
}

async function runScheduledSync(): Promise<void> {
  if (running) return;
  running = true;
  try {
    const result = await runConfiguredSyncSequence();
    console.log(
      `[${dayjs().format("YYYY-MM-DD HH:mm:ss")}] 每日同步完成：${phaseLabel(result)}`,
    );
  } finally {
    running = false;
  }
}

function scheduleNext(generation: number): void {
  const settings = getManagedSettings();
  if (!settings.dailySyncEnabled || generation !== scheduleGeneration) {
    nextRunAt = "";
    return;
  }

  const next = nextDailySyncAt(new Date(), settings.dailySyncTime);
  nextRunAt = next.toISOString();
  timer = setTimeout(
    () => {
      timer = null;
      void runScheduledSync().then(
        () => tryScheduleNext(generation),
        (error: unknown) => {
          console.error(
            `[${dayjs().format("YYYY-MM-DD HH:mm:ss")}] 每日同步任务异常：`,
            error,
          );
          tryScheduleNext(generation);
        },
      );
    },
    Math.max(0, next.getTime() - Date.now()),
  );
  timer.unref();
  console.log(
    `[${dayjs().format("YYYY-MM-DD HH:mm:ss")}] 每日同步已排程：${dayjs(next).format("YYYY-MM-DD HH:mm:ss")}`,
  );
}

function tryScheduleNext(generation: number): void {
  if (generation !== scheduleGeneration) return;
  try {
    scheduleNext(generation);
  } catch (error) {
    console.error(
      `[${dayjs().format("YYYY-MM-DD HH:mm:ss")}] 每日同步排程失败，将在一小时后重试：`,
      error,
    );
    const retryAt = new Date(Date.now() + SCHEDULE_RETRY_MS);
    nextRunAt = retryAt.toISOString();
    timer = setTimeout(() => {
      timer = null;
      tryScheduleNext(generation);
    }, SCHEDULE_RETRY_MS);
    timer.unref();
  }
}

export function rescheduleDailySync(): void {
  scheduleGeneration += 1;
  if (timer) clearTimeout(timer);
  timer = null;
  tryScheduleNext(scheduleGeneration);
}

export function startDailySync(): void {
  rescheduleDailySync();
}

export function stopDailySync(): void {
  scheduleGeneration += 1;
  if (timer) clearTimeout(timer);
  timer = null;
  nextRunAt = "";
}

export function dailySyncStatus(): {
  running: boolean;
  nextRunAt: string;
} {
  return { running, nextRunAt };
}
