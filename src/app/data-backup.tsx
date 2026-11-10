import { AppText } from "@/components/ui/AppText";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { getSetting, setSetting } from "@/db/repositories/settings";
import {
  collectBackup,
  countStored,
  type StoredCounts,
} from "@/features/backup/collect";
import {
  BackupFileError,
  pickBackupText,
  shareBackupFile,
  writeBackupFile,
} from "@/features/backup/files";
import type { BackupFile } from "@/features/backup/format";
import { restoreBackup } from "@/features/backup/restore";
import { validateBackup, type BackupSummary } from "@/features/backup/validate";
import { reconcileNow } from "@/features/notifications/service";
import { useOnboardingStore } from "@/features/onboarding/store";
import { formatLongDate, toDateKey } from "@/lib/dates";
import { formatTime12 } from "@/lib/time";
import { useTheme } from "@/theme/ThemeProvider";
import { radii, spacing } from "@/theme/tokens";
import type { ThemeMode } from "@/types/domain";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

type Problem = { title: string; lines: string[] };
type Pending = { backup: BackupFile; summary: BackupSummary };

const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;

function describeMoment(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${formatLongDate(toDateKey(d))}, ${formatTime12(`${pad(d.getHours())}:${pad(d.getMinutes())}`)}`;
}

function summaryLines(s: BackupSummary): string[] {
  const lines: string[] = [];
  if (s.goals > 0)
    lines.push(`${plural(s.goals, "goal", "goals")}, ${s.activeGoals} active`);
  if (s.milestones > 0 || s.steps > 0)
    lines.push(
      `${plural(s.milestones, "milestone", "milestones")} and ${plural(s.steps, "step", "steps")}`,
    );
  if (s.habits > 0)
    lines.push(
      `${plural(s.habits, "habit", "habits")}, ${s.activeHabits} active, with ${plural(s.completions, "completion", "completions")}`,
    );
  if (s.tasks > 0) lines.push(plural(s.tasks, "task", "tasks"));
  if (s.reflections > 0)
    lines.push(plural(s.reflections, "reflection", "reflections"));
  if (s.reviews > 0)
    lines.push(plural(s.reviews, "weekly review", "weekly reviews"));
  if (s.rules > 0)
    lines.push(plural(s.rules, "personal rule", "personal rules"));
  if (lines.length === 0)
    lines.push("No goals, habits or tasks. Only your preferences.");
  return lines;
}

function isThemeMode(value: unknown): value is ThemeMode {
  return value === "light" || value === "dark" || value === "system";
}

export default function DataBackupScreen() {
  const { colors, setMode } = useTheme();
  const router = useRouter();
  const [counts, setCounts] = useState<StoredCounts | null>(null);
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [picking, setPicking] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [stored, last] = await Promise.all([
        countStored(),
        getSetting("last_backup_at"),
      ]);
      setCounts(stored);
      setLastBackup(last);
    } catch (error) {
      console.warn("Could not load backup status", error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const exportBackup = async (): Promise<boolean> => {
    setExporting(true);
    setProblem(null);
    setNotice(null);
    try {
      const backup = await collectBackup();
      // The file is checked before it is written, so a backup that could not be restored is never created.
      const check = validateBackup(backup);
      if (!check.ok) {
        setProblem({
          title: "Could not create a valid backup",
          lines: check.errors,
        });
        return false;
      }
      const uri = writeBackupFile(backup);
      // The file exists now. We never claim it is "backed up", because only you know where you saved it.
      const now = new Date().toISOString();
      await setSetting("last_backup_at", now);
      setLastBackup(now);
      setNotice(
        "Backup file created. Choose where to keep it in the next screen.",
      );
      await shareBackupFile(uri);
      return true;
    } catch (error) {
      console.warn("Backup failed", error);
      setProblem({
        title: "Could not create the backup",
        lines: [
          error instanceof BackupFileError
            ? error.message
            : "Something went wrong. Your data has not been changed.",
        ],
      });
      return false;
    } finally {
      setExporting(false);
    }
  };

  const chooseFile = async () => {
    setPicking(true);
    setProblem(null);
    setNotice(null);
    try {
      const text = await pickBackupText();
      if (text === null) return;

      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        setProblem({
          title: "Not a backup file",
          lines: ["This file could not be read as a Gritio backup."],
        });
        return;
      }

      const result = validateBackup(parsed);
      if (!result.ok) {
        setProblem({
          title:
            result.kind === "newer"
              ? "This backup is from a newer version"
              : "This backup can not be restored",
          lines: [...result.errors, "Nothing on this phone was changed."],
        });
        return;
      }
      setPending({ backup: result.backup, summary: result.summary });
      setSheetOpen(true);
    } catch (error) {
      console.warn("Could not read backup file", error);
      setProblem({
        title: "Could not open the file",
        lines: [
          error instanceof BackupFileError
            ? error.message
            : "Something went wrong while reading the file.",
        ],
      });
    } finally {
      setPicking(false);
    }
  };

  const backupFirst = async () => {
    // Let the sheet close before the system share sheet opens.
    setSheetOpen(false);
    await new Promise((resolve) => setTimeout(resolve, 350));
    await exportBackup();
    setSheetOpen(true);
  };

  const confirmRestore = async () => {
    if (!pending) return;
    const { backup, summary } = pending;
    setRestoring(true);
    try {
      await restoreBackup(backup);
    } catch (error) {
      console.warn("Restore failed", error);
      setRestoring(false);
      setSheetOpen(false);
      setPending(null);
      Alert.alert(
        "Restore failed",
        "Nothing was changed. Your data on this phone is exactly as it was.",
      );
      return;
    }

    // Refresh everything that was held in memory, then rebuild reminders from the restored data.
    useOnboardingStore.getState().reset();
    const themeRow = backup.data.settings.find(
      (row) => row.key === "theme_mode",
    );
    setMode(isThemeMode(themeRow?.value) ? themeRow.value : "light");

    let note = "";
    try {
      const result = await reconcileNow();
      if (summary.hasReminders && result.permission !== "granted") {
        note =
          "\n\nYour backup has reminders switched on, but notifications are not allowed on this phone. You can allow them in Settings, under Reminders.";
      }
    } catch (error) {
      console.warn("Could not rebuild reminders", error);
    }

    setSheetOpen(false);
    setPending(null);
    setRestoring(false);
    await load();
    Alert.alert(
      "Restore complete",
      `Your data from ${describeMoment(summary.exportedAt)} is now on this phone.${note}`,
      [{ text: "Go to Today", onPress: () => router.replace("/today") }],
    );
  };

  const busy = exporting || picking || restoring;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Data and backup" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <AppText tone="secondary">
          Everything you create in Gritio lives on this phone. There is no
          account and nothing is uploaded. A backup file is how you keep a copy,
          or move to a new phone.
        </AppText>

        {counts ? (
          <View
            style={[
              styles.card,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <AppText variant="caption" tone="muted">
              ON THIS PHONE
            </AppText>
            <AppText variant="titleM">
              {`${plural(counts.goals, "goal", "goals")}, ${plural(counts.habits, "habit", "habits")}, ${plural(counts.tasks, "task", "tasks")}`}
            </AppText>
            <AppText variant="bodySmall" tone="secondary">
              {`${plural(counts.completions, "habit completion", "habit completions")} and ${plural(counts.reflections, "reflection", "reflections")}`}
            </AppText>
          </View>
        ) : (
          <ActivityIndicator color={colors.primary} />
        )}

        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.cardTop}>
            <Ionicons
              name="download-outline"
              size={22}
              color={colors.primaryText}
            />
            <AppText variant="titleM" style={styles.flex}>
              Create a backup
            </AppText>
          </View>
          <AppText variant="bodySmall" tone="secondary">
            Makes one file with all your goals, habits, tasks, reflections,
            rules and preferences. You choose where to save it.
          </AppText>
          <AppText variant="bodySmall" tone="muted">
            {lastBackup
              ? `Last backup file created: ${describeMoment(lastBackup)}`
              : "No backup file has been created yet."}
          </AppText>
          <Button
            label="Create backup"
            onPress={exportBackup}
            loading={exporting}
            disabled={busy && !exporting}
          />
        </View>

        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.cardTop}>
            <Ionicons
              name="push-outline"
              size={22}
              color={colors.primaryText}
            />
            <AppText variant="titleM" style={styles.flex}>
              Restore from a backup
            </AppText>
          </View>
          <AppText variant="bodySmall" tone="secondary">
            Choose a Gritio backup file. You will see what is inside before
            anything changes. Restoring replaces what is on this phone, it does
            not merge.
          </AppText>
          <Button
            label="Choose a backup file"
            variant="secondary"
            onPress={chooseFile}
            loading={picking}
            disabled={busy && !picking}
          />
        </View>

        {notice ? (
          <View style={[styles.note, { backgroundColor: colors.successSoft }]}>
            <AppText variant="bodySmall">{notice}</AppText>
          </View>
        ) : null}

        {problem ? (
          <View
            style={[styles.note, { backgroundColor: colors.warningSoft }]}
            accessibilityRole="alert"
          >
            <AppText variant="titleM">{problem.title}</AppText>
            {problem.lines.map((line) => (
              <AppText key={line} variant="bodySmall">
                {line}
              </AppText>
            ))}
          </View>
        ) : null}

        <View style={styles.good}>
          <AppText variant="caption" tone="muted">
            GOOD TO KNOW
          </AppText>
          <AppText variant="bodySmall" tone="secondary">
            A backup file is not encrypted. Anyone who has it can read it, so
            keep it somewhere safe and private.
          </AppText>
          <AppText variant="bodySmall" tone="secondary">
            <AppText variant="bodySmall" tone="secondary">
              This creates a backup file on your device. It is not automatic
              cloud sync. If your phone is lost, Gritio is removed, or its data
              is cleared, any information not included in a backup cannot be
              restored.
            </AppText>
          </AppText>
          <AppText variant="bodySmall" tone="secondary">
            Reminders are rebuilt from your restored data and need notifications
            to be allowed on the phone you restore to.
          </AppText>
        </View>
      </ScrollView>

      <BottomSheet
        visible={sheetOpen && pending !== null}
        onClose={() => {
          if (restoring) return;
          setSheetOpen(false);
          setPending(null);
        }}
        title="Restore this backup?"
      >
        {pending ? (
          <View style={styles.sheet}>
            <AppText tone="secondary">
              {`Made ${describeMoment(pending.summary.exportedAt)} with Gritio ${pending.summary.appVersion}.`}
            </AppText>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: colors.surfaceSunken,
                  borderColor: colors.border,
                },
              ]}
            >
              <AppText variant="caption" tone="muted">
                INSIDE THE BACKUP
              </AppText>
              {summaryLines(pending.summary).map((line) => (
                <AppText key={line} variant="body">
                  {line}
                </AppText>
              ))}
            </View>
            <View
              style={[styles.note, { backgroundColor: colors.warningSoft }]}
            >
              <AppText variant="bodySmall">
                Restoring replaces everything on this phone: goals, habits,
                tasks, reflections, rules and preferences. It does not merge,
                and it cannot be undone.
              </AppText>
            </View>
            <Button
              label="Back up my current data first"
              variant="secondary"
              onPress={backupFirst}
              disabled={restoring}
            />
            <Button
              label="Replace my data"
              onPress={confirmRestore}
              loading={restoring}
            />
            <Button
              label="Cancel"
              variant="ghost"
              disabled={restoring}
              onPress={() => {
                setSheetOpen(false);
                setPending(null);
              }}
            />
          </View>
        ) : (
          <View />
        )}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  card: {
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  note: { padding: spacing.lg, borderRadius: radii.md, gap: spacing.xs },
  good: { gap: spacing.sm },
  sheet: { gap: spacing.md },
});
