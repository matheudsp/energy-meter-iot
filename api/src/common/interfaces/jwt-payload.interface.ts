import { UserRole } from '@/common/enums/domain.enums';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  // oid?: string; // Owner ID
  // tid?: string; // Tenant ID
}
