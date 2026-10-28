import type { FocusAreaId } from "@/types/domain";
import type { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";

export type IconName = ComponentProps<typeof Ionicons>["name"];

export const FOCUS_AREAS: ReadonlyArray<{
  id: FocusAreaId;
  label: string;
  icon: IconName;
}> = [
  {
    id: "discipline",
    label: "Personal discipline",
    icon: "shield-checkmark-outline",
  },
  { id: "health", label: "Health and fitness", icon: "fitness-outline" },
  { id: "learning", label: "Learning and education", icon: "school-outline" },
  { id: "career", label: "Career development", icon: "briefcase-outline" },
  { id: "productivity", label: "Productivity", icon: "flash-outline" },
  { id: "reading", label: "Reading", icon: "book-outline" },
  { id: "finance", label: "Financial habits", icon: "wallet-outline" },
  { id: "routines", label: "Personal routines", icon: "sunny-outline" },
  { id: "other", label: "Other goals", icon: "sparkles-outline" },
];
