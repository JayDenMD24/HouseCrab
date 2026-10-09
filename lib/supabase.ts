import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// El render estático de web corre en Node (sin `window`): ahí no hay sesión que persistir.
const enServidor = Platform.OS === "web" && typeof window === "undefined";

export const supabase = createClient(url, anonKey, {
  auth: {
    storage: enServidor ? undefined : AsyncStorage,
    autoRefreshToken: !enServidor,
    persistSession: !enServidor,
    detectSessionInUrl: Platform.OS === "web" && !enServidor,
  },
});
