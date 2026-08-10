---
theme:
  colors:
    light:
      primary: "#059669"
      primaryShadow: "#047857"
      secondary: "#D97706"
      secondaryShadow: "#B45309"
      danger: "#DC2626"
      dangerShadow: "#991B1B"
      info: "#2563EB"
      infoShadow: "#1D4ED8"
      bg: "#F8FAFC"
      cardBg: "#FFFFFF"
      cardBorder: "transparent"
      textPrimary: "#0F172A"
      textSecondary: "#64748B"
      textLight: "#94A3B8"
      white: "#FFFFFF"
    dark:
      primary: "#10B981"
      primaryShadow: "#059669"
      secondary: "#F59E0B"
      secondaryShadow: "#D97706"
      danger: "#EF4444"
      dangerShadow: "#DC2626"
      info: "#3B82F6"
      infoShadow: "#2563EB"
      bg: "#0F172A"
      cardBg: "#1E293B"
      cardBorder: "transparent"
      textPrimary: "#F8FAFC"
      textSecondary: "#94A3B8"
      textLight: "#64748B"
      white: "#FFFFFF"
  spacing:
    xs: 4
    sm: 8
    md: 12
    lg: 16
    xl: 24
    xxl: 32
---

# DESIGN.md — Anki Hán Ngữ (Duolingo Style & Dark Mode)

## Visual Identity & Guidelines

1. **Hạn chế dùng border**: Thay thế các đường viền ngột ngạt bằng chiều sâu (shadow/elevation), màu nền tương phản nhẹ nhàng và góc bo mềm tròn.
2. **Dark Mode & OS Auto**: Hỗ trợ giao diện sáng/tối tự động hoặc tùy chọn thủ công trong mục Profile.
3. **Full-screen Modals**: Các cửa sổ Modal (thêm thẻ AI, tạo bộ thẻ) mở phủ kín màn hình chuẩn Mobile App.
4. **Header Profile**: Thanh Header cố định/linh hoạt gồm Lời chào User, Profile Avatar, Streak 🔥, XP ⚡.
5. **Mobile Safe Area**: Tính toán khoảng cách tai thỏ, viền dưới điện thoại chính xác.
