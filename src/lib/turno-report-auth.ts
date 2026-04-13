import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function requireOwnerAdminSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return { authorized: false as const, status: 401, error: 'No autenticado' };
  }

  if (session.user.role !== 'owner' && session.user.role !== 'admin') {
    return { authorized: false as const, status: 403, error: 'No autorizado' };
  }

  return { authorized: true as const, session };
}
