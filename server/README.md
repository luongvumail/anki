# Cloudflare Worker Proxy cho Gemini AI

Tập tin `worker.js` giúp ẩn `GEMINI_API_KEY` của bạn khỏi ứng dụng React Native / Expo, tránh bị lộ khi decompile app.

---

## 🚀 Hướng dẫn khởi tạo & Deploy (Free & Nhanh 3 phút)

### Qua giao diện Web Cloudflare (Đơn giản nhất, không cần cài đặt CLI)

1. Đăng nhập [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. Chọn **Workers & Pages** ở menu bên trái -> Bấm **Create Application** -> **Create Worker**.
3. Đặt tên cho Worker (ví dụ: `anki-gemini-proxy`) -> Bấm **Deploy**.
4. Bấm nút **Edit code** (hoặc Quick Edit).
5. Copy toàn bộ nội dung tập tin [`server/worker.js`](./worker.js) dán vào trình biên tập code -> Bấm **Save and Deploy**.

#### Cấu hình Secret Key (Bắt buộc):

1. Vào Worker vừa tạo -> Tab **Settings** -> **Variables and Secrets**.
2. Thêm Variable thứ nhất (**Secret**):
   - **Variable name**: `GEMINI_API_KEY`
   - **Value**: Dán Gemini API Key của bạn (bắt đầu bằng `AIza...`)
3. Thêm Variable thứ hai (**Secret** - tuỳ chọn nhưng khuyến nghị):
   - **Variable name**: `APP_SECRET`
   - **Value**: Tạo 1 chuỗi ngẫu nhiên bí mật (ví dụ: `anki_secret_token_2026_xyz`)
4. Bấm **Save and Deploy**.

---

## 📱 Cấu hình ứng dụng React Native / Expo

Trong tập tin `.env` ở thư mục gốc của dự án Anki, thêm:

```env
# URL của Worker vừa deploy (thay anki-gemini-proxy.your-subdomain.workers.dev bằng URL thực tế)
EXPO_PUBLIC_AI_PROXY_URL=https://anki-gemini-proxy.your-subdomain.workers.dev

# (Nếu có cài APP_SECRET ở trên) Khớp với APP_SECRET trên Worker
EXPO_PUBLIC_APP_TOKEN=anki_secret_token_2026_xyz

# Không còn bắt buộc phải để EXPO_PUBLIC_GEMINI_API_KEY trong app bundle nữa!
# EXPO_PUBLIC_GEMINI_API_KEY=
```

---

## 🧪 Kiểm tra Worker bằng cURL (Terminal)

```bash
# 1. Kiểm tra Health Check (GET)
curl https://anki-gemini-proxy.your-subdomain.workers.dev/

# Kết quả mong đợi:
# {"status":"ok","message":"Anki Gemini Proxy is online & active!"}

# 2. Kiểm tra gọi AI qua Proxy (POST)
curl -X POST https://anki-gemini-proxy.your-subdomain.workers.dev/ \
  -H "Content-Type: application/json" \
  -H "X-App-Token: your_secret_token" \
  -d '{"model":"gemini-3.5-flash","prompt":"Say hello in JSON: {\"msg\":\"hello\"}"}'
```

---

## 🛡️ Cách hoạt động

1. App gửi request tới `EXPO_PUBLIC_AI_PROXY_URL` kèm theo `X-App-Token` header.
2. Worker kiểm tra `X-App-Token` (nếu đúng) rồi tự động đính kèm `GEMINI_API_KEY` gọi tới Google REST API (tự động retry nếu dính 429/503).
3. Hỗ trợ cả text generation và multimodal inlineData (thu âm phát âm m4a).
4. Nếu chưa cấu hình `EXPO_PUBLIC_AI_PROXY_URL`, app sẽ tự động fallback về cách gọi SDK trực tiếp với `EXPO_PUBLIC_GEMINI_API_KEY` (đảm bảo tương thích ngược 100%).
