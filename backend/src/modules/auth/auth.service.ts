import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userRepository, UserRepository } from '../users/user.repository.js';
import { RegisterInput, LoginInput, ForgotPasswordInput } from './auth.validation.js';
import { ConflictError, UnauthorizedError, NotFoundError } from '../../utils/errors.js';
import { env } from '../../config/env.js';
import { categoryRepository } from '../categories/category.repository.js';

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    timezone: string;
    currency: string;
    createdAt: Date;
  };
  token: string;
}

export class AuthService {
  constructor(private userRepo: UserRepository = userRepository) {}

  async register(input: RegisterInput): Promise<AuthResponse> {
    const existingUser = await this.userRepo.findByEmail(input.email);
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(input.password, salt);

    const user = await this.userRepo.create({
      name: input.name,
      email: input.email,
      passwordHash,
      timezone: input.timezone || 'UTC',
      currency: input.currency || 'INR',
    });

    // Seed default categories for new user
    await categoryRepository.seedDefaultCategoriesForUser(user._id);

    const token = this.generateToken(user._id.toString(), user.email);

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        timezone: user.timezone,
        currency: user.currency,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await this.userRepo.findByEmail(input.email, true);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(input.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = this.generateToken(user._id.toString(), user.email);

    return {
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        timezone: user.timezone,
        currency: user.currency,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  async forgotPassword(input: ForgotPasswordInput): Promise<void> {
    const user = await this.userRepo.findByEmail(input.email, true);
    if (user) {
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(input.newPassword, salt);
      await user.save();
    }
  }

  async getCurrentUser(userId: string) {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      timezone: user.timezone,
      currency: user.currency,
      createdAt: user.createdAt,
    };
  }

  private generateToken(userId: string, email: string): string {
    return jwt.sign({ userId, email }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as any,
    });
  }
}

export const authService = new AuthService();
