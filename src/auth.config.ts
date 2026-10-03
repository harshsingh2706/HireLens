import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isAuthRoute =
        nextUrl.pathname.startsWith("/login") ||
        nextUrl.pathname.startsWith("/register");
      const isProtectedRoute =
        nextUrl.pathname.startsWith("/dashboard") ||
        nextUrl.pathname.startsWith("/jobs") ||
        nextUrl.pathname.startsWith("/candidates") ||
        nextUrl.pathname.startsWith("/search") ||
        nextUrl.pathname.startsWith("/settings");

      if (isProtectedRoute) {
        if (isLoggedIn) return true;
        // Redirect unauthenticated user to /login with callbackUrl
        const callbackUrl = encodeURIComponent(nextUrl.pathname + nextUrl.search);
        return Response.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, nextUrl));
      }

      if (isAuthRoute && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.company = (user as { company?: string | null }).company;
      }
      return token;
    },
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.company = token.company as string | null | undefined;
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
