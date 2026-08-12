import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Spacing, Typography, Layout, Radii } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";
import { SectionTitle } from "../ui/SectionTitle";
import { AppCard } from "../ui/AppCard";

export const StudyGuideSection = React.memo(function StudyGuideSection() {
  const { theme } = useTheme();

  return (
    <>
      <SectionTitle>HƯỚNG DẪN SỬ DỤNG & QUY TRÌNH HỌC</SectionTitle>

      <View style={styles.guideListContainer}>
        {/* Step 1: FSRS 4.5/5 Algorithm */}
        <AppCard style={styles.guideCard}>

          <View style={styles.guideHeaderRow}>
            <View style={[styles.guideIconTile, { backgroundColor: theme.blueDim }]}>
              <Ionicons name="analytics" size={Layout.iconLg} color={theme.blue} />
            </View>
            <View style={styles.guideHeaderText}>
              <Text style={[styles.guideTitle, { color: theme.textPrimary }]}>1. Thuật toán Trí nhớ FSRS 4.5/5</Text>
              <Text style={[styles.guideSub, { color: theme.textMuted }]}>Tính độ bền (Stability) & Độ khó (Difficulty) chính xác</Text>
            </View>
          </View>
          <Text style={[styles.guideDesc, { color: theme.textMuted }]}>
            Ứng dụng thuật toán FSRS tiên tiến nhất để tự động tính toán khả năng phục hồi trí nhớ (Retrievability), xếp lịch ôn tập tối ưu trước khi từ vựng bị quên và đưa từ vựng vào ghi nhớ dài hạn.
          </Text>
        </AppCard>

        {/* Step 2: TikTok Swipe & 3-Stage Study Loop */}
        <AppCard style={styles.guideCard}>
          <View style={styles.guideHeaderRow}>
            <View style={[styles.guideIconTile, { backgroundColor: theme.blueDim }]}>
              <Ionicons name="git-network" size={Layout.iconLg} color={theme.blue} />
            </View>
            <View style={styles.guideHeaderText}>
              <Text style={[styles.guideTitle, { color: theme.textPrimary }]}>2. Lộ trình Học 3 Giai đoạn Thích ứng</Text>
              <Text style={[styles.guideSub, { color: theme.textMuted }]}>Thẻ vuốt TikTok ➔ Kiểm tra Quiz ➔ Vòng lặp Sửa lỗi</Text>
            </View>
          </View>
          <View style={styles.gestureGuideList}>
            <View style={styles.gestureRowItem}>
              <Text style={[styles.gestureText, { color: theme.textMuted }]}>
                <Text style={{ fontWeight: Typography.weight.extraBold, color: theme.textPrimary }}>Giai đoạn 1 (Nạp từ):</Text> Vuốt lên/xuống kiểu TikTok để học thẻ, chạm thẻ mở chi tiết Pinyin, Dịch nghĩa & Cấu trúc bộ thủ AI.
              </Text>
            </View>
            <View style={styles.gestureRowItem}>
              <Text style={[styles.gestureText, { color: theme.textMuted }]}>
                <Text style={{ fontWeight: Typography.weight.extraBold, color: theme.textPrimary }}>Giai đoạn 2 (Kiểm tra):</Text> Làm bài Quiz kiểm tra phản xạ kiến thức đa dạng dạng bài.
              </Text>
            </View>
            <View style={styles.gestureRowItem}>
              <Text style={[styles.gestureText, { color: theme.textMuted }]}>
                <Text style={{ fontWeight: Typography.weight.extraBold, color: theme.textPrimary }}>Giai đoạn 3 (Sửa lỗi):</Text> Tự động cắm cờ lập vòng lặp sửa lỗi ngay cho các câu trả lời sai hoặc phản xạ chậm.
              </Text>
            </View>
          </View>
        </AppCard>

        {/* Step 3: Adaptive Quiz & Speed Evaluation */}
        <AppCard style={styles.guideCard}>
          <View style={styles.guideHeaderRow}>
            <View style={[styles.guideIconTile, { backgroundColor: theme.greenDim }]}>
              <Ionicons name="help-circle" size={Layout.iconLg} color={theme.green} />
            </View>
            <View style={styles.guideHeaderText}>
              <Text style={[styles.guideTitle, { color: theme.textPrimary }]}>3. Bài tập Quiz & Đánh giá Tốc độ Phản xạ</Text>
              <Text style={[styles.guideSub, { color: theme.textMuted }]}>Đánh giá mức độ thuộc dựa trên thời gian chọn đáp án</Text>
            </View>
          </View>
          <View style={styles.gestureGuideList}>
            <View style={styles.gestureRowItem}>
              <Text style={[styles.gestureText, { color: theme.textMuted }]}>
                <Text style={{ fontWeight: Typography.weight.extraBold, color: theme.textPrimary }}>Đánh giá phản xạ (FSRS Grade):</Text> Trả lời đúng ≤ 2.5s được xếp loại Easy (Dễ), 2.5s–5.0s loại Good (Tốt), &gt; 5.0s loại Hard (Khó).
              </Text>
            </View>
            <View style={styles.gestureRowItem}>
              <Text style={[styles.gestureText, { color: theme.textMuted }]}>
                <Text style={{ fontWeight: Typography.weight.extraBold, color: theme.textPrimary }}>Dạng bài đa dạng:</Text> Chọn nghĩa tiếng Việt, chọn Pinyin, nghe âm thanh chọn Hán tự và điền câu Cloze ngữ cảnh.
              </Text>
            </View>
          </View>
        </AppCard>

        {/* Step 4: Arcade Practice Hub */}
        <AppCard style={styles.guideCard}>
          <View style={styles.guideHeaderRow}>
            <View style={[styles.guideIconTile, { backgroundColor: theme.yellowDim }]}>
              <Ionicons name="game-controller" size={Layout.iconLg} color={theme.yellow} />
            </View>
            <View style={styles.guideHeaderText}>
              <Text style={[styles.guideTitle, { color: theme.textPrimary }]}>4. Trung tâm Luyện tập Arcade</Text>
              <Text style={[styles.guideSub, { color: theme.textMuted }]}>Luyện phản xạ với 3 Mini-Games tự do</Text>
            </View>
          </View>
          <View style={styles.gestureGuideList}>
            <View style={styles.gestureRowItem}>
              <Text style={[styles.gestureText, { color: theme.textMuted }]}>
                <Text style={{ fontWeight: Typography.weight.extraBold, color: theme.textPrimary }}>Ghép Từ Nhanh 60s:</Text> Thử thách ghép cặp Hán tự ↔ Nghĩa siêu tốc tích điểm XP.
              </Text>
            </View>
            <View style={styles.gestureRowItem}>
              <Text style={[styles.gestureText, { color: theme.textMuted }]}>
                <Text style={{ fontWeight: Typography.weight.extraBold, color: theme.textPrimary }}>Xếp Từ Thành Câu:</Text> Ghép câu hoàn chỉnh với vị trí từ vựng cố định không giật layout.
              </Text>
            </View>
            <View style={styles.gestureRowItem}>
              <Text style={[styles.gestureText, { color: theme.textMuted }]}>
                <Text style={{ fontWeight: Typography.weight.extraBold, color: theme.textPrimary }}>Luyện Phát Âm AI:</Text> Thu âm đọc Hán tự, AI nhận diện và chấm điểm Pinyin & 4 thanh điệu.
              </Text>
            </View>
          </View>
        </AppCard>

        {/* Step 5: AI Automatic Creation */}
        <AppCard style={styles.guideCard}>
          <View style={styles.guideHeaderRow}>
            <View style={[styles.guideIconTile, { backgroundColor: theme.blueDim }]}>
              <Ionicons name="sparkles" size={Layout.iconLg} color={theme.blue} />
            </View>
            <View style={styles.guideHeaderText}>
              <Text style={[styles.guideTitle, { color: theme.textPrimary }]}>5. Nạp Từ Vựng Tự Động Bằng AI</Text>
              <Text style={[styles.guideSub, { color: theme.textMuted }]}>Tự động tạo Pinyin, Dịch nghĩa & Phân tích Bộ thủ</Text>
            </View>
          </View>
          <Text style={[styles.guideDesc, { color: theme.textMuted }]}>
            Nhập chữ Hán, Pinyin hoặc chủ đề ➔ AI tự động trích xuất Pinyin, Nghĩa Tiếng Việt, Phân tích Cấu trúc bộ thủ chiết tự và tạo Câu ví dụ chuẩn ngữ cảnh.
          </Text>
        </AppCard>

        {/* Step 6: Level & Badges */}
        <AppCard style={styles.guideCard}>
          <View style={styles.guideHeaderRow}>
            <View style={[styles.guideIconTile, { backgroundColor: theme.yellowDim }]}>
              <Ionicons name="trophy" size={Layout.iconLg} color={theme.yellow} />
            </View>
            <View style={styles.guideHeaderText}>
              <Text style={[styles.guideTitle, { color: theme.textPrimary }]}>6. Cấp Độ Hán Ngữ & Bộ Huy Hiệu</Text>
              <Text style={[styles.guideSub, { color: theme.textMuted }]}>Thăng hạng danh hiệu thực chất & mở khóa huy hiệu</Text>
            </View>
          </View>
          <Text style={[styles.guideDesc, { color: theme.textMuted }]}>
            Tích lũy XP qua bài học để thăng hạng qua 6 cấp danh hiệu Hán ngữ chuẩn và chinh phục Bộ 14 Huy hiệu thành tích cá nhân.
          </Text>
        </AppCard>

      </View>
    </>
  );
});


const styles = StyleSheet.create({
  guideListContainer: { gap: Spacing.md, marginBottom: Spacing.md },
  guideCard: { padding: Spacing.md },
  guideHeaderRow: { flexDirection: "row", alignItems: "center", gap: Spacing.md, marginBottom: Spacing.sm },
  guideIconTile: {
    width: Layout.avatarMd,
    height: Layout.avatarMd,
    borderRadius: Radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  guideHeaderText: { flex: 1 },
  guideTitle: { fontSize: Typography.titleMD.fontSize, fontWeight: Typography.weight.extraBold },
  guideSub: { fontSize: Typography.caption1.fontSize, fontWeight: Typography.weight.semibold, marginTop: 2 },
  guideDesc: { fontSize: Typography.caption.fontSize, lineHeight: 18, fontWeight: Typography.weight.medium },
  gestureGuideList: { gap: Spacing.sm, marginTop: Spacing.xs },
  gestureRowItem: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  gestureText: { fontSize: Typography.caption.fontSize, flex: 1 },
});
