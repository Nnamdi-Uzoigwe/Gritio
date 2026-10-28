import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { spacing } from "@/theme/tokens";
import type { GoalStatus } from "@/types/domain";
import { StyleSheet, View } from "react-native";

type Props = {
  visible: boolean;
  status: GoalStatus;
  onClose: () => void;
  onEdit: () => void;
  onComplete: () => void;
  onReopen: () => void;
  onRestore: () => void;
  onArchive: () => void;
  onDelete: () => void;
};

export function GoalActionsSheet({
  visible,
  status,
  onClose,
  onEdit,
  onComplete,
  onReopen,
  onRestore,
  onArchive,
  onDelete,
}: Props) {
  const act = (fn: () => void) => () => {
    onClose();
    fn();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Goal actions">
      <View style={styles.body}>
        {status === "active" ? (
          <Button label="Mark complete" onPress={act(onComplete)} />
        ) : null}
        {status === "completed" ? (
          <Button label="Reopen goal" onPress={act(onReopen)} />
        ) : null}
        {status === "archived" ? (
          <Button label="Restore goal" onPress={act(onRestore)} />
        ) : null}
        <Button
          label="Edit goal details"
          variant="secondary"
          onPress={act(onEdit)}
        />
        {status !== "archived" ? (
          <Button
            label="Archive"
            variant="secondary"
            onPress={act(onArchive)}
          />
        ) : null}
        <Button label="Delete" variant="ghost" onPress={act(onDelete)} />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({ body: { gap: spacing.sm } });
