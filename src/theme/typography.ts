import { TextStyle } from "react-native";

export const fonts = {
  regular: undefined,
  medium: undefined,
  semibold: undefined,
  bold: undefined,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: "800", lineHeight: 34, letterSpacing: -0.5 } as TextStyle,
  h2: { fontSize: 24, fontWeight: "700", lineHeight: 30, letterSpacing: -0.3 } as TextStyle,
  h3: { fontSize: 20, fontWeight: "700", lineHeight: 26 } as TextStyle,
  h4: { fontSize: 18, fontWeight: "700", lineHeight: 24 } as TextStyle,
  h5: { fontSize: 22, fontWeight: "700", lineHeight: 28 } as TextStyle,
  h6: { fontSize: 17, fontWeight: "700", lineHeight: 22 } as TextStyle,
  body: { fontSize: 15, fontWeight: "400", lineHeight: 22 } as TextStyle,
  bodyBold: { fontSize: 15, fontWeight: "600", lineHeight: 22 } as TextStyle,
  caption: { fontSize: 13, fontWeight: "400", lineHeight: 18 } as TextStyle,
  captionBold: { fontSize: 13, fontWeight: "600", lineHeight: 18 } as TextStyle,
  small: { fontSize: 11, fontWeight: "400", lineHeight: 16 } as TextStyle,
  smallBold: { fontSize: 11, fontWeight: "700", lineHeight: 16 } as TextStyle,
  label: { fontSize: 12, fontWeight: "500", lineHeight: 16, letterSpacing: 0.3 } as TextStyle,
  money: { fontSize: 32, fontWeight: "800", lineHeight: 38, letterSpacing: -0.5 } as TextStyle,
  moneySmall: { fontSize: 26, fontWeight: "800", lineHeight: 32, letterSpacing: -0.3 } as TextStyle,
  micro: { fontSize: 10, fontWeight: "500", lineHeight: 14 } as TextStyle,
  microBold: { fontSize: 10, fontWeight: "700", lineHeight: 14 } as TextStyle,
  tiny: { fontSize: 9, fontWeight: "500", lineHeight: 12 } as TextStyle,
};

export const fontSizes = {
  h1: 28, h2: 24, h3: 20, h4: 18, h5: 22, h6: 17,
  body: 15, bodyAlt: 14, bodySmall: 16,
  caption: 13, small: 11, label: 12, money: 32, moneySmall: 26,
  micro: 10, tiny: 9,
} as const;
