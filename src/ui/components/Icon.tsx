import React from "react";
import { MaterialIcons } from "@expo/vector-icons";

export type IconName =
  | "home" | "decks" | "gamepad" | "stats" | "flame" | "zap"
  | "sparkles" | "refresh" | "book" | "timer" | "trophy" | "wrench"
  | "celebrate" | "brain" | "puzzle" | "check" | "trash" | "clock"
  | "audio" | "layers" | "search" | "close" | "volume" | "mic" | "plus" | "back" | "arrow-down";

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

// Map app icon names → MaterialIcons names
const ICON_MAP: Record<IconName, keyof typeof MaterialIcons.glyphMap> = {
  home: "home",
  decks: "library-books",
  gamepad: "sports-esports",
  stats: "bar-chart",
  flame: "local-fire-department",
  zap: "bolt",
  sparkles: "auto-awesome",
  refresh: "refresh",
  book: "menu-book",
  timer: "timer",
  clock: "access-time",
  trophy: "emoji-events",
  wrench: "build",
  celebrate: "celebration",
  brain: "psychology",
  puzzle: "extension",
  check: "check",
  trash: "delete",
  audio: "volume-up",
  layers: "layers",
  search: "search",
  close: "close",
  volume: "volume-up",
  mic: "mic",
  plus: "add",
  back: "arrow-back",
  "arrow-down": "keyboard-arrow-down",
};

export const Icon: React.FC<IconProps> = ({ name, size = 20, color = "#000000" }) => (
  <MaterialIcons name={ICON_MAP[name]} size={size} color={color} />
);
