export type ErrorCode =
  | "NETWORK_ERROR"
  | "AI_PARSE_ERROR"
  | "STORAGE_ERROR"
  | "FIREBASE_ERROR"
  | "RATE_LIMIT_ERROR"
  | "UNKNOWN_ERROR";

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    public readonly userMessage: string,
    public readonly retryable: boolean,
    public readonly cause?: unknown,
  ) {
    super(userMessage);
    this.name = "AppError";
  }
}

export function mapToAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;

  if (error instanceof Error && error.message.toLowerCase().includes("network")) {
    return new AppError("NETWORK_ERROR", "Mất kết nối mạng. Vui lòng thử lại.", true, error);
  }

  return new AppError(
    "UNKNOWN_ERROR",
    "Đã xảy ra lỗi không xác định. Vui lòng thử lại sau.",
    false,
    error,
  );
}
