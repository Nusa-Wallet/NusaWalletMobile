export const FLAGS: Record<string, string> = { IDR: "🇮🇩", USD: "🇺🇸", SGD: "🇸🇬", EUR: "🇪🇺", MYR: "🇲🇾", JPY: "🇯🇵", GBP: "🇬🇧" };

export const FLAG_IMAGES: Record<string, any> = {
  IDR: require("../../assets/id.png"),
  USD: require("../../assets/us.png"),
  SGD: require("../../assets/sg.png"),
  EUR: require("../../assets/eu.png"),
  MYR: require("../../assets/my.png"),
};

export const CCY_COLORS: Record<string, string> = {
  USD: "#2563EB", EUR: "#7C3AED", SGD: "#16A34A", MYR: "#F97316", IDR: "#0F766E",
};

export const FX_TARGETS = ["USD", "SGD", "EUR", "MYR"];
