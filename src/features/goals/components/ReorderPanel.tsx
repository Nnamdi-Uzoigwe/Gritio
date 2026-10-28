import { AppText } from "@/components/ui/AppText";
import { DraggableList } from "@/components/ui/DraggableList";
import { useTheme } from "@/theme/ThemeProvider";
import { radii, spacing } from "@/theme/tokens";
import type { GoalPlanView, StepItem } from "@/types/steps";
import React from "react";
import { StyleSheet, View } from "react-native";

const ROW_HEIGHT = 60;

type Props = {
  plan: GoalPlanView;
  onReorderMilestones: (ids: string[]) => void;
  onReorderSteps: (ids: string[]) => void;
  onDragStateChange: (dragging: boolean) => void;
};

function ReorderRow({
  title,
  handle,
}: {
  title: string;
  handle: React.ReactNode;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.outer}>
      <View
        style={[
          styles.row,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <AppText variant="titleM" numberOfLines={1} style={styles.title}>
          {title}
        </AppText>
        {handle}
      </View>
    </View>
  );
}

export function ReorderPanel({
  plan,
  onReorderMilestones,
  onReorderSteps,
  onDragStateChange,
}: Props) {
  const stepLists = plan.milestones.filter((m) => m.steps.length > 1);
  const hasMilestoneOrder = plan.milestones.length > 1;
  const hasLoose = plan.looseSteps.length > 1;
  const nothing = !hasMilestoneOrder && stepLists.length === 0 && !hasLoose;

  const stepBlock = (label: string, steps: StepItem[]) => (
    <View style={styles.block} key={label}>
      <AppText variant="caption" tone="muted" numberOfLines={1}>
        {label}
      </AppText>
      <DraggableList
        items={steps}
        keyOf={(s) => s.id}
        rowHeight={ROW_HEIGHT}
        onDragStateChange={onDragStateChange}
        onReorder={(next) => onReorderSteps(next.map((s) => s.id))}
        renderRow={(s, handle) => (
          <ReorderRow title={s.title} handle={handle} />
        )}
      />
    </View>
  );

  return (
    <View style={styles.wrap}>
      <AppText tone="secondary">
        Press and hold the handle, then drag. Tap Done when you have finished.
      </AppText>

      {nothing ? (
        <AppText tone="muted">
          Nothing to reorder yet. Add at least two items first.
        </AppText>
      ) : null}

      {hasMilestoneOrder ? (
        <View style={styles.block}>
          <AppText variant="caption" tone="muted">
            MILESTONES
          </AppText>
          <DraggableList
            items={plan.milestones}
            keyOf={(m) => m.id}
            rowHeight={ROW_HEIGHT}
            onDragStateChange={onDragStateChange}
            onReorder={(next) => onReorderMilestones(next.map((m) => m.id))}
            renderRow={(m, handle) => (
              <ReorderRow title={m.title} handle={handle} />
            )}
          />
        </View>
      ) : null}

      {stepLists.map((m) =>
        stepBlock(`STEPS IN ${m.title.toUpperCase()}`, m.steps),
      )}
      {hasLoose
        ? stepBlock(
            plan.milestones.length > 0 ? "OTHER STEPS" : "STEPS",
            plan.looseSteps,
          )
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xl },
  block: { gap: spacing.sm },
  outer: { flex: 1, paddingVertical: 4 },
  row: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: spacing.lg,
    paddingRight: spacing.xs,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  title: { flex: 1 },
});
