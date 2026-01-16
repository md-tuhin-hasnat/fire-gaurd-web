import { hash, compare } from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fire-guard-jwt-secret-change-this-in-production-2026'
);

/**
 * Hash a password using bcryptjs
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return await hash(password, 10);
}

/**
 * Compare a plain text password with a hashed password
 * @param password - Plain text password
 * @param hashedPassword - Hashed password from database
 * @returns True if passwords match
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return await compare(password, hashedPassword);
}

/**
 * Generate a JWT token
 * @param payload - Data to encode in the token
 * @param expiresIn - Token expiration time (default: 7 days)
 * @returns JWT token string
 */
export async function generateToken(
  payload: Record<string, any>,
  expiresIn: string = '7d'
): Promise<string> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(JWT_SECRET);

  return token;
}

/**
 * Verify and decode a JWT token
 * @param token - JWT token to verify
 * @returns Decoded payload or null if invalid
 */
export async function verifyToken(token: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * Session interface for authenticated users
 */
export interface UserSession {
  userId: string;
  email: string;
  name: string;
  role: 'super_admin' | 'company_admin' | 'fire_service';
  companyId?: string;
  fireStationId?: string;
}

/**
 * Get user session from request
 * @param token - JWT token from request
 * @returns User session or null
 */
export async function getUserSession(token: string): Promise<UserSession | null> {
  const payload = await verifyToken(token);
  if (!payload) return null;

  return {
    userId: payload.userId,
    email: payload.email,
    name: payload.name,
    role: payload.role,
    companyId: payload.companyId,
    fireStationId: payload.fireStationId,
  };
}
