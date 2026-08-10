export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  isGuest: boolean;
}

const AUTH_STORAGE_KEY = "@anki_auth_user_v1";

class AuthService {
  private currentUser: UserProfile | null = null;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadPersistedUser();
  }

  private loadPersistedUser() {
    if (typeof localStorage !== "undefined") {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (raw) {
        try {
          this.currentUser = JSON.parse(raw);
        } catch {
          this.currentUser = null;
        }
      }
    }
    // Default to Guest if no session exists yet
    if (!this.currentUser) {
      this.currentUser = {
        uid: "guest_user",
        email: "guest@anki.app",
        displayName: "Học Viên Khách",
        isGuest: true,
      };
    }
  }

  private persistUser() {
    if (typeof localStorage !== "undefined" && this.currentUser) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(this.currentUser));
    }
  }

  public getCurrentUser(): UserProfile {
    if (!this.currentUser) {
      this.currentUser = {
        uid: "guest_user",
        email: "guest@anki.app",
        displayName: "Học Viên Khách",
        isGuest: true,
      };
    }
    return this.currentUser;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public async login(email: string, _pass: string): Promise<UserProfile> {
    const user: UserProfile = {
      uid: `user_${Date.now()}`,
      email,
      displayName: email.split("@")[0] || "Học Viên Anki",
      isGuest: false,
    };
    this.currentUser = user;
    this.persistUser();
    this.notify();
    return user;
  }

  public async register(email: string, _pass: string): Promise<UserProfile> {
    const user: UserProfile = {
      uid: `user_${Date.now()}`,
      email,
      displayName: email.split("@")[0] || "Học Viên Mới",
      isGuest: false,
    };
    this.currentUser = user;
    this.persistUser();
    this.notify();
    return user;
  }

  public async loginAsGuest(): Promise<UserProfile> {
    const guestUser: UserProfile = {
      uid: "guest_user",
      email: "guest@anki.app",
      displayName: "Học Viên Khách",
      isGuest: true,
    };
    this.currentUser = guestUser;
    this.persistUser();
    this.notify();
    return guestUser;
  }

  public async resetPassword(email: string): Promise<boolean> {
    if (!email || !email.includes("@")) {
      throw new Error("Email không hợp lệ.");
    }
    // Simulated password reset email trigger
    return true;
  }

  public async changePassword(oldPass: string, newPass: string): Promise<boolean> {
    if (!oldPass || !newPass || newPass.length < 6) {
      throw new Error("Mật khẩu mới phải từ 6 ký tự trở lên.");
    }
    // Simulated password update trigger
    return true;
  }

  public async logout(): Promise<void> {
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
    this.currentUser = {
      uid: "guest_user",
      email: "guest@anki.app",
      displayName: "Học Viên Khách",
      isGuest: true,
    };
    this.notify();
  }
}

export const authService = new AuthService();
