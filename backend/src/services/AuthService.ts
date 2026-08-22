import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { LoginInput, RegisterInput, OtpVerifyInput, OtpResendInput } from '../validators/authValidators';
import { UnauthorizedError, ConflictError, BadRequestError } from '../errors/DomainError';
import { generateToken } from '../utils/jwt';
import { EtherealProvider } from './providers/EtherealProvider';

const prisma = new PrismaClient();
const emailProvider = new EtherealProvider();

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
        name: user.name,
        email: user.email,
        role: user.role,
      }
    };
  }

  static async registerInit(data: RegisterInput) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictError('An account with this email already exists.');
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const passwordHash = await bcrypt.hash(data.password, 10);

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.pendingRegistration.upsert({
      where: { email: data.email },
      create: {
        name: data.name,
        email: data.email,
        passwordHash,
        otpHash,
        expiresAt,
        attempts: 0,
      },
      update: {
        name: data.name,
        passwordHash,
        otpHash,
        expiresAt,
        attempts: 0,
        updatedAt: new Date(),
      }
    });

    const subject = 'Verify your DeliveryTracker account';
    const text = `Hello ${data.name},\n\nYour DeliveryTracker verification code is:\n${otp}\n\nThis code expires in 10 minutes.\nIf you did not request this registration, you can ignore this email.`;

    // Fire & Forget email sending or await it. Awaiting is safer to know it worked.
    await emailProvider.send(data.email, subject, text);

    return { message: 'OTP sent successfully' };
  }

  static async registerVerify(data: OtpVerifyInput) {
    const pending = await prisma.pendingRegistration.findUnique({
      where: { email: data.email }
    });

    if (!pending) {
      throw new BadRequestError('No pending registration found for this email');
    }

    if (pending.attempts >= 5) {
      throw new BadRequestError('Maximum verification attempts exceeded. Please request a new OTP.');
    }

    if (pending.expiresAt < new Date()) {
      throw new BadRequestError('OTP has expired. Please request a new OTP.');
    }

    const isMatch = await bcrypt.compare(data.otp, pending.otpHash);
    
    if (!isMatch) {
      await prisma.pendingRegistration.update({
        where: { email: data.email },
        data: { attempts: pending.attempts + 1 }
      });
      throw new BadRequestError('Invalid OTP');
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictError('An account with this email already exists.');
    }

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: pending.name,
          email: pending.email,
          passwordHash: pending.passwordHash,
          role: 'CUSTOMER',
          emailVerifiedAt: new Date(),
        },
      });

      await tx.pendingRegistration.delete({
        where: { email: data.email }
      });

      return newUser;
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    };
  }

  static async registerResend(data: OtpResendInput) {
    const pending = await prisma.pendingRegistration.findUnique({
      where: { email: data.email }
    });

    if (!pending) {
      throw new BadRequestError('No pending registration found for this email');
    }

    // 60 seconds cooldown
    const cooldownMs = 60 * 1000;
    if (new Date().getTime() - pending.updatedAt.getTime() < cooldownMs) {
      throw new BadRequestError('Please wait before requesting a new OTP');
    }

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await prisma.pendingRegistration.update({
      where: { email: data.email },
      data: {
        otpHash,
        expiresAt,
        attempts: 0,
        updatedAt: new Date()
      }
    });

    const subject = 'Verify your DeliveryTracker account';
    const text = `Hello ${pending.name},\n\nYour DeliveryTracker verification code is:\n${otp}\n\nThis code expires in 10 minutes.\nIf you did not request this registration, you can ignore this email.`;

    await emailProvider.send(data.email, subject, text);

    return { message: 'OTP resent successfully' };
  }
}
