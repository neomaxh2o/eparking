// src/app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import User from "@/models/User";
import connectToDatabase from "@/lib/mongoose";

import type { JWT as JWTType } from "next-auth/jwt";
import type {
  User as NextAuthUser,
  Session as NextAuthSession,
  AuthOptions,
} from "next-auth";

const validRoles = ["guest", "client", "owner", "operator", "admin"] as const;
type UserRole = (typeof validRoles)[number];

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        await connectToDatabase();

        const user = await User.findOne({ email: credentials?.email });

        if (!user) throw new Error("Usuario no encontrado");

        const passwordMatch = await bcrypt.compare(
          credentials!.password,
          user.password
        );
        if (!passwordMatch) throw new Error("Contraseña incorrecta");

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role as UserRole,
          assignedParkingId: user.assignedParking?.toString() ?? null,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({
      token,
      user,
    }: {
      token: JWTType;
      user?: NextAuthUser;
    }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.assignedParkingId = user.assignedParkingId ?? null;
      }
      return token;
    },
    async session({
      session,
      token,
    }: {
      session: NextAuthSession;
      token: JWTType;
    }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.assignedParkingId = token.assignedParkingId ?? null;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
export type { UserRole };
