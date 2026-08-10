import React, { useEffect, useState } from "react";
import { BackHandler, Modal, Pressable, SafeAreaView, StatusBar, StyleSheet, View } from "react-native";
import { runMigrations } from "./infrastructure/persistence/migrationRunner.js";
import { ErrorBoundary } from "./ui/components/ErrorBoundary.js";
import { GlobalHeader } from "./ui/components/GlobalHeader.js";
import { Icon } from "./ui/components/Icon.js";
import { AuthScreen } from "./ui/screens/AuthScreen.js";
import { CardDetailScreen } from "./ui/screens/CardDetailScreen.js";
import { DeckDetailScreen } from "./ui/screens/DeckDetailScreen.js";
import { DecksScreen } from "./ui/screens/DecksScreen.js";
import { HomeScreen } from "./ui/screens/HomeScreen.js";
import { PracticeScreen } from "./ui/screens/PracticeScreen.js";
import { ProfileScreen } from "./ui/screens/ProfileScreen.js";
import { StatsScreen } from "./ui/screens/StatsScreen.js";
import { StudyScreen } from "./ui/screens/StudyScreen.js";
import { authService } from "./infrastructure/auth/authService.js";
import { ThemeProvider, useTheme } from "./ui/theme/ThemeContext.js";

export type ScreenTab =
  | "HOME"
  | "DECKS"
  | "DECK_DETAIL"
  | "CARD_DETAIL"
  | "PRACTICE"
  | "STATS"
  | "STUDY"
  | "AUTH";

const AppContent: React.FC = () => {
  const { theme, isDark } = useTheme();
  const [currentTab, setCurrentTab] = useState<ScreenTab>(() => {
    const user = authService.getCurrentUser();
    return user && !user.isGuest ? "HOME" : "AUTH";
  });
  const [activeDeckId, setActiveDeckId] = useState<string>("");
  const [activeCardId, setActiveCardId] = useState<string>("");
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);

  useEffect(() => {
    runMigrations();
  }, []);

  useEffect(() => {
    const onBackPress = () => {
      if (isProfileOpen) {
        setIsProfileOpen(false);
        return true;
      }
      if (currentTab === "CARD_DETAIL") {
        setCurrentTab("DECK_DETAIL");
        return true;
      }
      if (currentTab === "DECK_DETAIL") {
        setCurrentTab("DECKS");
        return true;
      }
      if (currentTab === "STUDY") {
        setCurrentTab("HOME");
        return true;
      }
      if (currentTab === "DECKS" || currentTab === "PRACTICE" || currentTab === "STATS") {
        setCurrentTab("HOME");
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => subscription.remove();
  }, [currentTab, isProfileOpen]);

  const startStudy = (deckId: string) => {
    setActiveDeckId(deckId);
    setCurrentTab("STUDY");
  };

  const openDeckDetail = (deckId: string) => {
    setActiveDeckId(deckId);
    setCurrentTab("DECK_DETAIL");
  };

  const openCardDetail = (cardId: string) => {
    setActiveCardId(cardId);
    setCurrentTab("CARD_DETAIL");
  };

  const isMainOverview =
    currentTab === "HOME" ||
    currentTab === "DECKS" ||
    currentTab === "PRACTICE" ||
    currentTab === "STATS";

  return (
    <SafeAreaView style={[styles.appContainer, { backgroundColor: theme.colors.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Header ONLY shown on main overview screens */}
      {isMainOverview && (
        <GlobalHeader onOpenProfile={() => setIsProfileOpen(true)} />
      )}

      {/* Dynamic Screen Content */}
      <View style={styles.mainContent}>
        {currentTab === "AUTH" && <AuthScreen onAuthSuccess={() => setCurrentTab("HOME")} />}
        {currentTab === "HOME" && <HomeScreen onStartStudy={startStudy} />}
        {currentTab === "DECKS" && <DecksScreen onSelectDeck={openDeckDetail} />}
        {currentTab === "DECK_DETAIL" && (
          <DeckDetailScreen
            deckId={activeDeckId}
            onBack={() => setCurrentTab("DECKS")}
            onStartStudy={startStudy}
            onOpenCardDetail={openCardDetail}
          />
        )}
        {currentTab === "CARD_DETAIL" && (
          <CardDetailScreen
            cardId={activeCardId}
            deckId={activeDeckId}
            onBack={() => setCurrentTab("DECK_DETAIL")}
          />
        )}
        {currentTab === "PRACTICE" && <PracticeScreen />}
        {currentTab === "STATS" && <StatsScreen />}
        {currentTab === "STUDY" && (
          <StudyScreen deckId={activeDeckId} onFinish={() => setCurrentTab("HOME")} />
        )}
      </View>

      {/* Profile Modal (Exact slide-up animation like AI Add Card Modal) */}
      {isProfileOpen && (
        <Modal
          visible={isProfileOpen}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => setIsProfileOpen(false)}
        >
          <SafeAreaView style={[styles.appContainer, { backgroundColor: theme.colors.bg }]}>
            <ProfileScreen
              onClose={() => setIsProfileOpen(false)}
              onLogout={() => {
                setIsProfileOpen(false);
                setCurrentTab("AUTH");
              }}
            />
          </SafeAreaView>
        </Modal>
      )}

      {/* Bottom Navigation Bar (Icon only, no text, no layout shift, safe bottom spacing) */}
      {isMainOverview && (
        <View
          accessibilityLabel="Điều hướng chính"
          style={[
            styles.bottomNav,
            {
              backgroundColor: theme.colors.cardBg,
              borderTopColor: theme.colors.cardBorder || "rgba(0,0,0,0.06)",
            },
          ]}
        >
          {[
            { tab: "HOME", icon: "home", label: "Trang Chủ" },
            { tab: "DECKS", icon: "decks", label: "Bộ Thẻ" },
            { tab: "PRACTICE", icon: "gamepad", label: "Luyện Tập" },
            { tab: "STATS", icon: "stats", label: "Thống Kê" },
          ].map((item) => {
            const isActive = currentTab === item.tab;
            return (
              <Pressable
                key={item.tab}
                onPress={() => setCurrentTab(item.tab as ScreenTab)}
                style={styles.navItem}
                accessibilityLabel={item.label}
              >
                <View
                  style={[
                    styles.iconPill,
                    {
                      backgroundColor: isActive ? theme.badges.learned.bg : "transparent",
                    },
                  ]}
                >
                  <Icon
                    name={item.icon as any}
                    size={24}
                    color={isActive ? theme.colors.primary : theme.colors.textSecondary}
                  />
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </SafeAreaView>
  );
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
  },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 22,
    borderTopWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8,
  },
  navItem: {
    justifyContent: "center",
    alignItems: "center",
  },
  iconPill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default App;
