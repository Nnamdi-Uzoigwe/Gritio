import { AppText } from "@/components/ui/AppText";
import { FOCUS_AREAS } from "@/lib/focusAreas";
import { useTheme } from "@/theme/ThemeProvider";
import { focusAreaTints, radii, spacing } from "@/theme/tokens";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import {
    GOAL_TEMPLATES,
    templateStepCount,
    type GoalTemplate,
} from "../templates";

type Props = {
  selectedId: string | null;
  onSelect: (template: GoalTemplate) => void;
};

export function TemplatePicker({ selectedId, onSelect }: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.wrap}>
      <AppText variant="caption" tone="muted">
        START FROM A TEMPLATE (OPTIONAL)
      </AppText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.strip}
      >
        {GOAL_TEMPLATES.map((template) => {
          const selected = template.id === selectedId;
          const tint = focusAreaTints[template.category];
          const icon =
            FOCUS_AREAS.find((a) => a.id === template.category)?.icon ??
            "sparkles-outline";
          return (
            <Pressable
              key={template.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`Template: ${template.title}`}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                onSelect(template);
              }}
              style={[
                styles.card,
                {
                  backgroundColor: selected
                    ? colors.primarySoft
                    : colors.surface,
                  borderColor: selected ? colors.primary : colors.border,
                },
              ]}
            >
              <View style={[styles.icon, { backgroundColor: `${tint}22` }]}>
                <Ionicons name={icon} size={18} color={tint} />
              </View>
              <AppText variant="label" numberOfLines={2}>
                {template.title}
              </AppText>
              <AppText variant="caption" tone="muted">
                {`${template.milestones.length} milestones, ${templateStepCount(template)} steps`}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm, marginHorizontal: -spacing.xl },
  strip: { gap: spacing.sm, paddingHorizontal: spacing.xl },
  card: {
    width: 190,
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    gap: spacing.sm,
  },
  icon: {
    width: 34,
    height: 34,
    borderRadius: radii.sm,
    alignItems: "center",
    justifyContent: "center",
  },
});
