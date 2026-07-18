# NusaWallet Mobile

React Native + Expo (TypeScript, expo-router). UI built to follow the Figma
"BI Design" mockups (13 screens).

## Run (dev)

```bash
npm install
npx expo install --fix   # aligns native dep versions to the Expo SDK
npx expo start
```

Then press `a` (Android emulator), `i` (iOS simulator), or scan the QR with Expo Go.

The app talks to the backend at `http://localhost:8000` (Android emulator uses
`10.0.2.2` automatically). For a physical device set your LAN IP:

```bash
# .env
EXPO_PUBLIC_API_URL=http://192.168.x.x:8000
```

Make sure [NusaWalletBackend](../NusaWalletBackend) (port 8000) and
[NusaWalletAI](../NusaWalletAI) (port 8001) are running, and the backend is seeded
(`python -m app.seed`). Demo login uses password `password123` with either email
`demo@nusawallet.id` or phone `081234567890`.

## Structure (file-based routing)

```
app/
  _layout.tsx          root stack + AuthProvider
  index.tsx            auth gate -> tabs, returning-user login, or onboarding
  onboarding.tsx       Design 01-04
  (auth)/login.tsx     Design 05/06
  (auth)/register.tsx  Registrasi tervalidasi -> kembali ke login
  (tabs)/
    _layout.tsx        bottom nav: Beranda/Dompet/Terima/Insights/Profil
    index.tsx          Beranda            (Design 07)
    wallet.tsx         Dompet + konversi  (Design 08/09)
    receive.tsx        Payment link       (Design 10/11)
    insights.tsx       AI FX advisory     (Design 12)
    profile.tsx        Profil             (Design 13)
src/
  api/        axios client + typed endpoints
  store/      auth context (token + onboarding state in AsyncStorage)
  components/ Button, Card, Title
  theme/      colors & spacing from the mockups
```

After the first successful authentication, the onboarding completion flag remains
stored when the user logs out. Returning logged-out users therefore open the login
screen directly instead of repeating onboarding.
