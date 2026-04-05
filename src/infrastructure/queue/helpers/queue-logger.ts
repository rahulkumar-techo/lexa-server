type QueueLogLevel = "info" | "warn" | "error";

const writeLog = (level: QueueLogLevel, message: string, context?: Record<string, unknown>) => {
  const payload = {
    scope: "queue",
    level,
    message,
    ...context,
    timestamp: new Date().toISOString()
  };

  const line = JSON.stringify(payload);

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.info(line);
};

export const queueLogger = {
  info: (message: string, context?: Record<string, unknown>) => writeLog("info", message, context),
  warn: (message: string, context?: Record<string, unknown>) => writeLog("warn", message, context),
  error: (message: string, context?: Record<string, unknown>) => writeLog("error", message, context)
};
