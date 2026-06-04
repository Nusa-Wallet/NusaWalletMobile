import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { Platform, StyleSheet, Text, View } from "react-native";

import { colors } from "@/theme/colors";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

const TABS = [
  { name: "index",    label: "Beranda",  icon: "home",      iconOut: "home-outline"      },
  { name: "wallet",   label: "Dompet",   icon: "card",      iconOut: "card-outline"      },
  { name: "receive",  label: "Terima",   icon: "download",  iconOut: "download-outline"  },
  { name: "insights", label: "Insights", icon: "bar-chart", iconOut: "bar-chart-outline" },
  { name: "profile",  label: "Profil",   icon: "person",    iconOut: "person-outline"    },
] as const;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,  // custom label in tabBarIcon
        tabBarStyle: s.tabBar,
      }}
    >
      {TABS.map(({ name, label, icon, iconOut }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            tabBarIcon: ({ focused }) => (
              <View style={[s.tab, focused && s.tabActive]}>
                <Ionicons
                  name={(focused ? icon : iconOut) as IconName}
                  size={22}
                  color={focused ? colors.accent : colors.textSecondary}
                />
                <Text style={[s.label, focused && s.labelActive]}>{label}</Text>
              </View>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

const s = StyleSheet.create({
  tabBar: {
    height: Platform.OS === "ios" ? 80 : 64,
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 24 : 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: "#fff",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  tab: {
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    minWidth: 52,
  },
  tabActive: {
    // subtle highlight on active tab
  },
  label: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  labelActive: {
    color: colors.accent,
    fontWeight: "700",
  },
});
