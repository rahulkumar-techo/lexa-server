type PrettyLogLevel = "info" | "warn" | "error";

const levelLabel: Record<PrettyLogLevel, string> = {
  info: "INFO",
  warn: "WARN",
  error: "ERROR"
};

const stringifyValue = (value: unknown) => {
  if (value instanceof Error) {
    return value.message;
  }

  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value);
};

const formatContext = (context?: Record<string, unknown>) => {
  if (!context) {
    return "";
  }

  const entries = Object.entries(context).filter(([, value]) => value !== undefined);

  if (entries.length === 0) {
    return "";
  }

  return entries
    .map(([key, value]) => `${key}=${stringifyValue(value)}`)
    .join(" | ");
};

export const writePrettyLog = (
  scope: string,
  level: PrettyLogLevel,
  message: string,
  context?: Record<string, unknown>
) => {
  const timestamp = new Date().toISOString();
  const details = formatContext(context);
  const line = `[${timestamp}] [${scope}] ${levelLabel[level]}: ${message}${details ? ` | ${details}` : ""}`;

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
