import React, { useEffect, useState, useMemo } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { computeDueCount, computeLearnedCount, computeNewCount } from "../../domain/card/cardUtils.js";
import { getLevelInfo } from "../../domain/user/userProgress.js";
import { authService, UserProfile } from "../../infrastructure/auth/authService.js";
import { notificationService, NotificationSettings } from "../../infrastructure/notifications/notificationService.js";
import { DailyReviewLog, reviewTrackerRepo } from "../../infrastructure/persistence/reviewTrackerRepo.js";
import { BadgesGallery } from "../components/BadgesGallery.js";
import { DuolingoButton } from "../components/DuolingoButton.js";
import { DuolingoCard } from "../components/DuolingoCard.js";
import { Icon } from "../components/Icon.js";
import { ProgressBar } from "../components/ProgressBar.js";
import { StatusBadge } from "../components/StatusBadge.js";
import { theme } from "../theme/theme.js";
import { appStore } from "../store/useAppStore.js";

export interface StatsScreenProps {
  onLogout?: () => void;
}

export const StatsScreen: React.FC<StatsScreenProps> = ({ onLogout }) => {
  const [logs, setLogs] = useState<DailyReviewLog[]>([]);
  const [storeState, setStoreState] = useState(appStore.getState());
  const [currentUser, setCurrentUser] = useState<UserProfile>(authService.getCurrentUser());
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>(notificationService.getSettings());

  useEffect(() => {
    reviewTrackerRepo.getRecentLogs(7).then(setLogs);
    const unsubStore = appStore.subscribe(() => {
      setStoreState(appStore.getState());
    });
    const unsubAuth = authService.subscribe(() => {
      setCurrentUser(authService.getCurrentUser());
    });
    const unsubNotif = notificationService.subscribe(() => {
      setNotifSettings(notificationService.getSettings());
    });

    return () => {
      unsubStore();
      unsubAuth();
      unsubNotif();
    };
  }, []);

  const { userProgress, cards } = storeState;

  const allCardsList = useMemo(() => {
    let list: any[] = [];
    Object.values(cards).forEach((deckCards) => {
      list = list.concat(deckCards);
    });
    return list;
  }, [cards]);

  const totalCardsCount = allCardsList.length;
  const dueCount = useMemo(() => computeDueCount(allCardsList), [allCardsList]);
  const learnedCount = useMemo(() => computeLearnedCount(allCardsList), [allCardsList]);
  const newCardsCount = useMemo(() => computeNewCount(allCardsList), [allCardsList]);

  const retentionRatePct = useMemo(() => {
    if (totalCardsCount === 0) return 0;
    return Math.round((learnedCount / totalCardsCount) * 100);
  }, [totalCardsCount, learnedCount]);

  const levelInfo = useMemo(() => getLevelInfo(userProgress.totalXp), [userProgress.totalXp]);

  const maxCount = Math.max(...logs.map((l) => l.count), 1);

  const [showChangePassModal, setShowChangePassModal] = useState<boolean>(false);
  const [oldPass, setOldPass] = useState<string>("");
  const [newPass, setNewPass] = useState<string>("");
  const [changePassError, setChangePassError] = useState<string | null>(null);
  const [changePassSuccess, setChangePassSuccess] = useState<boolean>(false);

  const handleLogout = async () => {
    await authService.logout();
    if (onLogout) onLogout();
  };

  const handleChangePassword = async () => {
    setChangePassError(null);
    setChangePassSuccess(false);

    if (!oldPass || !newPass) {
      setChangePassError("Vui lòng nhập mật khẩu cũ và mật khẩu mới.");
      return;
    }

    if (newPass.length < 6) {
      setChangePassError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }

    try {
      await authService.changePassword(oldPass, newPass);
      setChangePassSuccess(true);
      setOldPass("");
      setNewPass("");
      setTimeout(() => {
        setShowChangePassModal(false);
        setChangePassSuccess(false);
      }, 1500);
    } catch (e: any) {
      setChangePassError(e.message || "Không thể đổi mật khẩu lúc này.");
    }
  };

  const handleToggleNotification = (val: boolean) => {
    notificationService.toggleEnabled(val);
  };

  const handleSetReminderTime = (time: string) => {
    notificationService.setReminderTime(time);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Icon name="stats" size={32} color={theme.colors.primary} />
          <Text style={styles.pageTitle}>Thống Kê & Tài Khoản</Text>
        </View>

        {/* User Profile Card */}
        <DuolingoCard accessibilityLabel="Thông tin tài khoản">
          <View style={styles.profileRow}>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{currentUser.displayName}</Text>
              <Text style={styles.profileEmail}>
                {currentUser.isGuest ? "Tài khoản Khách (Chưa đăng ký)" : currentUser.email}
              </Text>
            </View>
            <StatusBadge
              variant={currentUser.isGuest ? "warning" : "learned"}
              label={currentUser.isGuest ? "KHÁCH" : "ĐÃ XÁC THỰC"}
            />
          </View>
          <View style={styles.profileBtnWrapper}>
            <DuolingoButton
              title={currentUser.isGuest ? "ĐĂNG NHẬP / ĐĂNG KÝ" : "ĐĂNG XUẤT"}
              variant={currentUser.isGuest ? "primary" : "secondary"}
              onPress={handleLogout}
            />

            {!currentUser.isGuest && (
              <Pressable
                onPress={() => setShowChangePassModal(true)}
                style={styles.changePassBtn}
              >
                <Text style={styles.changePassText}>ĐỔI MẬT KHẢU TÀI KHOẢN</Text>
              </Pressable>
            )}
          </View>
        </DuolingoCard>

        {/* Daily Push Notification Settings */}
        <View style={styles.sectionMargin}>
          <DuolingoCard accessibilityLabel="Nhắc nhở học hàng ngày">
            <View style={styles.notifHeader}>
              <View style={styles.notifTitleRow}>
                <Icon name="clock" size={24} color={theme.colors.primary} />
                <View style={styles.notifTextCol}>
                  <Text style={styles.notifTitle}>NHẮC NHỞ HỌC HÀNG NGÀY</Text>
                  <Text style={styles.notifSubtitle}>
                    {notifSettings.enabled
                      ? `Đang bật: Nhắc học vào ${notifSettings.reminderTime} mỗi ngày`
                      : "Đã tắt nhắc nhở hàng ngày"}
                  </Text>
                </View>
              </View>
              <Switch
                value={notifSettings.enabled}
                onValueChange={handleToggleNotification}
                trackColor={{ false: theme.colors.cardBorder, true: theme.colors.primary }}
              />
            </View>

            {notifSettings.enabled && (
              <View style={styles.timeRow}>
                <Text style={styles.timeLabel}>Chọn giờ nhắc:</Text>
                {["08:00", "12:00", "20:00"].map((t) => (
                  <Pressable
                    key={t}
                    onPress={() => handleSetReminderTime(t)}
                    style={[
                      styles.timeBtn,
                      notifSettings.reminderTime === t && styles.timeBtnActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.timeText,
                        notifSettings.reminderTime === t && styles.timeTextActive,
                      ]}
                    >
                      {t}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </DuolingoCard>
        </View>

        {/* Level Banner */}
        <View style={styles.sectionMargin}>
          <DuolingoCard accessibilityLabel="Cấp độ người dùng">
            <View style={styles.bannerRow}>
              <View style={styles.levelHeader}>
                <View style={styles.badgeRow}>
                  <View style={styles.levelBadge}>
                    <Text style={styles.levelBadgeText}>LV.{levelInfo.level}</Text>
                  </View>
                  <Text style={styles.levelTitle}>{levelInfo.title}</Text>
                  <Text style={styles.levelSubtitle}>({levelInfo.titleVi})</Text>
                </View>
                <Text style={styles.xpText}>{userProgress.totalXp} XP Tích Lũy</Text>
              </View>
              <Icon name="trophy" size={36} color={theme.colors.secondary} />
            </View>
            <ProgressBar progress={levelInfo.progress * 100} color={theme.colors.secondary} />
          </DuolingoCard>
        </View>

        {/* Main Retention Card */}
        <DuolingoCard accessibilityLabel="Tiến độ thuộc từ vựng">
          <View style={styles.retentionHeader}>
            <View style={styles.retentionInfo}>
              <Text style={styles.retentionTitle}>TIẾN ĐỘ THUỘC TỪ VỰNG</Text>
              <Text style={styles.retentionText}>
                {retentionRatePct === 100
                  ? "Xuất sắc! Bạn đã thuộc 100% vốn từ hiện tại"
                  : `Bạn đã ghi nhớ thuộc ${retentionRatePct}% tổng từ vựng`}
              </Text>
            </View>
            <StatusBadge variant="learned" label={`${retentionRatePct}%`} />
          </View>
          <ProgressBar progress={retentionRatePct} color={theme.colors.primary} />
        </DuolingoCard>

        {/* 2x2 Stats Grid */}
        <View style={styles.grid2}>
          <View style={styles.gridCard}>
            <DuolingoCard accessibilityLabel="Chuỗi học liên tục">
              <Icon name="zap" size={24} color={theme.colors.secondary} />
              <Text style={styles.statNumber}>{userProgress.streakDays} Ngày</Text>
              <Text style={styles.statLabel}>Chuỗi Học Liên Tục</Text>
            </DuolingoCard>
          </View>

          <View style={styles.gridCard}>
            <DuolingoCard accessibilityLabel="Số từ đã ghi nhớ">
              <Icon name="check" size={24} color={theme.colors.primary} />
              <Text style={styles.statNumber}>{learnedCount} từ</Text>
              <Text style={styles.statLabel}>Đã Ghi Nhớ Thuộc</Text>
            </DuolingoCard>
          </View>

          <View style={styles.gridCard}>
            <DuolingoCard accessibilityLabel="Số từ cần ôn tập">
              <Icon name="clock" size={24} color={theme.colors.secondary} />
              <Text style={styles.statNumber}>{dueCount} từ</Text>
              <Text style={styles.statLabel}>Cần Ôn Tập Ngay</Text>
            </DuolingoCard>
          </View>

          <View style={styles.gridCard}>
            <DuolingoCard accessibilityLabel="Số từ mới chưa học">
              <Icon name="sparkles" size={24} color={theme.colors.info} />
              <Text style={styles.statNumber}>{newCardsCount} từ</Text>
              <Text style={styles.statLabel}>Từ Mới Chưa Học</Text>
            </DuolingoCard>
          </View>
        </View>

        {/* 7-Day Review Activity Chart */}
        <DuolingoCard accessibilityLabel="Biểu đồ lượt học 7 ngày gần đây">
          <Text style={styles.chartTitle}>HOẠT ĐỘNG 7 NGÀY GẦN ĐÂY</Text>
          <View style={styles.chartContainer}>
            {logs.map((log) => {
              const heightPercent = (log.count / maxCount) * 100;
              const dayLabel = log.date.slice(5);

              return (
                <View key={log.date} style={styles.chartBarCol}>
                  <Text style={styles.barCount}>{log.count > 0 ? log.count : ""}</Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: `${Math.max(8, heightPercent)}%`,
                          backgroundColor: log.count > 0 ? theme.colors.primary : theme.colors.cardBorder,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barDay}>{dayLabel}</Text>
                </View>
              );
            })}
          </View>
        </DuolingoCard>

        {/* Badges Gallery */}
        <View style={styles.badgesWrapper}>
          <BadgesGallery streakCount={userProgress.streakDays} learnedCards={learnedCount} />
        </View>
      </ScrollView>

      {/* Modal Change Password */}
      {showChangePassModal && (
        <Modal visible={showChangePassModal} animationType="fade" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Thay Đổi Mật Khẩu</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.formLabel}>Mật khẩu hiện tại *</Text>
                <TextInput
                  style={styles.inputText}
                  secureTextEntry
                  placeholder="••••••••"
                  placeholderTextColor={theme.colors.textLight}
                  value={oldPass}
                  onChangeText={setOldPass}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.formLabel}>Mật khẩu mới * (Tối thiểu 6 ký tự)</Text>
                <TextInput
                  style={styles.inputText}
                  secureTextEntry
                  placeholder="••••••••"
                  placeholderTextColor={theme.colors.textLight}
                  value={newPass}
                  onChangeText={setNewPass}
                />
              </View>

              {changePassError && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{changePassError}</Text>
                </View>
              )}

              {changePassSuccess && (
                <View style={styles.successBox}>
                  <Text style={styles.successText}>Đổi mật khẩu thành công!</Text>
                </View>
              )}

              <View style={styles.modalBtnRow}>
                <DuolingoButton
                  title="HỦY"
                  variant="secondary"
                  onPress={() => setShowChangePassModal(false)}
                />
                <DuolingoButton
                  title="LƯU MẬT KHẨU MỚI"
                  variant="primary"
                  onPress={handleChangePassword}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: 100,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  pageTitle: {
    fontSize: theme.fontSize.title,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  profileRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  profileEmail: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  profileBtnWrapper: {
    marginTop: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  changePassBtn: {
    alignItems: "center",
    paddingVertical: theme.spacing.xs,
  },
  changePassText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.lg,
  },
  modalBox: {
    backgroundColor: theme.colors.bg,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    width: "100%",
    maxWidth: 420,
    ...theme.shadows.lg,
  },
  modalTitle: {
    fontSize: theme.fontSize.title,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
  },
  inputGroup: {
    marginBottom: theme.spacing.md,
  },
  formLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  inputText: {
    backgroundColor: theme.colors.cardBg,
    borderColor: theme.colors.cardBorder,
    borderWidth: 2,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.base,
    color: theme.colors.textPrimary,
  },
  errorBox: {
    backgroundColor: theme.badges.due.bg,
    borderColor: theme.colors.danger,
    borderWidth: 1,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
  },
  successBox: {
    backgroundColor: theme.badges.learned.bg,
    borderColor: theme.colors.primary,
    borderWidth: 1,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  successText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
  },
  modalBtnRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  sectionMargin: {
    marginBottom: theme.spacing.lg,
  },
  notifHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  notifTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    flex: 1,
  },
  notifTextCol: {
    flex: 1,
  },
  notifTitle: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  notifSubtitle: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.cardBorder,
  },
  timeLabel: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textSecondary,
  },
  timeBtn: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.cardBg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  timeBtnActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  timeText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textSecondary,
  },
  timeTextActive: {
    color: theme.colors.white,
  },
  bannerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  levelHeader: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  levelBadge: {
    backgroundColor: theme.colors.secondary,
    paddingVertical: 2,
    paddingHorizontal: theme.spacing.xs,
    borderRadius: theme.radius.sm,
  },
  levelBadgeText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
  },
  levelTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  levelSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  xpText: {
    marginTop: 4,
    color: theme.colors.secondary,
    fontWeight: theme.fontWeight.bold,
    fontSize: theme.fontSize.sm,
  },
  retentionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  retentionInfo: {
    flex: 1,
  },
  retentionTitle: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  retentionText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  grid2: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
    marginVertical: theme.spacing.lg,
  },
  gridCard: {
    width: "47%",
  },
  statNumber: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
  },
  chartTitle: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
  },
  chartContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 120,
  },
  chartBarCol: {
    alignItems: "center",
    width: "12%",
    height: "100%",
    justifyContent: "flex-end",
  },
  barCount: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  barTrack: {
    width: "100%",
    height: "80%",
    justifyContent: "flex-end",
  },
  barFill: {
    width: "100%",
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  barDay: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  badgesWrapper: {
    marginTop: theme.spacing.lg,
  },
});
