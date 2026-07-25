import { TextStyle } from "react-native";

export const fonts = {
  regular: "Montserrat_400Regular",
  medium: "Montserrat_500Medium",
  semibold: "Montserrat_600SemiBold",
  bold: "Montserrat_700Bold",
};

function font(weight: keyof typeof fonts, style?: Partial<TextStyle>): TextStyle {
  return { fontFamily: fonts[weight], ...style } as TextStyle;
}

export const typography = {
  h1: font("bold", { fontSize: 28, lineHeight: 34, letterSpacing: -0.5 }),
  h2: font("bold", { fontSize: 24, lineHeight: 30, letterSpacing: -0.3 }),
  h3: font("bold", { fontSize: 20, lineHeight: 26 }),
  h4: font("bold", { fontSize: 18, lineHeight: 24 }),
  h5: font("bold", { fontSize: 22, lineHeight: 28 }),
  h6: font("bold", { fontSize: 17, lineHeight: 22 }),
  body: font("regular", { fontSize: 15, lineHeight: 22 }),
  bodyBold: font("semibold", { fontSize: 15, lineHeight: 22 }),
  caption: font("regular", { fontSize: 13, lineHeight: 18 }),
  captionBold: font("semibold", { fontSize: 13, lineHeight: 18 }),
  small: font("regular", { fontSize: 11, lineHeight: 16 }),
  smallBold: font("bold", { fontSize: 11, lineHeight: 16 }),
  label: font("medium", { fontSize: 12, lineHeight: 16, letterSpacing: 0.3 }),
  money: font("bold", { fontSize: 32, lineHeight: 38, letterSpacing: -0.5 }),
  moneySmall: font("bold", { fontSize: 26, lineHeight: 32, letterSpacing: -0.3 }),
  micro: font("medium", { fontSize: 10, lineHeight: 14 }),
  microBold: font("bold", { fontSize: 10, lineHeight: 14 }),
  tiny: font("medium", { fontSize: 9, lineHeight: 12 }),
};

export const fontSizes = {
  h1: 28, h2: 24, h3: 20, h4: 18, h5: 22, h6: 17,
  body: 15, bodyAlt: 14, bodySmall: 16,
  caption: 13, small: 11, label: 12, money: 32, moneySmall: 26,
  micro: 10, tiny: 9,
} as const;
