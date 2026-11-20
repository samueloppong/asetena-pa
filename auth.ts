import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validations";
import type { UserRole, VerificationStatus } from "@prisma/client";

declare module "next-auth" {
  interface User {
    role?: UserRole;
    phoneNumber?: string;
    idVerificationStatus?: VerificationStatus;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      phoneNumber: string;
      idVerificationStatus: VerificationStatus;
      image?: string | null;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: UserRole;
    phoneNumber?: string;
    idVerificationStatus?: VerificationStatus;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(
          parsed.data.password,
          user.passwordHash
        );
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
          phoneNumber: user.phoneNumber,
          idVerificationStatus: user.idVerificationStatus,
          image: user.avatarUrl,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.phoneNumber = user.phoneNumber;
        token.idVerificationStatus = user.idVerificationStatus;
      }
      if (trigger === "update" && session) {
        if (session.role) token.role = session.role;
        if (session.idVerificationStatus) {
          token.idVerificationStatus = session.idVerificationStatus;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id;
        session.user.role = token.role ?? "renter";
        session.user.phoneNumber = token.phoneNumber ?? "";
        session.user.idVerificationStatus =
          token.idVerificationStatus ?? "unverified";
      }
      return session;
    },
  },
});
