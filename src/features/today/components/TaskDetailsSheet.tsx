import { AppText } from "@/components/ui/AppText";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { formatTime12 } from "@/lib/time";
import { spacing } from "@/theme/tokens";
import type { Commitment } from "@/types/today";
import { useRef } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { sourceMeta } from "../sourceMeta";

type Props = {
  item: Commitment | null;
  onClose: () => void;
  onToggle: (item: Commitment) => void;
  onReschedule: (item: Commitment) => void;
  onEdit: (item: Commitment) => void;
  onDelete: (item: Commitment) => void;
};

export function TaskDetailsSheet({
  item,
  onClose,
  onToggle,
  onReschedule,
  onEdit,
  onDelete,
}: Props) {
  // Keep the last item so content does not vanish while the sheet slides away.
  const last = useRef<Commitment | null>(item);
  if (item) last.current = item;
  const shown = item ?? last.current;
  if (!shown) return null;

  const meta = sourceMeta(shown);
  const isTask = shown.source === "task";
  const canMove = shown.source !== "habit";

  const confirmDelete = () => {
    Alert.alert("Delete this task?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => onDelete(shown) },
    ]);
  };

  return (
    <BottomSheet visible={item !== null} onClose={onClose}>
      <View style={styles.body}>
        <AppText variant="displayM">{shown.title}</AppText>
        <View style={styles.chips}>
          <Chip label={meta.label} icon={meta.icon} />
          {shown.time ? (
            <Chip label={formatTime12(shown.time)} icon="time-outline" />
          ) : null}
          {shown.done ? (
            <Chip label="Completed" icon="checkmark-circle-outline" />
          ) : null}
        </View>
        {shown.description ? (
          <AppText tone="secondary">{shown.description}</AppText>
        ) : (
          <AppText tone="muted" variant="bodySmall">
            No extra details.
          </AppText>
        )}

        <Button
          label={shown.done ? "Mark as not done" : "Mark complete"}
          variant={shown.done ? "secondary" : "primary"}
          onPress={() => onToggle(shown)}
        />
        {canMove ? (
          <Button
            label="Move to another day"
            variant="secondary"
            onPress={() => onReschedule(shown)}
          />
        ) : null}
        {isTask ? (
          <View style={styles.row}>
            <Button
              label="Edit"
              variant="ghost"
              onPress={() => onEdit(shown)}
              style={styles.flex}
            />
            <Button
              label="Delete"
              variant="ghost"
              onPress={confirmDelete}
              style={styles.flex}
            />
          </View>
        ) : null}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.md },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  row: { flexDirection: "row", gap: spacing.sm },
  flex: { flex: 1 },
});
