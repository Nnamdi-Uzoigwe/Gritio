import { addDays, nextMonday } from "@/lib/dates";
import { spacing } from "@/theme/tokens";
import { StyleSheet, View } from "react-native";
import { Chip } from "./Chip";
import { MonthCalendar } from "./MonthCalendar";

export type DateShortcut = { label: string; date: string };

type Props = {
  value: string | null;
  today: string;
  minDate?: string;
  shortcuts?: DateShortcut[];
  onSelect: (date: string) => void;
};

export function DatePickerPanel({
  value,
  today,
  minDate,
  shortcuts,
  onSelect,
}: Props) {
  const min = minDate ?? today;
  const options: DateShortcut[] = shortcuts ?? [
    { label: "Today", date: today },
    { label: "Tomorrow", date: addDays(today, 1) },
    { label: "Next Monday", date: nextMonday(today) },
  ];

  return (
    <View style={styles.wrap}>
      <View style={styles.chips}>
        {options
          .filter((o) => o.date >= min)
          .map((o) => (
            <Chip
              key={o.label}
              label={o.label}
              selected={value === o.date}
              onPress={() => onSelect(o.date)}
            />
          ))}
      </View>
      <MonthCalendar value={value} minDate={min} onSelect={onSelect} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.lg },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
});
