import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function requireAdminSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return { authorized: false, message: 'No autenticado' };
  }

  if (session.user.role !== 'admin') {
    return { authorized: false, message: 'No autorizado' };
  }

  return { authorized: true, session };
}
