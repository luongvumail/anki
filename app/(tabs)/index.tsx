import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../../lib/firebase";
import { getAuthErrorMessage } from "../../lib/errorHandler";
import {
  getReminderSettings,
  scheduleDailyStudyReminder,
  cancelDailyStudyReminder,
} from "../../lib/notificationService";
import { getStreakCount } from "../../lib/reviewTracker";
import { useStore } from "../../store/useStore";
import { Colors, Spacing } from "../../constants/theme";
import { AccountModal } from "../../components/home/AccountModal";
import { DuolingoButton } from "../../components/ui/DuolingoButton";
import { DuolingoCard } from "../../components/ui/DuolingoCard";
import { DuolingoHeader } from "../../components/ui/DuolingoHeader";
import { ZigZagSkillPath } from "../../components/home/ZigZagSkillPath";
import { FloatingAddButton } from "../../components/ui/FloatingAddButton";
import { AIAddCardModal } from "../../components/add/AIAddCardModal";
import { Deck } from "../../store/slices/types";
import { computeDueCount } from "../../lib/deckUtils";

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const decks = useStore((s) => s.decks);
  const fetchDecks = useStore((s) => s.fetchDecks);
  const isLoading = useStore((s) => s.isLoading);
  const cardsState = useStore((s) => s.cards);
  const [refreshing, setRefreshing] = useState(false);
  const [streakCount, setStreakCount] = useState(0);

  // Account Settings Modal States
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showAIAddModal, setShowAIAddModal] = useState(false);

  // Daily Study Reminder States
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderHour, setReminderHour] = useState(20);
  const [reminderMinute, setReminderMinute] = useState(0);

  const user = auth.currentUser;
  const displayName = user?.displayName || user?.email?.split("@")[0] || "Học viên";

  // Calculate due cards map for all decks
  const dueCardsMap = useMemo(() => {
    const map: Record<string, number> = {};
    decks.forEach((d) => {
      const deckCards = cardsState[d.id] || [];
      map[d.id] = deckCards.length > 0 ? computeDueCount(deckCards) : d.dueCount || 0;
    });
    return map;
  }, [decks, cardsState]);

  useEffect(() => {
    getReminderSettings().then((res) => {
      setReminderEnabled(res.enabled);
      setReminderHour(res.hour);
      setReminderMinute(res.minute);
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      getStreakCount().then(setStreakCount);
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDecks();
    setRefreshing(false);
  };

  const handleReminderToggle = async (value: boolean) => {
    setReminderEnabled(value);

    if (value) {
      const success = await scheduleDailyStudyReminder(reminderHour, reminderMinute);
      if (!success) {
        setReminderEnabled(false);
      }
    } else {
      await cancelDailyStudyReminder();
    }
  };

  const handleSignOut = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất tài khoản?", [
      { text: "Hủy", style: "cancel" },
      {
        text: "Đăng xuất",
        style: "destructive",
        onPress: async () => {
          setShowAccountModal(false);
          await auth.signOut();
          useStore.setState({ decks: [], cards: {}, session: null, userId: null });
        },
      },
    ]);
  };

  const handleChangePassword = async (currentPassword: string, newPassword: string) => {
    if (!user || !user.email) return;
    if (!newPassword || newPassword.length < 6) {
      Alert.alert("Thông báo", "Mật khẩu mới cần ít nhất 6 ký tự");
      return;
    }

    try {
      if (currentPassword) {
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
      }
      await updatePassword(user, newPassword);
      Alert.alert("Thành công", "Mật khẩu của bạn đã được cập nhật thành công!");
    } catch (e: any) {
      Alert.alert("Đổi mật khẩu thất bại", getAuthErrorMessage(e));
      throw e;
    }
  };

  const handleSendResetEmail = async () => {
    if (!user || !user.email) return;
    try {
      await sendPasswordResetEmail(auth, user.email);
      Alert.alert("Thành công", `Đã gửi hướng dẫn khôi phục tới ${user.email}`);
    } catch (e: any) {
      Alert.alert("Gửi mail thất bại", getAuthErrorMessage(e));
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Bar with Personalized User Greeting */}
      <DuolingoHeader streakCount={streakCount} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 80, 100) },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.duolingo.green}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {isLoading && decks.length === 0 ? (
          <ActivityIndicator
            size="small"
            color={Colors.duolingo.green}
            style={{ marginVertical: 40 }}
          />
        ) : decks.length === 0 ? (
          <DuolingoCard style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Chưa có bộ thẻ nào!</Text>
            <Text style={styles.emptySub}>Hãy tạo bộ thẻ mới hoặc dùng AI để nạp từ vựng.</Text>
            <DuolingoButton
              title="TẠO BỘ THẺ MỚI"
              icon={<Ionicons name="add-circle" size={20} color="#FFFFFF" />}
              variant="primary"
              onPress={() => router.push("/(tabs)/decks")}
              style={{ marginTop: Spacing.md }}
            />
          </DuolingoCard>
        ) : (
          /* REAL DECKS ZIGZAG SKILL PATH (1 NODE = 1 DECK) */
          <ZigZagSkillPath
            decks={decks}
            dueCardsMap={dueCardsMap}
            onSelectDeck={(deck: Deck) => {
              const due = dueCardsMap[deck.id] || 0;
              if (due > 0) {
                router.push(`/study/${deck.id}`);
              } else {
                router.push(`/deck/${deck.id}`);
              }
            }}
          />
        )}
      </ScrollView>

      {/* Floating Action Button (FAB) to AI Add Cards */}
      <FloatingAddButton onPress={() => setShowAIAddModal(true)} />

      {/* AI Add Card Full Overlay Modal */}
      {showAIAddModal && (
        <AIAddCardModal
          visible={showAIAddModal}
          onClose={() => setShowAIAddModal(false)}
        />
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.duolingo.bg,
  },
  scrollContent: {
    paddingHorizontal: Spacing.pageMargin,
    paddingTop: Spacing.md,
  },

  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    marginTop: Spacing.xl,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  emptySub: {
    fontSize: 13,
    color: Colors.duolingo.textMuted,
    marginTop: 4,
    textAlign: "center",
  },
});
