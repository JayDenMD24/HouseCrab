import type { Session } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";

import { supabase } from "./supabase";

// Roles que se pueden elegir al registrarse. El rol "admin" solo se asigna manualmente en la base de datos.
export type Rol = "estudiante" | "propietario";
export type RolPerfil = Rol | "admin";

// Rol elegido en el registro con Google: se guarda antes de salir a Google y se aplica al volver.
const ROL_PENDIENTE = "housecrab_rol_pendiente";
const leerRolPendiente = (): Rol | null => {
  try {
    const r = localStorage.getItem(ROL_PENDIENTE);
    return r === "estudiante" || r === "propietario" ? r : null;
  } catch {
    return null;
  }
};
const guardarRolPendiente = (rol: Rol | null) => {
  try {
    if (rol) localStorage.setItem(ROL_PENDIENTE, rol);
    else localStorage.removeItem(ROL_PENDIENTE);
  } catch {
    /* sin almacenamiento: se usa el rol por defecto */
  }
};

export type Profile = {
  id: string;
  nombre: string;
  rol: RolPerfil;
  fecha_nacimiento: string | null;
};

type SignUpData = {
  email: string;
  password: string;
  nombre: string;
  rol: Rol;
  fechaNacimiento: string; // ISO yyyy-mm-dd
};

type AuthContextValue = {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (data: SignUpData) => Promise<string | null>;
  signOut: () => Promise<void>;
  signInWithGoogle: (rol?: Rol) => Promise<string | null>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// El rol "propietario" se llamaba "arrendatario". Mientras la base de datos no esté migrada, el valor
// antiguo se interpreta como el nuevo para que la app funcione igual antes y después de la migración.
function normalizarPerfil(p: Profile | null): Profile | null {
  return p && (p.rol as string) === "arrendatario" ? { ...p, rol: "propietario" } : p;
}

// ── Modo demo (solo desarrollo) ──────────────────────────────────────────────
// Abrir la app con ?demo=estudiante|propietario|admin simula una sesión con ese rol para revisar el
// diseño sin credenciales. Los datos públicos siguen siendo los reales; las acciones que requieren un
// usuario de verdad fallan. Está protegido por __DEV__: no existe en builds de producción.
// Para salir: ?demo=off
const DEMO_ID = "00000000-0000-0000-0000-000000000000";

function leerDemo(): RolPerfil | null {
  if (!__DEV__ || typeof window === "undefined") return null;
  try {
    const q = new URLSearchParams(window.location.search).get("demo");
    if (q === "off") sessionStorage.removeItem("hc_demo");
    else if (q) sessionStorage.setItem("hc_demo", q);
    const r = sessionStorage.getItem("hc_demo");
    if (r === "arrendatario") return "propietario"; // nombre antiguo del rol
    return r === "estudiante" || r === "propietario" || r === "admin" ? r : null;
  } catch {
    return null;
  }
}

function ProveedorDemo({ rol, children }: { rol: RolPerfil; children: React.ReactNode }) {
  // El propietario demo adopta el id de un propietario real para ver sus pensiones publicadas.
  const [id, setId] = useState(DEMO_ID);
  useEffect(() => {
    if (rol !== "propietario") return;
    supabase
      .from("pensiones")
      .select("propietario_id")
      .limit(1)
      .then(({ data }) => data?.[0] && setId(data[0].propietario_id));
  }, [rol]);

  const valor: AuthContextValue = {
    session: { user: { id, email: `demo-${rol}@housecrab.dev` } } as unknown as Session,
    profile: { id, nombre: `Demo ${rol}`, rol, fecha_nacimiento: null },
    loading: false,
    signIn: async () => null,
    signUp: async () => null,
    signInWithGoogle: async () => null,
    refreshProfile: async () => {},
    signOut: async () => {
      sessionStorage.removeItem("hc_demo");
      window.location.href = "/";
    },
  };
  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const demo = leerDemo();
  return demo ? (
    <ProveedorDemo rol={demo}>{children}</ProveedorDemo>
  ) : (
    <ProveedorReal>{children}</ProveedorReal>
  );
}

function ProveedorReal({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      // getSession lee del almacenamiento local; getUser confirma con el servidor que el usuario aún existe.
      if (data.session) {
        const { error } = await supabase.auth.getUser();
        if (error) {
          await supabase.auth.signOut();
          return;
        }
      }
      setSession(data.session);
      if (!data.session) setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (!s) {
        setProfile(null);
        setLoading(false);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // El perfil se carga aparte: no se puede hacer await a Supabase dentro de onAuthStateChange.
  const userId = session?.user.id;
  useEffect(() => {
    if (!userId) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle()
      .then(async ({ data, error }) => {
        if (!data && !error) {
          // Sesión huérfana: el usuario o su perfil fue borrado de la base de datos.
          await supabase.auth.signOut();
          return;
        }
        let perfil = normalizarPerfil(data as Profile | null);

        const pendiente = leerRolPendiente();
        if (pendiente) {
          guardarRolPendiente(null);
          if (perfil && perfil.rol !== pendiente) {
            const { error: errRol } = await supabase.rpc("elegir_rol_inicial", { nuevo: pendiente });
            if (!errRol) perfil = { ...perfil, rol: pendiente };
          }
        }

        setProfile(perfil);
        setLoading(false);
      });
  }, [userId]);

  const signIn: AuthContextValue["signIn"] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? traducir(error.message) : null;
  };

  const signUp: AuthContextValue["signUp"] = async (d) => {
    const { error } = await supabase.auth.signUp({
      email: d.email,
      password: d.password,
      options: {
        data: { nombre: d.nombre, rol: d.rol, fecha_nacimiento: d.fechaNacimiento },
      },
    });
    return error ? traducir(error.message) : null;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const signInWithGoogle = async (rol?: Rol) => {
    if (Platform.OS !== "web") return "El acceso con Google aún no está disponible en la app móvil.";
    guardarRolPendiente(rol ?? null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    return error ? traducir(error.message) : null;
  };

  const refreshProfile = async () => {
    if (!userId) return;
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
    if (data) setProfile(normalizarPerfil(data as Profile));
  };

  return (
    <AuthContext.Provider value={{ session, profile, loading, signIn, signUp, signOut, signInWithGoogle, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}

function traducir(msg: string) {
  if (msg.includes("Invalid login credentials")) return "Correo o contraseña incorrectos.";
  if (msg.includes("already registered")) return "Ese correo ya está registrado.";
  if (msg.includes("at least")) return "La contraseña debe tener al menos 6 caracteres.";
  if (msg.includes("valid email") || msg.includes("invalid")) return "Correo electrónico no válido.";
  return msg;
}
