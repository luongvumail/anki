const isDev = process.env.NODE_ENV !== "production";

export const logger = {
  info: (message: string, meta?: object) => {
    if (isDev) {
      console.log(`[INFO] ${message}`, meta ? JSON.stringify(meta) : "");
    }
  },
  warn: (message: string, meta?: object) => {
    console.warn(`[WARN] ${message}`, meta ? JSON.stringify(meta) : "");
  },
  error: (message: string, meta?: object) => {
    console.error(`[ERROR] ${message}`, meta ? JSON.stringify(meta) : "");
  },
};
