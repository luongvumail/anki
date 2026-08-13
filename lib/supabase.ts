import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";

// Complete web browser session if returning from OAuth redirect
WebBrowser.maybeCompleteAuthSession();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === "web",
  },
});

/**
 * Initiates Google OAuth login via WebBrowser session.
 */
export async function signInWithGoogle() {
  const redirectUrl = Linking.createURL("auth/callback", { scheme: "anki" });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectUrl,
      skipBrowserRedirect: true,
      queryParams: {
        prompt: "select_account",
      },
    },
  });

  if (error) throw error;
  if (!data?.url) throw new Error("Không thể khởi tạo phiên đăng nhập Google");

  const res = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

  if (res.type === "success" && res.url) {
    // Parse refresh token & access token from URL hash if provided
    const urlParts = res.url.split("#");
    if (urlParts.length > 1) {
      const params = new URLSearchParams(urlParts[1]);
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");

      if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (sessionError) throw sessionError;
      }
    }
  }
}

export default supabase;
