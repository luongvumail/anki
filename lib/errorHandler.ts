// Centralized User-Facing Error Handler for Anki App
// Converts raw technical error codes into friendly, localized Vietnamese messages with clear guidance.

interface ErrorLike {
  code?: string;
  message?: string;
  status?: number;
}

function extractErrorDetails(error: unknown): { code: string; message: string; status: number } {
  if (!error) return { code: "", message: "", status: 0 };
  if (typeof error === "string") return { code: error, message: error, status: 0 };
  if (typeof error === "object" && error !== null) {
    const err = error as ErrorLike;
    return {
      code: typeof err.code === "string" ? err.code : "",
      message: typeof err.message === "string" ? err.message : String(error),
      status: typeof err.status === "number" ? err.status : 0,
    };
  }
  return { code: "", message: String(error), status: 0 };
}

/**
 * Maps Authentication error codes to friendly Vietnamese messages (OAuth & Supabase).
 */
export function getAuthErrorMessage(error: unknown): string {
  if (!error) return "Đã xảy ra lỗi đăng nhập. Vui lòng thử lại.";

  const { code, message } = extractErrorDetails(error);
  const msgLower = message.toLowerCase();

  if (code === "auth/too-many-requests" || msgLower.includes("rate limit")) {
    return "Thao tác đăng nhập bị giới hạn do thử quá nhiều lần. Vui lòng đợi vài phút.";
  }

  if (msgLower.includes("network") || msgLower.includes("fetch") || msgLower.includes("offline")) {
    return "Không thể kết nối máy chủ đăng nhập. Vui lòng kiểm tra Wi-Fi hoặc 4G.";
  }

  if (msgLower.includes("canceled") || msgLower.includes("dismissed")) {
    return "Đã hủy thao tác đăng nhập Google.";
  }

  return message || "Đăng nhập không thành công. Vui lòng thử lại sau.";
}

/**
 * Maps AI & API errors to friendly Vietnamese messages.
 */
export function getGeminiErrorMessage(error: unknown): string {
  if (!error) return "Không thể tạo từ vựng bằng AI. Vui lòng thử lại.";

  const { message } = extractErrorDetails(error);
  const msgLower = message.toLowerCase();

  if (
    message.includes("RESOURCE_EXHAUSTED") ||
    message.includes("429") ||
    msgLower.includes("quota") ||
    msgLower.includes("rate limit")
  ) {
    return "Hệ thống AI đang quá tải lượt tra cứu. Vui lòng đợi 30 giây rồi bấm thử lại.";
  }

  if (msgLower.includes("not found") || msgLower.includes("404")) {
    return "Mô hình AI chưa sẵn sàng hoặc đang bảo trì. Vui lòng bấm thử lại.";
  }

  if (msgLower.includes("api key") || msgLower.includes("unauthorized") || msgLower.includes("token")) {
    return "Lỗi xác thực dịch vụ AI. Vui lòng kiểm tra lại cấu hình ứng dụng.";
  }

  if (message.includes("JSON") || message.includes("parse") || message.includes("SyntaxError")) {
    return "AI chưa thể phân tích từ vựng này. Vui lòng kiểm tra lại chính tả chữ Hán hoặc Pinyin đã nhập.";
  }

  if (
    msgLower.includes("network") ||
    msgLower.includes("failed to fetch") ||
    msgLower.includes("offline") ||
    msgLower.includes("abort")
  ) {
    return "Không thể kết nối với AI. Vui lòng kiểm tra mạng Internet của bạn.";
  }

  return message || "Không thể phân tích từ vựng lúc này. Vui lòng thử lại sau.";
}

/**
 * Maps Database errors (Supabase / Postgres) to friendly Vietnamese messages.
 */
export function getDatabaseErrorMessage(error: unknown): string {
  if (!error) return "Đã xảy ra lỗi dữ liệu. Vui lòng thử lại.";

  const { code, message } = extractErrorDetails(error);

  if (code === "PGRST301" || code === "42501" || message.includes("permission denied") || message.includes("JWT")) {
    return "Bạn không có quyền thực hiện thao tác này. Vui lòng đăng nhập lại.";
  }

  if (message.includes("network") || message.includes("Failed to fetch") || message.includes("offline")) {
    return "Thiết bị đang ngoại tuyến. Vui lòng kiểm tra kết nối mạng.";
  }

  return message || "Không thể lưu dữ liệu. Vui lòng thử lại sau.";
}

// Backward compatibility alias for legacy calls
export const getFirestoreErrorMessage = getDatabaseErrorMessage;
