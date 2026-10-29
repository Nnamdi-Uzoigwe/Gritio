import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { spacing } from "@/theme/tokens";
import { StyleSheet, View } from "react-native";

type Props = {
  visible: boolean;
  archived: boolean;
  onClose: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
};

export function HabitActionsSheet({
  visible,
  archived,
  onClose,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
}: Props) {
  const act = (fn: () => void) => () => {
    onClose();
    fn();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Habit actions">
      <View style={styles.body}>
        <Button label="Edit habit" variant="secondary" onPress={act(onEdit)} />
        {archived ? (
          <Button label="Restore habit" onPress={act(onRestore)} />
        ) : (
          <Button
            label="Archive habit"
            variant="secondary"
            onPress={act(onArchive)}
          />
        )}
        <Button label="Delete" variant="ghost" onPress={act(onDelete)} />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({ body: { gap: spacing.sm } });
