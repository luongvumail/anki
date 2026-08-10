import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { runMigrations } from "./infrastructure/persistence/migrationRunner.js";
import { ErrorBoundary } from "./ui/components/ErrorBoundary.js";
import { Icon } from "./ui/components/Icon.js";
import { AuthScreen } from "./ui/screens/AuthScreen.js";
import { CardDetailScreen } from "./ui/screens/CardDetailScreen.js";
import { DeckDetailScreen } from "./ui/screens/DeckDetailScreen.js";
import { DecksScreen } from "./ui/screens/DecksScreen.js";
import { HomeScreen } from "./ui/screens/HomeScreen.js";
import { PracticeScreen } from "./ui/screens/PracticeScreen.js";
import { StatsScreen } from "./ui/screens/StatsScreen.js";
import { StudyScreen } from "./ui/screens/StudyScreen.js";
import { theme } from "./ui/theme/theme.js";

export type ScreenTab =
  | "HOME"
  | "DECKS"
  | "DECK_DETAIL"
  | "CARD_DETAIL"
  | "PRACTICE"
  | "STATS"
  | "STUDY"
  | "AUTH";

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<ScreenTab>("HOME");
  const [activeDeckId, setActiveDeckId] = useState<string>("deck_hsk1");
  const [activeCardId, setActiveCardId] = useState<string>("");

  useEffect(() => {
    runMigrations();
  }, []);

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

  return (
    <ErrorBoundary>
      <View style={styles.appContainer}>
        {/* Dynamic Screen Content */}
        <View style={styles.mainContent}>
          {currentTab === "AUTH" && (
            <AuthScreen onAuthSuccess={() => setCurrentTab("HOME")} />
          )}
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
          {currentTab === "STATS" && (
            <StatsScreen onLogout={() => setCurrentTab("AUTH")} />
          )}
          {currentTab === "STUDY" && (
            <StudyScreen deckId={activeDeckId} onFinish={() => setCurrentTab("HOME")} />
          )}
        </View>

        {/* Bottom Navigation Bar */}
        {currentTab !== "STUDY" &&
          currentTab !== "DECK_DETAIL" &&
          currentTab !== "CARD_DETAIL" &&
          currentTab !== "AUTH" && (
            <View accessibilityLabel="Điều hướng chính" style={styles.bottomNav}>
              <Pressable
                onPress={() => setCurrentTab("HOME")}
                style={styles.navItem}
              >
                <Icon
                  name="home"
                  color={currentTab === "HOME" ? theme.colors.primary : theme.colors.textSecondary}
                />
                <Text
                  style={[
                    styles.navLabel,
                    currentTab === "HOME" && styles.navLabelActive,
                  ]}
                >
                  Trang Chủ
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setCurrentTab("DECKS")}
                style={styles.navItem}
              >
                <Icon
                  name="decks"
                  color={currentTab === "DECKS" ? theme.colors.primary : theme.colors.textSecondary}
                />
                <Text
                  style={[
                    styles.navLabel,
                    currentTab === "DECKS" && styles.navLabelActive,
                  ]}
                >
                  Bộ Thẻ
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setCurrentTab("PRACTICE")}
                style={styles.navItem}
              >
                <Icon
                  name="gamepad"
                  color={currentTab === "PRACTICE" ? theme.colors.primary : theme.colors.textSecondary}
                />
                <Text
                  style={[
                    styles.navLabel,
                    currentTab === "PRACTICE" && styles.navLabelActive,
                  ]}
                >
                  Luyện Tập
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setCurrentTab("STATS")}
                style={styles.navItem}
              >
                <Icon
                  name="stats"
                  color={currentTab === "STATS" ? theme.colors.primary : theme.colors.textSecondary}
                />
                <Text
                  style={[
                    styles.navLabel,
                    currentTab === "STATS" && styles.navLabelActive,
                  ]}
                >
                  Thống Kê
                </Text>
              </Pressable>
            </View>
          )}
      </View>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  mainContent: {
    flex: 1,
  },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.white,
    borderTopWidth: 2,
    borderTopColor: theme.colors.cardBorder,
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: theme.spacing.md,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  navLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.regular,
  },
  navLabelActive: {
    color: theme.colors.primary,
    fontWeight: theme.fontWeight.bold,
  },
});

export default App;
