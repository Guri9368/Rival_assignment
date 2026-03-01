import {
  ConflictException, Injectable, InternalServerErrorException,
  Logger, UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponse, JwtAccessPayload, JwtRefreshPayload, TokenPair } from './types/auth.types';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    let user: { id: string; email: string; username: string; role: Role };

    try {
      user = await this.prisma.user.create({
        data: {
          email: dto.email,
          username: dto.username,
          displayName: dto.displayName,
          passwordHash,
        },
        select: { id: true, email: true, username: true, role: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('An account with these credentials already exists');
      }
      this.logger.error('Unexpected error during registration', error);
      throw new InternalServerErrorException('Registration failed. Please try again.');
    }

    const tokens = await this.generateTokenPair(user.id, user.email, user.role);
    await this.storeRefreshToken(user.id, tokens.refreshToken);
    this.logger.log(`User registered: ${user.id}`);
    return { ...tokens, user };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: {
        id: true, email: true, username: true, role: true,
        passwordHash: true, isActive: true, deletedAt: true,
      },
    });

    const dummyHash = '$2b$12$invalidhashfortimingattackprevention000000000000000000';
    const passwordValid = await bcrypt.compare(dto.password, user?.passwordHash ?? dummyHash);

    if (!user || !passwordValid || !user.isActive || user.deletedAt !== null) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokenPair(user.id, user.email, user.role);
    await this.storeRefreshToken(user.id, tokens.refreshToken);
    this.logger.log(`User logged in: ${user.id}`);
    return {
      ...tokens,
      user: { id: user.id, email: user.email, username: user.username, role: user.role },
    };
  }

  async refresh(userId: string, incomingRefreshToken: string): Promise<TokenPair> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, role: true,
        refreshTokenHash: true, isActive: true, deletedAt: true,
      },
    });

    if (!user || !user.isActive || user.deletedAt !== null || !user.refreshTokenHash) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const tokenValid = await bcrypt.compare(incomingRefreshToken, user.refreshTokenHash);
    if (!tokenValid) {
      await this.revokeAllRefreshTokens(userId);
      this.logger.warn(`Potential refresh token reuse detected for user: ${userId}`);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const tokens = await this.generateTokenPair(user.id, user.email, user.role);
    await this.storeRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }

  async logout(userId: string): Promise<void> {
    await this.revokeAllRefreshTokens(userId);
    this.logger.log(`User logged out: ${userId}`);
  }

  private async generateTokenPair(userId: string, email: string, role: Role): Promise<TokenPair> {
    const accessPayload: JwtAccessPayload = { sub: userId, email, role, type: 'access' };
    const refreshPayload: JwtRefreshPayload = { sub: userId, type: 'refresh' };

    const [accessToken, refreshToken] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.jwtService.signAsync(accessPayload as any, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN', '15m'),
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.jwtService.signAsync(refreshPayload as any, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const hash = await bcrypt.hash(refreshToken, BCRYPT_ROUNDS);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: hash },
    });
  }

  private async revokeAllRefreshTokens(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
  }
}
