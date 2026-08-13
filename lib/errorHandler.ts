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
 * Maps Authentication error codes to friendly Vietnamese messages (Supabase & legacy).
 */
export function getAuthErrorMessage(error: unknown): string {
  if (!error) return "Đã xảy ra lỗi không xác định. Vui lòng thử lại.";

  const { code, message } = extractErrorDetails(error);
  const msgLower = message.toLowerCase();

  if (code === "auth/invalid-credential" || msgLower.includes("invalid login credentials")) {
    return "Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.";
  }

  if (code === "auth/user-not-found" || msgLower.includes("user not found")) {
    return "Không tìm thấy tài khoản với email này. Vui lòng kiểm tra chính tả hoặc tạo tài khoản mới.";
  }

  if (code === "auth/email-already-in-use" || msgLower.includes("already registered") || msgLower.includes("already exists")) {
    return "Địa chỉ email này đã được đăng ký tài khoản khác. Vui lòng đăng nhập hoặc dùng email khác.";
  }

  if (code === "auth/weak-password" || msgLower.includes("password should be at least")) {
    return "Mật khẩu quá ngắn. Vui lòng nhập mật khẩu từ 6 ký tự trở lên.";
  }

  if (code === "auth/invalid-email" || msgLower.includes("unable to validate email")) {
    return "Địa chỉ email không hợp lệ. Vui lòng nhập đúng dạng example@domain.com.";
  }

  if (code === "auth/too-many-requests" || msgLower.includes("rate limit")) {
    return "Tài khoản tạm thời bị giới hạn thao tác do nhập sai quá nhiều lần. Vui lòng thử lại sau vài phút.";
  }

  if (msgLower.includes("network") || msgLower.includes("fetch")) {
    return "Không thể kết nối máy chủ. Vui lòng kiểm tra kết nối Wi-Fi hoặc 4G của bạn.";
  }

  return message || "Không thể thực hiện thao tác. Vui lòng thử lại sau.";
}

/**
 * Maps AI & API errors to friendly Vietnamese messages.
 */
export function getGeminiErrorMessage(error: unknown): string {
  if (!error) return "Không thể tạo từ vựng bằng AI. Vui lòng thử lại.";

  const { message } = extractErrorDetails(error);

  if (
    message.includes("RESOURCE_EXHAUSTED") ||
    message.includes("429") ||
    message.includes("quota")
  ) {
    return "Hệ thống AI đang quá tải lượt tra cứu. Vui lòng đợi 30 giây rồi bấm thử lại.";
  }

  if (message.includes("JSON") || message.includes("parse") || message.includes("SyntaxError")) {
    return "AI chưa thể phân tích từ vựng này. Vui lòng kiểm tra lại chính tả chữ Hán hoặc Pinyin đã nhập.";
  }

  if (
    message.includes("network") ||
    message.includes("Failed to fetch") ||
    message.includes("offline")
  ) {
    return "Không thể kết nối với AI. Vui lòng kiểm tra mạng Internet của bạn.";
  }

  return "Không thể phân tích từ vựng lúc này. Vui lòng thử lại sau.";
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
