import { ConflictException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import bcrypt from "bcrypt";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthService } from "../src/modules/auth/auth.service.js";
import { PrismaService } from "../src/prisma/prisma.service.js";

describe("AuthService", () => {
  let authService: AuthService;
  let prisma: {
    user: {
      findUnique: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
    };
  };
  let jwtService: {
    sign: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
    };

    jwtService = {
      sign: vi.fn().mockReturnValue("mock_jwt_access_token"),
    };

    authService = new AuthService(
      prisma as unknown as PrismaService,
      jwtService as unknown as JwtService,
    );
  });

  describe("register", () => {
    it("should hash password using bcrypt and create new user", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const mockCreatedUser = {
        id: BigInt(1),
        email: "thi@example.com",
        passwordHash: "hashed_pwd",
        fullName: "Tran Thi",
        phone: "0901234567",
        loyaltyPoints: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
      };

      prisma.user.create.mockResolvedValue(mockCreatedUser);

      const result = await authService.register({
        email: "thi@example.com",
        password: "secretPassword123",
        fullName: "Tran Thi",
        phone: "0901234567",
      });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "thi@example.com" },
      });

      // Verify create was called
      expect(prisma.user.create).toHaveBeenCalled();
      const createCallArg = prisma.user.create.mock.calls[0][0];
      expect(createCallArg.data.email).toBe("thi@example.com");
      expect(createCallArg.data.fullName).toBe("Tran Thi");
      // Password must be hashed with bcrypt, NOT stored in plain text
      expect(createCallArg.data.passwordHash).not.toBe("secretPassword123");
      const isBcryptHash = await bcrypt.compare(
        "secretPassword123",
        createCallArg.data.passwordHash,
      );
      expect(isBcryptHash).toBe(true);

      // Verify JWT sign called
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: "1",
        email: "thi@example.com",
        fullName: "Tran Thi",
      });

      expect(result.accessToken).toBe("mock_jwt_access_token");
      expect(result.user.email).toBe("thi@example.com");
      expect((result.user as any).passwordHash).toBeUndefined();
    });

    it("should throw ConflictException if email is already in use", async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: BigInt(2),
        email: "existing@example.com",
      });

      await expect(
        authService.register({
          email: "existing@example.com",
          password: "password123",
          fullName: "Tran Thi",
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe("login", () => {
    it("should verify password with bcrypt and return standard JWT Access Token", async () => {
      const plainPassword = "password123";
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      prisma.user.findUnique.mockResolvedValue({
        id: BigInt(10),
        email: "thi@example.com",
        passwordHash: hashedPassword,
        fullName: "Tran Thi",
        phone: null,
        loyaltyPoints: 50,
        isActive: true,
      });

      const result = await authService.login({
        email: "thi@example.com",
        password: plainPassword,
      });

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: "10",
        email: "thi@example.com",
        fullName: "Tran Thi",
      });

      expect(result.accessToken).toBe("mock_jwt_access_token");
      expect(result.user.id).toBe("10");
      expect(result.user.email).toBe("thi@example.com");
    });

    it("should throw UnauthorizedException if password does not match", async () => {
      const hashedPassword = await bcrypt.hash("correctPassword", 10);

      prisma.user.findUnique.mockResolvedValue({
        id: BigInt(10),
        email: "thi@example.com",
        passwordHash: hashedPassword,
        fullName: "Tran Thi",
        isActive: true,
      });

      await expect(
        authService.login({
          email: "thi@example.com",
          password: "wrongPassword",
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should throw UnauthorizedException if user does not exist", async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        authService.login({
          email: "nonexistent@example.com",
          password: "anyPassword",
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should throw UnauthorizedException if user is deactivated", async () => {
      const hashedPassword = await bcrypt.hash("correctPassword", 10);

      prisma.user.findUnique.mockResolvedValue({
        id: BigInt(10),
        email: "thi@example.com",
        passwordHash: hashedPassword,
        fullName: "Tran Thi",
        isActive: false,
      });

      await expect(
        authService.login({
          email: "thi@example.com",
          password: "correctPassword",
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
