import { writePrettyLog } from "@/src/utils/pretty-log";

type QueueLogLevel = "info" | "warn" | "error";

const writeLog = (level: QueueLogLevel, message: string, context?: Record<string, unknown>) => {
  writePrettyLog("queue", level, message, context);
};

export const queueLogger = {
  info: (message: string, context?: Record<string, unknown>) => writeLog("info", message, context),
  warn: (message: string, context?: Record<string, unknown>) => writeLog("warn", message, context),
  error: (message: string, context?: Record<string, unknown>) => writeLog("error", message, context)
};
