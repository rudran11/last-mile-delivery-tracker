import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { LoginInput } from '../validators/authValidators';
import { UnauthorizedError } from '../errors/DomainError';
import { generateToken } from '../utils/jwt';

const prisma = new PrismaClient();

export class AuthService {
  static async login(data: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = generateToken({ userId: user.id, role: user.role });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      }
    };
  }
}
