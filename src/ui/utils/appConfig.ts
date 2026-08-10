export interface AppConfig {
  geminiApiKey: string;
  firebaseApiKey: string;
  isDevelopment: boolean;
}

export function loadAppConfig(): AppConfig {
  const isDev = process.env.NODE_ENV !== "production";
  return {
    geminiApiKey: process.env.GEMINI_API_KEY || "",
    firebaseApiKey: process.env.FIREBASE_API_KEY || "",
    isDevelopment: isDev,
  };
}

export const appConfig = loadAppConfig();
