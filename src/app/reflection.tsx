import { AppText } from "@/components/ui/AppText";
import { AppTextInput } from "@/components/ui/AppTextInput";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { HeaderIconButton } from "@/components/ui/HeaderIconButton";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { getReflection, saveReflection } from "@/db/repositories/reflections";
import {
    EMPTY_REFLECTION,
    REFLECTION_KEYS,
    REFLECTION_PROMPTS,
    type ReflectionValues,
} from "@/features/reflections/prompts";
import {
    addDays,
    describeDate,
    formatLongDate,
    isValidDateKey,
    toDateKey,
} from "@/lib/dates";
import { ValidationError } from "@/lib/validation";
import { useTheme } from "@/theme/ThemeProvider";
import { spacing } from "@/theme/tokens";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    View,
} from "react-native";

export default function ReflectionScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string }>();
  const today = toDateKey();
  const yesterday = addDays(today, -1);
  const paramDate = Array.isArray(params.date) ? params.date[0] : params.date;
  const startDate =
    paramDate && isValidDateKey(paramDate) && paramDate <= today
      ? paramDate
      : today;

  const [date, setDate] = useState(startDate);
  const [values, setValues] = useState<ReflectionValues>(EMPTY_REFLECTION);
  const [saved, setSaved] = useState<ReflectionValues>(EMPTY_REFLECTION);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = REFLECTION_KEYS.some((k) => values[k] !== saved[k]);
  const isToday = date === today;

  // Refs so the unmount save always sees the latest text.
  const valuesRef = useRef(values);
  const dirtyRef = useRef(dirty);
  const dateRef = useRef(date);
  valuesRef.current = values;
  dirtyRef.current = dirty;
  dateRef.current = date;

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getReflection(date)
      .then((reflection) => {
        if (!active) return;
        const next = reflection ? reflection.values : EMPTY_REFLECTION;
        setValues(next);
        setSaved(next);
        setLoading(false);
      })
      .catch((e) => {
        console.warn("Could not load reflection", e);
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [date]);

  // Whatever you wrote is kept when you leave, so nothing is lost by going back.
  useEffect(
    () => () => {
      if (dirtyRef.current) {
        saveReflection(dateRef.current, valuesRef.current).catch((e) =>
          console.warn("Could not save reflection", e),
        );
      }
    },
    [],
  );

  const leave = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/today");
  };

  const switchDate = async (next: string) => {
    if (next === date) return;
    if (dirty) {
      try {
        await saveReflection(date, values);
      } catch (e) {
        console.warn("Could not save before switching", e);
        Alert.alert(
          "Could not save",
          "Please try again before switching days.",
        );
        return;
      }
    }
    setDate(next);
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await saveReflection(date, values);
      dirtyRef.current = false;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => {},
      );
      leave();
    } catch (e) {
      if (e instanceof ValidationError) setError(e.message);
      else {
        console.warn("Could not save reflection", e);
        setError("Could not save. Please try again.");
      }
      setSaving(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Reflection"
        right={
          <HeaderIconButton
            icon="albums-outline"
            label="Reflection history"
            onPress={() => router.push("/reflection-history")}
          />
        }
      />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.intro}>
            <AppText variant="displayM">{formatLongDate(date)}</AppText>
            <AppText tone="secondary">
              A few honest words are enough. Skip anything you like.
            </AppText>
            <View style={styles.chips}>
              <Chip
                label="Today"
                selected={date === today}
                onPress={() => switchDate(today)}
              />
              <Chip
                label="Yesterday"
                selected={date === yesterday}
                onPress={() => switchDate(yesterday)}
              />
              {date !== today && date !== yesterday ? (
                <Chip label={describeDate(date, today)} selected />
              ) : null}
            </View>
          </View>

          {loading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : null}

          {!loading
            ? REFLECTION_KEYS.map((key) => (
                <View key={key} style={styles.field}>
                  <AppText variant="titleM">
                    {isToday
                      ? REFLECTION_PROMPTS[key].today
                      : REFLECTION_PROMPTS[key].other}
                  </AppText>
                  <AppTextInput
                    value={values[key]}
                    onChangeText={(text) =>
                      setValues((prev) => ({ ...prev, [key]: text }))
                    }
                    placeholder={REFLECTION_PROMPTS[key].placeholder}
                    multiline
                    maxLength={1000}
                    style={styles.input}
                    accessibilityLabel={REFLECTION_PROMPTS[key].today}
                  />
                </View>
              ))
            : null}

          <AppText variant="bodySmall" tone="muted">
            Private and stored only on this device. It is saved automatically
            when you leave.
          </AppText>
        </ScrollView>

        <View
          style={[
            styles.footer,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
            },
          ]}
        >
          {error ? (
            <AppText variant="bodySmall" tone="error" accessibilityRole="alert">
              {error}
            </AppText>
          ) : null}
          <Button
            label="Save reflection"
            onPress={save}
            loading={saving}
            disabled={loading}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    gap: spacing.xl,
  },
  intro: { gap: spacing.sm },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  loader: { marginTop: spacing.xl },
  field: { gap: spacing.xs },
  input: { minHeight: 88, maxHeight: 220 },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
    borderTopWidth: 1,
  },
});
