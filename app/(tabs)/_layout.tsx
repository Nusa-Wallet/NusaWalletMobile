import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { isTutorialComplete, TutorialOverlay } from "@/components/TutorialOverlay";
import { colors } from "@/theme/colors";
import { scale } from "@/utils/responsive";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

const TABS = [
  { name: "index",    label: "Beranda",  icon: "home",      iconOut: "home-outline"      },
  { name: "wallet",   label: "Dompet",   icon: "card",      iconOut: "card-outline"      },
  { name: "receive",  label: "Terima",   icon: "download",  iconOut: "download-outline"  },
  { name: "insights", label: "Insights", icon: "bar-chart", iconOut: "bar-chart-outline" },
  { name: "profile",  label: "Profil",   icon: "person",    iconOut: "person-outline" },
] as const;

export default function TabsLayout() {
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 8);
  const receiveTabSize = scale(58, screenWidth);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    isTutorialComplete().then((done) => {
      if (!done) setShowTutorial(true);
    });
  }, []);

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: true,
          tabBarStyle: [
            s.tabBar,
            { height: 64 + bottomPadding, paddingBottom: bottomPadding },
          ],
          tabBarItemStyle: s.tabItem,
          tabBarLabelStyle: s.label,
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textSecondary,
        }}
      >
        {TABS.map(({ name, label, icon, iconOut }) => {
          const isReceive = name === "receive";
          return (
            <Tabs.Screen
              key={name}
              name={name}
              options={{
                tabBarIcon: ({ focused }) => (
                  <View style={isReceive ? [s.receiveTab, { width: receiveTabSize, height: receiveTabSize, borderRadius: receiveTabSize / 2 }] : [s.tab, focused && s.tabActive]}>
                    <Ionicons
                      name={(focused ? icon : iconOut) as IconName}
                      size={isReceive ? 28 : 22}
                      color={isReceive ? "#fff" : focused ? colors.accent : colors.textSecondary}
                    />
                  </View>
                ),
                tabBarLabel: isReceive ? () => null : label,
                tabBarItemStyle: [s.tabItem, isReceive && s.receiveTabItem],
              }}
            />
          );
        })}
      </Tabs>
      {showTutorial && (
        <TutorialOverlay onComplete={() => setShowTutorial(false)} />
      )}
    </>
  );
}

const s = StyleSheet.create({
  tabBar: {
    paddingTop: 8,
    overflow: "visible",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: "#fff",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  tabItem: { minWidth: 0, paddingHorizontal: 0, paddingVertical: 2 },
  tab: {
    alignItems: "center", justifyContent: "center", gap: 3,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, minWidth: 52,
  },
  tabActive: {},
  receiveTabItem: { overflow: "visible" },
  receiveTab: {
    width: 58, height: 58, borderRadius: 29,
    alignItems: "center", justifyContent: "center",
    backgroundColor: colors.accent,
    borderWidth: 4, borderColor: "#fff",
    transform: [{ translateY: -6 }],
    elevation: 10,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  label: { fontSize: 11, lineHeight: 15, fontWeight: "700", marginTop: 0, marginBottom: 2 },
});
