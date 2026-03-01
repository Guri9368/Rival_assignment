import { Role } from '@prisma/client';

export interface JwtAccessPayload {
  readonly sub: string;
  readonly email: string;
  readonly role: Role;
  readonly type: 'access';
}

export interface JwtRefreshPayload {
  readonly sub: string;
  readonly type: 'refresh';
}

export interface AuthenticatedUser {
  readonly id: string;
  readonly email: string;
  readonly role: Role;
}

export interface TokenPair {
  readonly accessToken: string;
  readonly refreshToken: string;
}

export interface AuthResponse extends TokenPair {
  readonly user: {
    readonly id: string;
    readonly email: string;
    readonly username: string;
    readonly role: Role;
  };
}
