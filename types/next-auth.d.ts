// Extend the built-in session types
import 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    name: string;
    role: 'super_admin' | 'company_admin' | 'fire_service';
    companyId?: string;
    fireStationId?: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: 'super_admin' | 'company_admin' | 'fire_service';
      companyId?: string;
      fireStationId?: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId: string;
    role: string;
    companyId?: string;
    fireStationId?: string;
  }
}
