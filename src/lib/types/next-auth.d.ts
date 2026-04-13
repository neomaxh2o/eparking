import NextAuth from 'next-auth';
import { DefaultSession } from 'next-auth';
import { JWT as DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: 'guest' | 'client' | 'owner' | 'operator' | 'admin';
      assignedParkingId?: string | null;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    role: 'guest' | 'client' | 'owner' | 'operator' | 'admin';
    assignedParkingId?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    role: 'guest' | 'client' | 'owner' | 'operator' | 'admin';
    assignedParkingId?: string | null;
  }
}
