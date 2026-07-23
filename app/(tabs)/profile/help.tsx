import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Card } from "@/components/ui";
import { StaggerFadeIn } from "@/components/StaggerFadeIn";
import { SubScreenHeader } from "@/components/SubScreenHeader";
import { colors, radius, spacing } from "@/theme/colors";
import { fontSizes } from "@/theme/typography";
import { scale } from "@/utils/responsive";
import AnimatedPressable from "@/components/AnimatedPressable";

const FAQS = [
  { q: "Bagaimana cara mengirim uang ke luar negeri?", a: "Buka tab Dompet, pilih mata uang tujuan, lalu klik Kirim. Masukkan jumlah dan konfirmasi." },
  { q: "Apakah ada biaya untuk konversi mata uang?", a: "Ya, biaya konversi adalah 0.5% dari jumlah transaksi. Biaya akan ditampilkan sebelum konfirmasi." },
  { q: "Bagaimana cara kerja deteksi fraud?", a: "Sistem AI menganalisis pola transaksi, lokasi pengirim, dan riwayat untuk mendeteksi aktivitas mencurigakan secara real-time." },
  { q: "Berapa lama transfer biasanya diproses?", a: "Transfer antar dompet NusaWallet diproses instan. Transfer ke bank eksternal membutuhkan 1-2 hari kerja." },
  { q: "Apakah data saya aman?", a: "Ya, semua data dienkripsi end-to-end. Kami menggunakan protokol keamanan standar perbankan dan tidak menyimpan data sensitif." },
];

export default function Help() {
  const { width: screenWidth } = useWindowDimensions();
  const iconSize = scale(44, screenWidth);
  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <SubScreenHeader title="Bantuan" />
      <ScrollView contentContainerStyle={s.scroll}>
        <StaggerFadeIn index={0}>
          <View style={s.quickHelp}>
            <AnimatedPressable style={s.helpCard}>
              <View style={[s.helpIcon, { width: iconSize, height: iconSize, borderRadius: iconSize * 0.27, backgroundColor: `${colors.accent}12` }]}>
                <Ionicons name="chatbubble-ellipses-outline" size={22} color={colors.accent} />
              </View>
              <Text style={s.helpCardTitle}>Live Chat</Text>
              <Text style={s.helpCardSub}>24/7 customer support</Text>
            </AnimatedPressable>
            <AnimatedPressable style={s.helpCard}>
              <View style={[s.helpIcon, { width: iconSize, height: iconSize, borderRadius: iconSize * 0.27, backgroundColor: `${colors.danger}12` }]}>
                <Ionicons name="call-outline" size={22} color={colors.danger} />
              </View>
              <Text style={s.helpCardTitle}>Telepon</Text>
              <Text style={s.helpCardSub}>021-1234-5678</Text>
            </AnimatedPressable>
          </View>
        </StaggerFadeIn>

        <StaggerFadeIn index={1}>
          <Text style={s.sectionTitle}>PERTANYAAN UMUM</Text>
        </StaggerFadeIn>
        {FAQS.map((faq, i) => (
          <StaggerFadeIn key={i} index={i + 2}>
            <Card style={{ marginBottom: spacing.sm }}>
              <Text style={s.faqQ}>{faq.q}</Text>
              <Text style={s.faqA}>{faq.a}</Text>
            </Card>
          </StaggerFadeIn>
        ))}

        <StaggerFadeIn index={FAQS.length + 2}>
          <View style={s.footer}>
            <Ionicons name="mail-outline" size={16} color={colors.textSecondary} />
            <Text style={s.footerText}>support@nusawallet.id</Text>
          </View>
        </StaggerFadeIn>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, gap: spacing.md, paddingBottom: 40 },
  quickHelp: { flexDirection: "row", gap: spacing.sm },
  helpCard: {
    flex: 1, backgroundColor: colors.card, borderRadius: radius.lg,
    padding: spacing.md, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
    alignItems: "center", gap: 4,
  },
  helpIcon: { alignItems: "center", justifyContent: "center", marginBottom: 4 },
  helpCardTitle: { fontWeight: "700", color: colors.textPrimary, fontSize: fontSizes.bodyAlt },
  helpCardSub: { color: colors.textSecondary, fontSize: fontSizes.small },
  sectionTitle: { fontSize: fontSizes.label, fontWeight: "600", color: colors.textSecondary, letterSpacing: 0.5, paddingHorizontal: 4, marginBottom: spacing.sm, marginTop: spacing.xs },
  faqQ: { fontWeight: "600", color: colors.textPrimary, fontSize: fontSizes.bodyAlt, marginBottom: 4 },
  faqA: { color: colors.textSecondary, fontSize: fontSizes.caption, lineHeight: 19 },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, paddingVertical: spacing.md },
  footerText: { color: colors.textSecondary, fontSize: fontSizes.caption },
});
