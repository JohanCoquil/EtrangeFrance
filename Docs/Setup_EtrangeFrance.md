
# ⚙️ Configuration complète du projet Étrange France (React Native + NativeWind)

## 1. 🛠️ Créer le projet Expo avec TypeScript

```bash
cd EtrangeFrance
npx create-expo-app . --template expo-template-blank-typescript
```

---

## 2. 📦 Installer toutes les dépendances nécessaires

```bash
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs react-native-safe-area-context react-native-screens react-native-reanimated jotai @tanstack/react-query expo-sqlite expo-image-picker expo-sharing nativewind tailwindcss
```

---

## 3. ⚙️ Configurer Tailwind (NativeWind)

### ➤ Créer `tailwind.config.js` (s’il n’existe pas encore)

```bash
npx tailwindcss init
```

Puis remplace son contenu par :

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

---

## 4. 🧠 Configurer Babel

Crée un fichier à la racine du projet :

### ➤ `babel.config.js`

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['nativewind/babel', 'react-native-reanimated/plugin'],
  };
};
```

---

## 5. 🧾 Étendre les types TypeScript pour NativeWind

### ➤ Créer un fichier à la racine du projet : `nativewind.d.ts`

```ts
/// <reference types="nativewind/types" />
```

> Ou, dans `tsconfig.json`, ajoute :
```json
"compilerOptions": {
  "types": ["nativewind/types"]
}
```

---

## 6. 📁 Créer la structure du projet

```bash
mkdir -p src/screens src/components src/navigation src/types src/store
```

---

## 7. ✍️ Ajouter un écran de test : `src/screens/HomeScreen.tsx`

```tsx
import { View, Text } from 'react-native';

export default function HomeScreen() {
  return (
    <View className="flex-1 justify-center items-center bg-white">
      <Text className="text-xl font-bold text-blue-600">Bienvenue dans Étrange France</Text>
    </View>
  );
}
```

---

## 8. 🧩 Modifier le fichier `App.tsx`

```tsx
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

> ⚠️ N’écris **jamais** l’extension `.tsx` dans l’import (ex: `HomeScreen.tsx`) — TypeScript le résout automatiquement.

---

## 9. 🚀 Démarrer l’app

```bash
npx expo start -c
```

---

✅ Ton app doit maintenant afficher l’écran de bienvenue avec les styles `className`.  
Si tu veux aller plus loin, ajoute React Query, Jotai, ou l’audio/partage ensuite.

