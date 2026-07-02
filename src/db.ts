import Database from 'better-sqlite3';
import path from 'path';
import crypto from 'crypto';

export interface UserProfile {
  id: string; // custom prefix with unique id or username
  username: string;
  display_name: string;
  email: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  favorite_genres: string | null;
  updated_at: string;
  created_at: string;
}

export interface ActivityLog {
  id: number;
  user_id: string | null;
  username: string;
  action: string;
  details: string;
  ip_address: string;
  timestamp: string;
}

export interface Movie {
  id: string;
  user_id: string;
  title: string;
  year: number;
  genre: string;
  director: string;
  duration: string;
  rating: number;
  cover: string;
  description: string;
  created_at: string;
}

const dbPath = path.join(process.cwd(), 'database.db');
export const db = new Database(dbPath);

// Enable WAL mode for concurrent performance
db.pragma('journal_mode = WAL');

// Simple native hash function for secure local passwords
export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function initDb() {
  // Create users table with standard security fields
  db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE,
      password_hash TEXT,
      display_name TEXT,
      email TEXT,
      avatar_url TEXT,
      bio TEXT,
      location TEXT,
      website TEXT,
      favorite_genres TEXT,
      updated_at TEXT,
      created_at TEXT
    )
  `).run();

  // Create activity_logs table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      username TEXT,
      action TEXT,
      details TEXT,
      ip_address TEXT,
      timestamp TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `).run();

  // Create movies table
  db.prepare(`
    CREATE TABLE IF NOT EXISTS movies (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      title TEXT,
      year INTEGER,
      genre TEXT,
      director TEXT,
      duration TEXT,
      rating REAL,
      cover TEXT,
      description TEXT,
      created_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `).run();

  // Pre-seed some standard accounts for immediate field testing:
  // 1. admin / admin123
  // 2. developer / devpass
  const defaultAccounts = [
    {
      id: 'usr_admin',
      username: 'admin',
      password: 'admin123',
      display_name: 'Administrator',
      email: 'admin@sqlite-hub.org',
      avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
      bio: 'System Administrator of the secure SQLite Profile Engine.',
      location: 'Main Server Frame',
      website: 'https://ai.studio/build',
      genres: 'Sci-Fi, Cyberpunk, Documentary'
    },
    {
      id: 'usr_developer',
      username: 'developer',
      password: 'devpass',
      display_name: 'Software Engineer',
      email: 'engineer@local.db',
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      bio: 'Local software engineer testing the reactive data layer.',
      location: 'Silicon Valley, CA',
      website: 'https://github.com',
      genres: 'Action, Mystery, Noir'
    }
  ];

  const now = new Date().toLocaleString();
  const checkUser = db.prepare('SELECT id FROM users WHERE id = ?');
  const insertUser = db.prepare(`
    INSERT INTO users (id, username, password_hash, display_name, email, avatar_url, bio, location, website, favorite_genres, updated_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  defaultAccounts.forEach(acc => {
    const existing = checkUser.get(acc.id);
    if (!existing) {
      const pHash = hashPassword(acc.password);
      insertUser.run(
        acc.id,
        acc.username,
        pHash,
        acc.display_name,
        acc.email,
        acc.avatar_url,
        acc.bio,
        acc.location,
        acc.website,
        acc.genres,
        now,
        now
      );

      // Log the seeded account creation
      logActivity(
        acc.id,
        acc.username,
        'SYSTEM_SEED',
        `Seeded default database credentials for user: @${acc.username}`,
        '127.0.0.1'
      );
    }
  });

  // Pre-seed some spectacular movies so the database starts with active entries!
  const defaultMovies = [
    {
      id: 'mov_inception',
      user_id: 'usr_admin',
      title: 'Inception',
      year: 2010,
      genre: 'Sci-Fi, Action',
      director: 'Christopher Nolan',
      duration: '148 min',
      rating: 8.8,
      cover: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400',
      description: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.'
    },
    {
      id: 'mov_interstellar',
      user_id: 'usr_admin',
      title: 'Interstellar',
      year: 2014,
      genre: 'Sci-Fi, Drama',
      director: 'Christopher Nolan',
      duration: '169 min',
      rating: 8.7,
      cover: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400',
      description: 'When Earth becomes uninhabitable, a team of explorers travels through a wormhole in space in an attempt to ensure humanity\'s survival.'
    },
    {
      id: 'mov_pulp_fiction',
      user_id: 'usr_developer',
      title: 'Pulp Fiction',
      year: 1994,
      genre: 'Crime, Drama',
      director: 'Quentin Tarantino',
      duration: '154 min',
      rating: 8.9,
      cover: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=400',
      description: 'The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.'
    }
  ];

  const checkMovie = db.prepare('SELECT id FROM movies WHERE id = ?');
  const insertMovie = db.prepare(`
    INSERT INTO movies (id, user_id, title, year, genre, director, duration, rating, cover, description, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  defaultMovies.forEach(mov => {
    const existing = checkMovie.get(mov.id);
    if (!existing) {
      insertMovie.run(
        mov.id,
        mov.user_id,
        mov.title,
        mov.year,
        mov.genre,
        mov.director,
        mov.duration,
        mov.rating,
        mov.cover,
        mov.description,
        now
      );

      logActivity(
        mov.user_id,
        'admin',
        'MOVIE_SEED',
        `Pre-seeded classic movie "${mov.title}" into CineManage catalog.`,
        '127.0.0.1'
      );
    }
  });
}

// User registration
export function registerUser(usernameInput: string, passwordInput: string, displayNameInput: string, emailInput: string | null): { success: boolean; error?: string; user?: UserProfile } {
  const username = usernameInput.trim().toLowerCase();
  if (!username || username.length < 3) {
    return { success: false, error: 'Username must be at least 3 characters.' };
  }
  if (!passwordInput || passwordInput.length < 4) {
    return { success: false, error: 'Password must be at least 4 characters.' };
  }

  // Check unique username
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    return { success: false, error: 'Username is already taken.' };
  }

  const userId = `usr_${Date.now().toString(36)}`;
  const passwordHash = hashPassword(passwordInput);
  const now = new Date().toLocaleString();
  const avatarUrl = `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 999999)}?w=150`;

  db.prepare(`
    INSERT INTO users (id, username, password_hash, display_name, email, avatar_url, bio, location, website, favorite_genres, updated_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    userId,
    username,
    passwordHash,
    displayNameInput.trim() || username,
    emailInput ? emailInput.trim() : null,
    avatarUrl,
    'Hey there! I just joined the secure SQLite Profile Hub.',
    'Earth',
    '',
    'Adventure, Sci-Fi',
    now,
    now
  );

  const createdUser = getUserById(userId);
  return { success: true, user: createdUser };
}

// User credentials authentication
export function authenticateUser(usernameInput: string, passwordInput: string): { success: boolean; error?: string; user?: UserProfile } {
  const username = usernameInput.trim().toLowerCase();
  const userRecord = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;

  if (!userRecord) {
    return { success: false, error: 'User does not exist.' };
  }

  const inputHash = hashPassword(passwordInput);
  if (userRecord.password_hash !== inputHash) {
    return { success: false, error: 'Invalid password.' };
  }

  const userProfile: UserProfile = {
    id: userRecord.id,
    username: userRecord.username,
    display_name: userRecord.display_name,
    email: userRecord.email,
    avatar_url: userRecord.avatar_url,
    bio: userRecord.bio,
    location: userRecord.location,
    website: userRecord.website,
    favorite_genres: userRecord.favorite_genres,
    updated_at: userRecord.updated_at,
    created_at: userRecord.created_at
  };

  return { success: true, user: userProfile };
}

export function getUserById(id: string): UserProfile | undefined {
  const userRecord = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
  if (!userRecord) return undefined;

  return {
    id: userRecord.id,
    username: userRecord.username,
    display_name: userRecord.display_name,
    email: userRecord.email,
    avatar_url: userRecord.avatar_url,
    bio: userRecord.bio,
    location: userRecord.location,
    website: userRecord.website,
    favorite_genres: userRecord.favorite_genres,
    updated_at: userRecord.updated_at,
    created_at: userRecord.created_at
  };
}

export function updateUserProfile(id: string, updates: {
  display_name: string;
  email: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  favorite_genres: string | null;
}) {
  const now = new Date().toLocaleString();
  db.prepare(`
    UPDATE users
    SET display_name = ?,
        email = ?,
        bio = ?,
        location = ?,
        website = ?,
        favorite_genres = ?,
        updated_at = ?
    WHERE id = ?
  `).run(
    updates.display_name,
    updates.email,
    updates.bio,
    updates.location,
    updates.website,
    updates.favorite_genres,
    now,
    id
  );
  return getUserById(id);
}

export function logActivity(userId: string | null, username: string, action: string, details: string, ipAddress: string) {
  db.prepare(`
    INSERT INTO activity_logs (user_id, username, action, details, ip_address)
    VALUES (?, ?, ?, ?, ?)
  `).run(userId, username, action, details, ipAddress);
}

export function getActivityLogs(limit = 50): ActivityLog[] {
  return db.prepare('SELECT * FROM activity_logs ORDER BY id DESC LIMIT ?').all(limit) as ActivityLog[];
}

export function clearActivityLogs() {
  db.prepare('DELETE FROM activity_logs').run();
  logActivity(null, 'SYSTEM', 'CLEAR_LOGS', 'Activity logs cleared manually by developer.', '127.0.0.1');
}

// Movie CRUD database helpers
export function getMovies(): Movie[] {
  return db.prepare('SELECT * FROM movies ORDER BY created_at DESC').all() as Movie[];
}

export function getMovieById(id: string): Movie | undefined {
  return db.prepare('SELECT * FROM movies WHERE id = ?').get(id) as Movie | undefined;
}

export function createMovie(userId: string, movie: {
  title: string;
  year: number;
  genre: string;
  director: string;
  duration: string;
  rating: number;
  cover: string;
  description: string;
}): Movie {
  const movieId = `mov_${Date.now().toString(36)}`;
  const now = new Date().toLocaleString();
  db.prepare(`
    INSERT INTO movies (id, user_id, title, year, genre, director, duration, rating, cover, description, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    movieId,
    userId,
    movie.title,
    movie.year,
    movie.genre,
    movie.director,
    movie.duration,
    movie.rating,
    movie.cover || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400',
    movie.description,
    now
  );
  return getMovieById(movieId)!;
}

export function updateMovie(id: string, updates: {
  title: string;
  year: number;
  genre: string;
  director: string;
  duration: string;
  rating: number;
  cover: string;
  description: string;
}): Movie | undefined {
  db.prepare(`
    UPDATE movies
    SET title = ?,
        year = ?,
        genre = ?,
        director = ?,
        duration = ?,
        rating = ?,
        cover = ?,
        description = ?
    WHERE id = ?
  `).run(
    updates.title,
    updates.year,
    updates.genre,
    updates.director,
    updates.duration,
    updates.rating,
    updates.cover,
    updates.description,
    id
  );
  return getMovieById(id);
}

export function deleteMovie(id: string): boolean {
  const result = db.prepare('DELETE FROM movies WHERE id = ?').run(id);
  return result.changes > 0;
}

