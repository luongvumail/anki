import React, { Component, ErrorInfo, ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { theme } from "../theme/theme.js";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Đã xảy ra lỗi giao diện!</Text>
          <Text style={styles.subtitle}>
            {this.state.error?.message || "Ứng dụng gặp sự cố không mong muốn."}
          </Text>
          <Pressable onPress={this.handleReload} style={styles.button}>
            <Text style={styles.buttonText}>THỬ LẠI</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.hero,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.danger,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginBottom: theme.spacing.xl,
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radius.lg,
  },
  buttonText: {
    color: theme.colors.white,
    fontWeight: theme.fontWeight.bold,
  },
});
