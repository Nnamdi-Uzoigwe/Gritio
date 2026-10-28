import { AppText } from "@/components/ui/AppText";
import { Chip } from "@/components/ui/Chip";
import {
    ALL_DAYS,
    WEEKDAYS_ONLY,
    WEEKDAY_LETTER,
    WEEKDAY_LONG,
    WEEKENDS,
    WEEK_ORDER,
    sameDays,
} from "@/lib/habitDays";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";
import * as Haptics from "expo-haptics";
import { Pressable, StyleSheet, View } from "react-native";

type Props = { value: number[]; onChange: (days: number[]) => void };

export function DaySelector({ value, onChange }: Props) {
  const { colors } = useTheme();

  const toggle = (day: number) => {
    Haptics.selectionAsync().catch(() => {});
    onChange(
      value.includes(day) ? value.filter((d) => d !== day) : [...value, day],
    );
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.presets}>
        <Chip
          label="Every day"
          selected={sameDays(value, ALL_DAYS)}
          onPress={() => onChange(ALL_DAYS)}
        />
        <Chip
          label="Weekdays"
          selected={sameDays(value, WEEKDAYS_ONLY)}
          onPress={() => onChange(WEEKDAYS_ONLY)}
        />
        <Chip
          label="Weekends"
          selected={sameDays(value, WEEKENDS)}
          onPress={() => onChange(WEEKENDS)}
        />
      </View>

      <View style={styles.days}>
        {WEEK_ORDER.map((day) => {
          const selected = value.includes(day);
          return (
            <Pressable
              key={day}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={WEEKDAY_LONG[day]}
              onPress={() => toggle(day)}
              style={[
                styles.day,
                {
                  backgroundColor: selected ? colors.primary : colors.surface,
                  borderColor: selected ? colors.primary : colors.border,
                },
              ]}
            >
              <AppText
                variant="label"
                tone={selected ? "onPrimary" : "secondary"}
              >
                {WEEKDAY_LETTER[day]}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {value.length === 0 ? (
        <AppText variant="bodySmall" tone="error">
          Choose at least one day.
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  presets: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  days: { flexDirection: "row", justifyContent: "space-between" },
  day: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
});
