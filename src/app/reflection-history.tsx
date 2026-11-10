// import { AppText } from "@/components/ui/AppText";
// import { Button } from "@/components/ui/Button";
// import { ScreenHeader } from "@/components/ui/ScreenHeader";
// import { SwipeableRow } from "@/components/ui/SwipeableRow";
// import {
//     deleteReflection,
//     listReflections,
//     type Reflection,
// } from "@/db/repositories/reflections";
// import {
//     firstAnswer,
//     REFLECTION_PROMPTS,
// } from "@/features/reflections/prompts";
// import { formatShortDate, fromDateKey, monthLabel } from "@/lib/dates";
// import { useTheme } from "@/theme/ThemeProvider";
// import { radii, spacing } from "@/theme/tokens";
// import { Ionicons } from "@expo/vector-icons";
// import { useFocusEffect, useRouter } from "expo-router";
// import { useCallback, useMemo, useState } from "react";
// import {
//     ActivityIndicator,
//     Alert,
//     Pressable,
//     ScrollView,
//     StyleSheet,
//     View,
// } from "react-native";

// type Group = { label: string; items: Reflection[] };

// function groupByMonth(list: Reflection[]): Group[] {
//   const groups: Group[] = [];
//   for (const item of list) {
//     const d = fromDateKey(item.date);
//     const label = monthLabel(d.getFullYear(), d.getMonth());
//     const last = groups[groups.length - 1];
//     if (last && last.label === label) last.items.push(item);
//     else groups.push({ label, items: [item] });
//   }
//   return groups;
// }

// export default function ReflectionHistoryScreen() {
//   const { colors } = useTheme();
//   const router = useRouter();
//   const [items, setItems] = useState<Reflection[] | null>(null);
//   const [failed, setFailed] = useState(false);

//   const load = useCallback(async () => {
//     try {
//       setFailed(false);
//       setItems(await listReflections());
//     } catch (error) {
//       console.warn("Could not load reflections", error);
//       setFailed(true);
//       setItems((prev) => prev ?? []);
//     }
//   }, []);

//   useFocusEffect(
//     useCallback(() => {
//       load();
//     }, [load]),
//   );

//   const groups = useMemo(() => groupByMonth(items ?? []), [items]);

//   const confirmDelete = (item: Reflection) => {
//     Alert.alert("Delete this reflection?", "This cannot be undone.", [
//       { text: "Cancel", style: "cancel" },
//       {
//         text: "Delete",
//         style: "destructive",
//         onPress: async () => {
//           setItems((prev) => prev?.filter((r) => r.date !== item.date) ?? prev);
//           try {
//             await deleteReflection(item.date);
//           } catch (error) {
//             console.warn("Could not delete reflection", error);
//             Alert.alert("Something went wrong", "Please try again.");
//             load();
//           }
//         },
//       },
//     ]);
//   };

//   return (
//     <View style={[styles.root, { backgroundColor: colors.background }]}>
//       <ScreenHeader title="Reflections" />
//       <ScrollView
//         contentContainerStyle={styles.content}
//         showsVerticalScrollIndicator={false}
//       >
//         {items === null ? (
//           <ActivityIndicator color={colors.primary} style={styles.loader} />
//         ) : null}

//         {failed && items !== null && items.length === 0 ? (
//           <View style={styles.empty}>
//             <AppText variant="titleM">Could not load your reflections</AppText>
//             <Button label="Try again" onPress={load} />
//           </View>
//         ) : null}

//         {items !== null && items.length === 0 && !failed ? (
//           <View style={styles.empty}>
//             <View
//               style={[
//                 styles.emptyIcon,
//                 { backgroundColor: colors.primarySoft },
//               ]}
//             >
//               <Ionicons
//                 name="moon-outline"
//                 size={28}
//                 color={colors.primaryText}
//               />
//             </View>
//             <AppText variant="displayM" style={styles.center}>
//               No reflections yet
//             </AppText>
//             <AppText tone="secondary" style={styles.center}>
//               Whenever you like, take a minute to look back on your day. There
//               is no schedule to keep.
//             </AppText>
//             <Button
//               label="Reflect on today"
//               onPress={() => router.push("/reflection")}
//               style={styles.emptyButton}
//             />
//           </View>
//         ) : null}

//         {groups.map((group) => (
//           <View key={group.label} style={styles.group}>
//             <AppText variant="caption" tone="muted">
//               {group.label.toUpperCase()}
//             </AppText>
//             {group.items.map((item) => {
//               const answer = firstAnswer(item.values);
//               return (
//                 <SwipeableRow
//                   key={item.date}
//                   postponeLabel="Delete"
//                   postponeIcon="trash-outline"
//                   postponeTone="warning"
//                   onPostpone={() => confirmDelete(item)}
//                 >
//                   <Pressable
//                     accessibilityRole="button"
//                     accessibilityLabel={`Reflection for ${formatShortDate(item.date)}. Tap to view or edit. Swipe left to delete.`}
//                     onPress={() => router.push(`/reflection?date=${item.date}`)}
//                     style={styles.row}
//                   >
//                     <AppText variant="titleM">
//                       {formatShortDate(item.date)}
//                     </AppText>
//                     {answer ? (
//                       <>
//                         <AppText variant="caption" tone="accent">
//                           {REFLECTION_PROMPTS[answer.key].short.toUpperCase()}
//                         </AppText>
//                         <AppText tone="secondary" numberOfLines={2}>
//                           {answer.text}
//                         </AppText>
//                       </>
//                     ) : null}
//                   </Pressable>
//                 </SwipeableRow>
//               );
//             })}
//           </View>
//         ))}
//       </ScrollView>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   root: { flex: 1 },
//   content: {
//     paddingHorizontal: spacing.xl,
//     paddingBottom: spacing.xxxl,
//     gap: spacing.xl,
//   },
//   loader: { marginTop: spacing.xxxl },
//   empty: { alignItems: "center", gap: spacing.md, paddingTop: spacing.xxxl },
//   emptyIcon: {
//     width: 64,
//     height: 64,
//     borderRadius: 32,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   emptyButton: { alignSelf: "stretch", marginTop: spacing.md },
//   center: { textAlign: "center" },
//   group: { gap: spacing.sm },
//   row: { padding: spacing.lg, gap: spacing.xs, borderRadius: radii.lg },
// });

