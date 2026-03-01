import {
  Body, Controller, HttpCode, HttpStatus, Post, UseGuards,
} from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { AuthResponse, TokenPair } from './types/auth.types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /auth/register
   * Limit: 10 requests / 60s per IP
   * Prevents mass account creation / enumeration attacks
   */
  @Public()
  @Throttle({ auth: { ttl: 60_000, limit: 10 } })
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(dto);
  }

  /**
   * POST /auth/login
   * Limit: 10 requests / 60s per IP
   * Prevents brute-force credential stuffing
   */
  @Public()
  @Throttle({ auth: { ttl: 60_000, limit: 10 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(dto);
  }

  /**
   * POST /auth/refresh
   * Limit: 10 requests / 60s per IP
   * Prevents token refresh abuse
   */
  @Public()
  @Throttle({ auth: { ttl: 60_000, limit: 10 } })
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(
    @CurrentUser('id') userId: string,
    @Body() dto: RefreshTokenDto,
  ): Promise<TokenPair> {
    return this.authService.refresh(userId, dto.refreshToken);
  }

  /**
   * POST /auth/logout
   * Skip throttle — authenticated action, not an attack vector
   */
  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@CurrentUser('id') userId: string): Promise<void> {
    return this.authService.logout(userId);
  }
}
