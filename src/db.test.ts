import { describe, it, expect } from 'vitest';
import { hashPassword, authenticateUser, registerUser } from './db';
import crypto from 'crypto';

describe('SQLite Profile Database & Authentication Engine', () => {
  describe('Password Cryptography', () => {
    it('should generate a valid SHA-256 hash', () => {
      const password = 'mySecurePassword123';
      const hash = hashPassword(password);
      
      // SHA-256 hashes are exactly 64 hex characters
      expect(hash).toHaveLength(64);
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should produce consistent hashes for the same input', () => {
      const password = 'same_password';
      expect(hashPassword(password)).toBe(hashPassword(password));
    });

    it('should verify hashes match native node:crypto SHA-256 implementation', () => {
      const input = 'verification_test';
      const expected = crypto.createHash('sha256').update(input).digest('hex');
      expect(hashPassword(input)).toBe(expected);
    });
  });

  describe('User Registration Validations', () => {
    it('should reject usernames shorter than 3 characters', () => {
      const result = registerUser('ab', 'password', 'AB', 'ab@test.com');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Username must be at least 3 characters');
    });

    it('should reject passwords shorter than 4 characters', () => {
      const result = registerUser('validuser', '123', 'Valid User', 'valid@test.com');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Password must be at least 4 characters');
    });

    it('should fail authentication for non-existent users', () => {
      const result = authenticateUser('non_existent_user_99999', 'anypass');
      expect(result.success).toBe(false);
      expect(result.error).toContain('User does not exist');
    });

    it('should fail authentication with invalid credentials', () => {
      // 'admin' is pre-seeded with 'admin123'
      const result = authenticateUser('admin', 'wrong_password');
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid password');
    });

    it('should successfully authenticate pre-seeded administrator', () => {
      const result = authenticateUser('admin', 'admin123');
      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user?.username).toBe('admin');
      expect(result.user?.display_name).toBe('Administrator');
    });
  });
});