import { AppText } from "@/components/ui/AppText";
import { Button } from "@/components/ui/Button";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { SwipeableRow } from "@/components/ui/SwipeableRow";
import {
  deleteReflection,
  listReflections,
  type Reflection,
} from "@/db/repositories/reflections";
import {
  firstAnswer,
  REFLECTION_PROMPTS,
} from "@/features/reflections/prompts";
import { formatShortDate, fromDateKey, monthLabel } from "@/lib/dates";
import { useTheme } from "@/theme/ThemeProvider";
import { radii, spacing } from "@/theme/tokens";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SectionList,
  StyleSheet,
  View,
} from "react-native";

type Section = { title: string; data: Reflection[] };

function groupByMonth(list: Reflection[]): Section[] {
  const sections: Section[] = [];
  for (const item of list) {
    const d = fromDateKey(item.date);
    const title = monthLabel(d.getFullYear(), d.getMonth());
    const last = sections[sections.length - 1];
    if (last && last.title === title) last.data.push(item);
    else sections.push({ title, data: [item] });
  }
  return sections;
}

export default function ReflectionHistoryScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [items, setItems] = useState<Reflection[] | null>(null);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      setFailed(false);
      setItems(await listReflections());
    } catch (error) {
      console.warn("Could not load reflections", error);
      setFailed(true);
      setItems((prev) => prev ?? []);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const sections = useMemo(() => groupByMonth(items ?? []), [items]);

  const confirmDelete = (item: Reflection) => {
    Alert.alert("Delete this reflection?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setItems((prev) => prev?.filter((r) => r.date !== item.date) ?? prev);
          try {
            await deleteReflection(item.date);
          } catch (error) {
            console.warn("Could not delete reflection", error);
            Alert.alert("Something went wrong", "Please try again.");
            load();
          }
        },
      },
    ]);
  };

  const hasItems = items !== null && items.length > 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Reflections" />

      {items === null ? (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      ) : null}

      {failed && items !== null && items.length === 0 ? (
        <View style={styles.empty}>
          <AppText variant="titleM">Could not load your reflections</AppText>
          <Button label="Try again" onPress={load} />
        </View>
      ) : null}

      {items !== null && items.length === 0 && !failed ? (
        <View style={styles.empty}>
          <View
            style={[styles.emptyIcon, { backgroundColor: colors.primarySoft }]}
          >
            <Ionicons
              name="moon-outline"
              size={28}
              color={colors.primaryText}
            />
          </View>
          <AppText variant="displayM" style={styles.center}>
            No reflections yet
          </AppText>
          <AppText tone="secondary" style={styles.center}>
            Whenever you like, take a minute to look back on your day. There is
            no schedule to keep.
          </AppText>
          <Button
            label="Reflect on today"
            onPress={() => router.push("/reflection")}
            style={styles.emptyButton}
          />
        </View>
      ) : null}

      {hasItems ? (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.date}
          stickySectionHeadersEnabled={false}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={Separator}
          renderSectionHeader={({ section }) => (
            <AppText
              variant="caption"
              tone="muted"
              style={styles.sectionHeader}
            >
              {section.title.toUpperCase()}
            </AppText>
          )}
          renderItem={({ item }) => {
            const answer = firstAnswer(item.values);
            return (
              <SwipeableRow
                postponeLabel="Delete"
                postponeIcon="trash-outline"
                postponeTone="warning"
                onPostpone={() => confirmDelete(item)}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Reflection for ${formatShortDate(item.date)}. Tap to view or edit. Swipe left to delete.`}
                  onPress={() => router.push(`/reflection?date=${item.date}`)}
                  style={styles.row}
                >
                  <AppText variant="titleM">
                    {formatShortDate(item.date)}
                  </AppText>
                  {answer ? (
                    <>
                      <AppText variant="caption" tone="accent">
                        {REFLECTION_PROMPTS[answer.key].short.toUpperCase()}
                      </AppText>
                      <AppText tone="secondary" numberOfLines={2}>
                        {answer.text}
                      </AppText>
                    </>
                  ) : null}
                </Pressable>
              </SwipeableRow>
            );
          }}
        />
      ) : null}
    </View>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  list: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  loader: { marginTop: spacing.xxxl },
  empty: {
    alignItems: "center",
    gap: spacing.md,
    paddingTop: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyButton: { alignSelf: "stretch", marginTop: spacing.md },
  center: { textAlign: "center" },
  sectionHeader: { paddingTop: spacing.xl, paddingBottom: spacing.sm },
  separator: { height: spacing.sm },
  row: { padding: spacing.lg, gap: spacing.xs, borderRadius: radii.lg },
});
