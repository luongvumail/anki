import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  computeDueCount,
  computeLearnedCount,
  computeNewCount,
} from "../../domain/card/cardUtils.js";
import { getLevelInfo } from "../../domain/user/userProgress.js";
import { authService, UserProfile } from "../../infrastructure/auth/authService.js";
import {
  notificationService,
  NotificationSettings,
} from "../../infrastructure/notifications/notificationService.js";
import {
  DailyReviewLog,
  reviewTrackerRepo,
} from "../../infrastructure/persistence/reviewTrackerRepo.js";
import { BadgesGallery } from "../components/BadgesGallery.js";
import { DuolingoButton } from "../components/DuolingoButton.js";
import { DuolingoCard } from "../components/DuolingoCard.js";
import { Icon } from "../components/Icon.js";
import { StatusBadge } from "../components/StatusBadge.js";
import { appStore } from "../store/useAppStore.js";
import { ThemeMode, useTheme } from "../theme/ThemeContext.js";

export interface ProfileScreenProps {
  onClose?: () => void;
  onLogout?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onClose, onLogout }) => {
  const { theme, themeMode, setThemeMode } = useTheme();
  const [logs, setLogs] = useState<DailyReviewLog[]>([]);
  const [storeState, setStoreState] = useState(appStore.getState());
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(authService.getCurrentUser());
  const [notifSettings, setNotifSettings] = useState<NotificationSettings>(
    notificationService.getSettings(),
  );
  const [customTimeInput, setCustomTimeInput] = useState<string>(notifSettings.reminderTime);

  const [showChangePassModal, setShowChangePassModal] = useState<boolean>(false);
  const [oldPass, setOldPass] = useState<string>("");
  const [newPass, setNewPass] = useState<string>("");
  const [changePassError, setChangePassError] = useState<string | null>(null);
  const [changePassSuccess, setChangePassSuccess] = useState<boolean>(false);

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

  const displayName = currentUser?.displayName || currentUser?.email?.split("@")[0] || "Học viên";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      {/* Top Navigation Bar for Profile */}
      <View style={[styles.topBar, { backgroundColor: theme.colors.cardBg }]}>
        <Text style={[styles.topBarTitle, { color: theme.colors.textPrimary }]}>
          Hồ Sơ & Cài Đặt
        </Text>
        {onClose && (
          <Pressable onPress={onClose} style={styles.closeBtn} accessibilityLabel="Đóng Hồ Sơ">
            <Icon name="close" size={24} color={theme.colors.textPrimary} />
          </Pressable>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Card */}
        <DuolingoCard accessibilityLabel="Thông tin tài khoản">
          <View style={styles.profileHeader}>
            <View style={[styles.bigAvatar, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.bigAvatarText}>{initial}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: theme.colors.textPrimary }]}>
                {displayName}
              </Text>
              <Text style={[styles.profileEmail, { color: theme.colors.textSecondary }]}>
                {currentUser?.email || "Chưa có email"}
              </Text>
              <View style={styles.badgeRow}>
                <StatusBadge
                  variant="info"
                  label={`Cấp ${levelInfo.level}: ${levelInfo.title}`}
                  size="sm"
                />
              </View>
            </View>
          </View>
        </DuolingoCard>

        {/* CÀI ĐẶT GIAO DIỆN & DARK MODE */}
        <View style={styles.sectionMargin}>
          <DuolingoCard accessibilityLabel="Cài đặt giao diện và Dark mode">
            <View style={styles.sectionHeader}>
              <Icon name="sparkles" size={24} color={theme.colors.secondary} />
              <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>
                GIAO DIỆN & DARK MODE
              </Text>
            </View>

            <View style={styles.themeOptionsRow}>
              {[
                { mode: "system" as ThemeMode, label: "Tự động (OS)" },
                { mode: "light" as ThemeMode, label: "Sáng ☀️" },
                { mode: "dark" as ThemeMode, label: "Tối 🌙" },
              ].map((item) => {
                const isActive = themeMode === item.mode;
                return (
                  <Pressable
                    key={item.mode}
                    onPress={() => setThemeMode(item.mode)}
                    style={[
                      styles.themeTab,
                      {
                        backgroundColor: isActive
                          ? theme.colors.primary
                          : theme.colors.cardBg,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.themeTabText,
                        {
                          color: isActive
                            ? theme.colors.white
                            : theme.colors.textSecondary,
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </DuolingoCard>
        </View>

        {/* NHẮC NHỞ HỌC HÀNG NGÀY */}
        <View style={styles.sectionMargin}>
          <DuolingoCard accessibilityLabel="Nhắc nhở học hàng ngày">
            <View style={styles.notifHeader}>
              <View style={styles.notifTitleRow}>
                <Icon name="clock" size={24} color={theme.colors.primary} />
                <View style={styles.notifTextCol}>
                  <Text style={[styles.notifTitle, { color: theme.colors.textPrimary }]}>
                    THÔNG BÁO HỌC HÀNG NGÀY
                  </Text>
                  <Text style={[styles.notifSubtitle, { color: theme.colors.textSecondary }]}>
                    {notifSettings.enabled
                      ? `Đang bật: Nhắc học vào ${notifSettings.reminderTime} hàng ngày`
                      : "Đã tắt thông báo nhắc nhở"}
                  </Text>
                </View>
              </View>
              <Switch
                value={notifSettings.enabled}
                onValueChange={handleToggleNotification}
                trackColor={{ false: theme.colors.textLight, true: theme.colors.primary }}
              />
            </View>

            {notifSettings.enabled && (
              <View style={styles.timeSection}>
                <View style={styles.timeRow}>
                  <Text style={[styles.timeLabel, { color: theme.colors.textSecondary }]}>
                    Giờ nhắc:
                  </Text>
                  {["08:00", "12:00", "20:00"].map((t) => (
                    <Pressable
                      key={t}
                      onPress={() => {
                        handleSetReminderTime(t);
                        setCustomTimeInput(t);
                      }}
                      style={[
                        styles.timeBtn,
                        {
                          backgroundColor:
                            notifSettings.reminderTime === t
                              ? theme.colors.primary
                              : theme.colors.bg,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.timeText,
                          {
                            color:
                              notifSettings.reminderTime === t
                                ? theme.colors.white
                                : theme.colors.textPrimary,
                          },
                        ]}
                      >
                        {t}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <View style={styles.customTimeRow}>
                  <Text style={[styles.timeLabel, { color: theme.colors.textSecondary }]}>
                    Tùy chỉnh:
                  </Text>
                  <TextInput
                    style={[
                      styles.timeInput,
                      {
                        backgroundColor: theme.colors.bg,
                        color: theme.colors.textPrimary,
                      },
                    ]}
                    value={customTimeInput}
                    onChangeText={setCustomTimeInput}
                    placeholder="21:30"
                    placeholderTextColor={theme.colors.textLight}
                    maxLength={5}
                  />
                  <Pressable
                    style={[styles.applyTimeBtn, { backgroundColor: theme.colors.primary }]}
                    onPress={() => {
                      if (/^([01]?\d|2[0-3]):[0-5]\d$/.test(customTimeInput.trim())) {
                        handleSetReminderTime(customTimeInput.trim());
                      }
                    }}
                  >
                    <Text style={styles.applyTimeText}>ÁP DỤNG</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </DuolingoCard>
        </View>

        {/* Badges Gallery */}
        <View style={styles.sectionMargin}>
          <BadgesGallery streakCount={userProgress.streakDays} learnedCards={learnedCount} />
        </View>

        {/* Account Actions */}
        <View style={styles.actionsSection}>
          <DuolingoButton
            title="ĐỔI MẬT KHẨU"
            variant="secondary"
            onPress={() => setShowChangePassModal(true)}
          />
          <View style={{ height: 12 }} />
          <DuolingoButton title="ĐĂNG XUẤT TÀI KHOẢN" variant="danger" onPress={handleLogout} />
        </View>
      </ScrollView>

      {/* Full-Screen Change Password Modal */}
      {showChangePassModal && (
        <Modal visible={showChangePassModal} animationType="slide" presentationStyle="fullScreen">
          <View style={[styles.fullModalContainer, { backgroundColor: theme.colors.bg }]}>
            <View style={styles.fullModalHeader}>
              <Pressable
                onPress={() => setShowChangePassModal(false)}
                style={styles.closeBtn}
                accessibilityLabel="Đóng modal đổi mật khẩu"
              >
                <Icon name="close" size={24} color={theme.colors.textPrimary} />
              </Pressable>
              <Text style={[styles.fullModalTitle, { color: theme.colors.textPrimary }]}>
                Đổi Mật Khẩu
              </Text>
            </View>

            <ScrollView contentContainerStyle={styles.fullModalBody}>
              <View style={styles.inputGroup}>
                <Text style={[styles.formLabel, { color: theme.colors.textSecondary }]}>
                  Mật khẩu hiện tại *
                </Text>
                <TextInput
                  style={[
                    styles.inputText,
                    {
                      backgroundColor: theme.colors.cardBg,
                      color: theme.colors.textPrimary,
                    },
                  ]}
                  secureTextEntry
                  placeholder="••••••••"
                  placeholderTextColor={theme.colors.textLight}
                  value={oldPass}
                  onChangeText={setOldPass}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.formLabel, { color: theme.colors.textSecondary }]}>
                  Mật khẩu mới *
                </Text>
                <TextInput
                  style={[
                    styles.inputText,
                    {
                      backgroundColor: theme.colors.cardBg,
                      color: theme.colors.textPrimary,
                    },
                  ]}
                  secureTextEntry
                  placeholder="••••••••"
                  placeholderTextColor={theme.colors.textLight}
                  value={newPass}
                  onChangeText={setNewPass}
                />
              </View>

              {changePassError && (
                <View style={[styles.msgBox, { backgroundColor: theme.badges.due.bg }]}>
                  <Text style={[styles.errorMsgText, { color: theme.colors.danger }]}>
                    {changePassError}
                  </Text>
                </View>
              )}

              {changePassSuccess && (
                <View style={[styles.msgBox, { backgroundColor: theme.badges.learned.bg }]}>
                  <Text style={[styles.successMsgText, { color: theme.colors.primary }]}>
                    Đổi mật khẩu thành công!
                  </Text>
                </View>
              )}

              <View style={{ marginTop: 24 }}>
                <DuolingoButton
                  title="CẬP NHẬT MẬT KHẨU"
                  variant="primary"
                  onPress={handleChangePassword}
                />
              </View>
            </ScrollView>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  topBarTitle: {
    fontSize: 20,
    fontWeight: "800",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  bigAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  bigAvatarText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "700",
  },
  profileEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  badgeRow: {
    marginTop: 6,
    flexDirection: "row",
  },
  sectionMargin: {
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  themeOptionsRow: {
    flexDirection: "row",
    gap: 8,
  },
  themeTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  themeTabText: {
    fontSize: 12,
    fontWeight: "700",
  },
  notifHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  notifTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  notifTextCol: {
    flex: 1,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  notifSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  timeSection: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(150,150,150,0.15)",
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
  timeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  timeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  customTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timeInput: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    width: 70,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "700",
  },
  applyTimeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  applyTimeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  grid2: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 16,
  },
  gridCard: {
    width: "48%",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  actionsSection: {
    marginTop: 24,
  },
  fullModalContainer: {
    flex: 1,
  },
  fullModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  closeBtn: {
    padding: 4,
  },
  fullModalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  fullModalBody: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
  },
  inputText: {
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  msgBox: {
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  errorMsgText: {
    fontSize: 13,
    fontWeight: "600",
  },
  successMsgText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
