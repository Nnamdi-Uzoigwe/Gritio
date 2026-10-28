import { AppTabBar } from "@/components/navigation/AppTabBar";
import { Tabs } from "expo-router";

export const unstable_settings = { initialRouteName: "today" };

export default function TabsLayout() {
  return (
    <Tabs
      initialRouteName="today"
      screenOptions={{ headerShown: false }}
      tabBar={({ state, navigation }) => (
        <AppTabBar
          activeIndex={state.index}
          routes={state.routes.map((r) => ({ key: r.key, name: r.name }))}
          onPress={(route, focused) => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented)
              navigation.navigate(route.name);
          }}
        />
      )}
    >
      <Tabs.Screen name="today" />
      <Tabs.Screen name="goals" />
      <Tabs.Screen name="habits" />
      <Tabs.Screen name="progress" />
    </Tabs>
  );
}
