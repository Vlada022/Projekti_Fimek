import { describe, it, expect, beforeAll } from 'vitest';
import {
  hashPassword,
  authenticateUser,
  registerUser,
  getMovies,
  createMovie,
  updateMovie,
  deleteMovie,
  logActivity,
  getActivityLogs,
  clearActivityLogs,
  initDb
} from './db';
import crypto from 'crypto';

describe('SQLite Profile Database & Authentication Engine', () => {
  beforeAll(() => {
    initDb();
  });
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

  describe('Movie Management (CRUD)', () => {
    it('should successfully create, read, update and delete a movie', () => {
      const testMovie = {
        title: 'Unit Test Movie',
        year: 2026,
        genre: 'Tech, Drama',
        director: 'Vitest Runner',
        duration: '120 min',
        rating: 9.5,
        cover: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400',
        description: 'A masterpiece created by vitest unit tests.'
      };

      const created = createMovie('usr_admin', testMovie);
      expect(created.id).toBeDefined();
      expect(created.id.startsWith('mov_')).toBe(true);
      expect(created.title).toBe(testMovie.title);
      expect(created.year).toBe(testMovie.year);
      expect(created.director).toBe(testMovie.director);

      const list = getMovies();
      const found = list.find(m => m.id === created.id);
      expect(found).toBeDefined();
      expect(found?.title).toBe(testMovie.title);

      const updated = updateMovie(created.id, {
        ...testMovie,
        title: 'Unit Test Movie - Updated Title',
        rating: 9.9
      });
      expect(updated).toBeDefined();
      expect(updated?.title).toBe('Unit Test Movie - Updated Title');
      expect(updated?.rating).toBe(9.9);

      const deleted = deleteMovie(created.id);
      expect(deleted).toBe(true);

      const postDeleteList = getMovies();
      const postDeleteFound = postDeleteList.find(m => m.id === created.id);
      expect(postDeleteFound).toBeUndefined();
    });
  });

  describe('Activity Logging', () => {
    it('should successfully log actions and fetch activity logs', () => {
      clearActivityLogs();

      logActivity(
        'usr_admin',
        'admin',
        'TEST_ACTION',
        'Detailed logs of unit testing execution.',
        '192.168.1.1'
      );

      const logs = getActivityLogs(10);
      const testLog = logs.find(log => log.action === 'TEST_ACTION');
      expect(testLog).toBeDefined();
      expect(testLog?.username).toBe('admin');
      expect(testLog?.details).toBe('Detailed logs of unit testing execution.');
      expect(testLog?.ip_address).toBe('192.168.1.1');
    });
  });
});
