// apps/web/src/lib/auth.ts
import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

export interface AuthSession {
  user: {
    id: string;
    email: string;
    name: string;
    image?: string;
  };
}

export type RequireOwnerResult =
  | { authorized: true; session: AuthSession; errorResponse?: never }
  | { authorized: false; session?: never; errorResponse: NextResponse };

/**
 * Determina si el bypass de autenticación para desarrollo local está habilitado.
 *
 * Reglas de seguridad estrictas:
 * 1. Debe estar explícitamente configurado DEV_AUTH_BYPASS="true".
 *    Nunca se activa por ausencia o valores por defecto de variables.
 * 2. NUNCA se activa en producción desplegada (VERCEL_ENV === "production").
 * 3. Se permite en desarrollo local (next dev) y en pruebas locales de build (next start en localhost).
 */
export function isDevAuthBypassEnabled(): boolean {
  if (process.env.DEV_AUTH_BYPASS !== "true") {
    return false;
  }

  if (process.env.VERCEL_ENV === "production") {
    return false;
  }

  return true;
}

export function getOwnerEmail(): string {
  return (process.env.OWNER_EMAIL || "owner@akhustico.studio").trim().toLowerCase();
}

/**
 * Valida si un email dado corresponde exactamente al propietario autorizado del estudio.
 */
export function isAuthorizedOwner(email?: string | null): boolean {
  if (isDevAuthBypassEnabled()) return true;
  if (!email) return false;
  return email.trim().toLowerCase() === getOwnerEmail();
}

// Configuración de NextAuth v5 para producción (Google OAuth)
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    ...(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
      ? [
          Google({
            clientId: process.env.AUTH_GOOGLE_ID,
            clientSecret: process.env.AUTH_GOOGLE_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    signIn({ user }) {
      // En producción solo se permite el inicio de sesión del propietario
      if (isDevAuthBypassEnabled()) return true;
      if (!user.email) return false;
      return user.email.trim().toLowerCase() === getOwnerEmail();
    },
    session({ session, token }) {
      if (token?.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET || "akhustico-studio-dev-secret-min-32-chars-long",
  trustHost: true,
});

/**
 * Retorna la sesión actual del usuario.
 * En desarrollo local con bypass activo, retorna la sesión del propietario sin requerir Google OAuth.
 * En producción, valida la sesión real a través de Auth.js (Google OAuth).
 */
export async function getCurrentSession(): Promise<AuthSession | null> {
  if (isDevAuthBypassEnabled()) {
    return {
      user: {
        id: "owner-dev-id",
        email: getOwnerEmail(),
        name: "Andrés (Propietario)",
        image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      },
    };
  }

  try {
    const session = await auth();
    if (session?.user?.email) {
      return {
        user: {
          id: session.user.id || "user-id",
          email: session.user.email,
          name: session.user.name || "Usuario",
          image: session.user.image || undefined,
        },
      };
    }
  } catch (err) {
    console.error("[Auth] Error al verificar sesión Auth.js:", err);
  }

  return null;
}

/**
 * Guardia de seguridad centralizado para Route Handlers (API).
 *
 * Respuestas según especificación:
 * - Usuario NO autenticado (sin sesión) -> 401 Unauthorized
 * - Usuario autenticado pero NO es OWNER_EMAIL -> 403 Forbidden
 * - Propietario autorizado (o dev bypass activo) -> { authorized: true, session }
 */
export async function requireOwner(): Promise<RequireOwnerResult> {
  const session = await getCurrentSession();

  // 1. Si no hay sesión, 401 Unauthorized
  if (!session || !session.user || !session.user.email) {
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        {
          error: "No autenticado",
          message: "Debes iniciar sesión para acceder a los recursos de AKHUSTICO Studio.",
        },
        { status: 401 }
      ),
    };
  }

  // 2. Si hay sesión pero no es el correo del propietario, 403 Forbidden
  if (!isAuthorizedOwner(session.user.email)) {
    return {
      authorized: false,
      errorResponse: NextResponse.json(
        {
          error: "Acceso prohibido",
          message: "Esta instancia de AKHUSTICO Studio es privada y exclusiva de su propietario.",
        },
        { status: 403 }
      ),
    };
  }

  // 3. Acceso autorizado
  return {
    authorized: true,
    session,
  };
}
