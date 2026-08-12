export type UserRole = 'ADMIN' | 'BARISTA';

export interface UserSession {
  id: string;
  email: string;
  role: UserRole;
}

export function isAuthorizedRole(userRole: UserRole, requiredRole: UserRole): boolean {
  if (userRole === 'ADMIN') return true; // Admin has universal permission
  if (userRole === 'BARISTA' && requiredRole === 'BARISTA') return true;
  return false;
}
