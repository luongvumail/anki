import { describe, expect, it } from "vitest";
import { ALL_BADGES, getLevelInfo } from "../userProgress";

describe("userProgress", () => {
  it("calculates level info for 0 XP", () => {
    const info = getLevelInfo(0);
    expect(info.level).toBe(1);
    expect(info.titleVi).toBe("Người mới bắt đầu");
    expect(info.progress).toBe(0);
  });

  it("calculates level info for 550 XP (Level 6)", () => {
    const info = getLevelInfo(550);
    expect(info.level).toBe(6);
    expect(info.titleVi).toBe("Học viên Nhận chữ");
    expect(info.progress).toBe(0.5);
  });

  it("calculates level info for high XP (8500 XP)", () => {
    const info = getLevelInfo(8500);
    expect(info.level).toBe(86);
    expect(info.titleVi).toBe("Tông sư Hán tự");
  });

  it("contains default badges array", () => {
    expect(ALL_BADGES.length).toBeGreaterThan(0);
    expect(ALL_BADGES.find((b) => b.id === "streak_3")).toBeDefined();
  });
});
