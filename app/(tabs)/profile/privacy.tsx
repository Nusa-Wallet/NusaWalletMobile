import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ScrollView, StyleSheet, Switch, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { StaggerFadeIn } from "@/components/StaggerFadeIn";
import { SubScreenHeader } from "@/components/SubScreenHeader";
import { colors, radius, spacing } from "@/theme/colors";
import { fontSizes } from "@/theme/typography";
import { scale } from "@/utils/responsive";
import AnimatedPressable from "@/components/AnimatedPressable";

export default function Privacy() {
  const { width: screenWidth } = useWindowDimensions();
  const iconSize = scale(36, screenWidth);
  const [analytics, setAnalytics] = useState(true);
  const [personalization, setPersonalization] = useState(true);
  const [dataShare, setDataShare] = useState(false);

  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <SubScreenHeader title="Privasi" />
      <ScrollView contentContainerStyle={s.scroll}>
        <StaggerFadeIn index={0}>
          <View style={s.section}>
            <Text style={s.sectionTitle}>PREFERENSI DATA</Text>
            <View style={s.card}>
              <View style={s.row}>
                <View style={s.rowIcon}>
                  <Ionicons name="analytics-outline" size={20} color={colors.accent} />
                </View>
                <View style={s.rowContent}>
                  <Text style={s.rowTitle}>Analytics Penggunaan</Text>
                  <Text style={s.rowSub}>Bantu kami meningkatkan aplikasi dengan data anonim</Text>
                </View>
                <Switch value={analytics} onValueChange={setAnalytics} trackColor={{ false: colors.border, true: colors.accent }} />
              </View>
              <View style={s.divider} />
              <View style={s.row}>
                <View style={s.rowIcon}>
                  <Ionicons name="color-palette-outline" size={20} color={colors.accent} />
                </View>
                <View style={s.rowContent}>
                  <Text style={s.rowTitle}>Personalisasi</Text>
                  <Text style={s.rowSub}>Rekomendasi AI yang disesuaikan dengan kebiasaan Anda</Text>
                </View>
                <Switch value={personalization} onValueChange={setPersonalization} trackColor={{ false: colors.border, true: colors.accent }} />
              </View>
              <View style={s.divider} />
              <View style={s.row}>
                <View style={s.rowIcon}>
                  <Ionicons name="share-outline" size={20} color={colors.accent} />
                </View>
                <View style={s.rowContent}>
                  <Text style={s.rowTitle}>Bagikan Data Pasar</Text>
                  <Text style={s.rowSub}>Kontribusi data kurs anonim untuk riset pasar</Text>
                </View>
                <Switch value={dataShare} onValueChange={setDataShare} trackColor={{ false: colors.border, true: colors.accent }} />
              </View>
            </View>
          </View>
        </StaggerFadeIn>

        <StaggerFadeIn index={1}>
          <View style={s.section}>
            <Text style={s.sectionTitle}>KELOLA DATA</Text>
            <View style={s.card}>
              <AnimatedPressable>
                <View style={s.row}>
                  <View style={s.rowIcon}>
                    <Ionicons name="download-outline" size={20} color={colors.textSecondary} />
                  </View>
                  <View style={s.rowContent}>
                    <Text style={s.rowTitle}>Ekspor Data</Text>
                    <Text style={s.rowSub}>Download seluruh data akun Anda</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                </View>
              </AnimatedPressable>
              <View style={s.divider} />
              <AnimatedPressable>
                <View style={s.row}>
                  <View style={s.rowIcon}>
                    <Ionicons name="trash-outline" size={20} color={colors.danger} />
                  </View>
                  <View style={s.rowContent}>
                    <Text style={[s.rowTitle, { color: colors.danger }]}>Hapus Akun</Text>
                    <Text style={s.rowSub}>Hapus permanen akun dan seluruh data</Text>
                  </View>
                </View>
              </AnimatedPressable>
            </View>
          </View>
        </StaggerFadeIn>

        <StaggerFadeIn index={2}>
          <View style={s.privacyNote}>
            <Ionicons name="lock-closed-outline" size={16} color={colors.accent} />
            <Text style={s.privacyNoteText}>Data Anda dilindungi dengan enkripsi end-to-end</Text>
          </View>
        </StaggerFadeIn>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: 40 },
  section: { gap: spacing.sm },
  sectionTitle: { fontSize: fontSizes.label, fontWeight: "600", color: colors.textSecondary, letterSpacing: 0.5, paddingHorizontal: 4 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, padding: spacing.md },
  rowIcon: { width: 36, height: 36, borderRadius: radius.sm, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" },
  rowContent: { flex: 1 },
  rowTitle: { fontWeight: "600", color: colors.textPrimary, fontSize: fontSizes.bodyAlt },
  rowSub: { color: colors.textSecondary, fontSize: fontSizes.label, marginTop: 1 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.separator, marginHorizontal: spacing.md },
  privacyNote: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  privacyNoteText: { fontSize: fontSizes.caption, color: colors.textSecondary, fontWeight: "500" },
});
