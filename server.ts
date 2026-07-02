import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import {
  initDb,
  getUserById,
  authenticateUser,
  registerUser,
  updateUserProfile,
  logActivity,
  getActivityLogs,
  clearActivityLogs,
  getMovies,
  createMovie,
  updateMovie,
  deleteMovie,
  db
} from './src/db';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize SQLite database and seed initial profiles
  initDb();

  app.use(express.json());
  app.use(cookieParser());

  // Helper to extract clean client IP
  const getClientIp = (req: express.Request): string => {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      const first = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
      return first.trim();
    }
    return req.socket.remoteAddress || '127.0.0.1';
  };

  // Helper to determine cookie security options dynamically (supports local HTTP and secure Cloud HTTPS)
  const getCookieOptions = (req: express.Request) => {
    return {
      secure: true,
      sameSite: 'none' as const,
      httpOnly: true
    };
  };

  // --- API ROUTES ---

  // Check current user session
  app.get('/api/session', (req, res) => {
    const sessionId = req.cookies.session_id;
    if (!sessionId) {
      return res.json({ user: null });
    }

    const user = getUserById(sessionId);
    if (!user) {
      // Clear invalid cookie
      res.clearCookie('session_id', getCookieOptions(req));
      return res.json({ user: null });
    }

    res.json({ user });
  });

  // Database login (Credentials verification)
  app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const result = authenticateUser(username, password);

    if (!result.success || !result.user) {
      return res.status(401).json({ error: result.error || 'Authentication failed.' });
    }

    // Set secure session cookie
    res.cookie('session_id', result.user.id, {
      ...getCookieOptions(req),
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    const ip = getClientIp(req);
    logActivity(
      result.user.id,
      result.user.username,
      'LOGIN_SUCCESS',
      `User authenticated successfully. ID: ${result.user.id}`,
      ip
    );

    res.json({ user: result.user });
  });

  // Database register (Credentials creation)
  app.post('/api/register', (req, res) => {
    const { username, password, display_name, email } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const result = registerUser(username, password, display_name || username, email || null);

    if (!result.success || !result.user) {
      return res.status(400).json({ error: result.error || 'Registration failed.' });
    }

    // Automatically set session cookie on successful registration
    res.cookie('session_id', result.user.id, {
      ...getCookieOptions(req),
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    const ip = getClientIp(req);
    logActivity(
      result.user.id,
      result.user.username,
      'REGISTER_SUCCESS',
      `Registered new secure user account. Display Name: "${result.user.display_name}"`,
      ip
    );

    res.json({ user: result.user });
  });

  // Logout endpoint
  app.post('/api/logout', (req, res) => {
    const sessionId = req.cookies.session_id;
    if (sessionId) {
      const user = getUserById(sessionId);
      const username = user ? user.username : 'Unknown';
      const ip = getClientIp(req);
      logActivity(
        sessionId,
        username,
        'LOGOUT',
        'User successfully signed out.',
        ip
      );
    }

    res.clearCookie('session_id', getCookieOptions(req));
    res.json({ success: true });
  });

  // Update profile endpoint
  app.post('/api/profile', (req, res) => {
    const sessionId = req.cookies.session_id;
    if (!sessionId) {
      return res.status(401).json({ error: 'Unauthorized session' });
    }

    const { display_name, email, bio, location, website, favorite_genres } = req.body;
    if (!display_name || display_name.trim() === '') {
      return res.status(400).json({ error: 'Display name cannot be empty' });
    }

    const user = getUserById(sessionId);
    if (!user) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    const updatedUser = updateUserProfile(sessionId, {
      display_name: display_name.trim(),
      email: email ? email.trim() : null,
      bio: bio ? bio.trim() : null,
      location: location ? location.trim() : null,
      website: website ? website.trim() : null,
      favorite_genres: favorite_genres ? favorite_genres.trim() : null
    });

    const ip = getClientIp(req);
    logActivity(
      sessionId,
      user.username,
      'PROFILE_UPDATE',
      `Updated profile fields: Display Name="${display_name.trim()}", Email="${email || ''}", Genres="${favorite_genres || ''}"`,
      ip
    );

    res.json({ user: updatedUser });
  });

  // Fetch real-time activity logs
  app.get('/api/logs', (req, res) => {
    const logs = getActivityLogs(100);
    res.json({ logs });
  });

  // Inject a custom activity log (simulated system/user database write event)
  app.post('/api/logs', (req, res) => {
    const sessionId = req.cookies.session_id;
    const user = sessionId ? getUserById(sessionId) : null;
    const username = user ? user.username : 'Guest';
    const { action, details } = req.body;

    if (!action || !details) {
      return res.status(400).json({ error: 'Action and details are required' });
    }

    const ip = getClientIp(req);
    logActivity(sessionId, username, action.trim(), details.trim(), ip);
    res.json({ success: true });
  });

  // Clear activity logs (privileged action)
  app.post('/api/logs/clear', (req, res) => {
    const sessionId = req.cookies.session_id;
    const user = sessionId ? getUserById(sessionId) : null;
    const username = user ? user.username : 'Guest';
    const ip = getClientIp(req);

    clearActivityLogs();
    logActivity(
      sessionId,
      username,
      'CLEAR_LOGS',
      `Activity logs wiped by authenticated user: @${username}`,
      ip
    );

    res.json({ success: true });
  });

  // --- MOVIE CRUD API ROUTES ---

  // Get all movies in the CineManage collection
  app.get('/api/movies', (req, res) => {
    try {
      const movies = getMovies();
      res.json({ movies });
    } catch (err: any) {
      console.error('Error fetching movies:', err);
      res.status(500).json({ error: 'Failed to fetch movies from SQLite DB.' });
    }
  });

  // Create a new movie in the CineManage database
  app.post('/api/movies', (req, res) => {
    const sessionId = req.cookies.session_id;
    if (!sessionId) {
      return res.status(401).json({ error: 'Unauthorized session' });
    }

    const user = getUserById(sessionId);
    if (!user) {
      return res.status(401).json({ error: 'User does not exist.' });
    }

    const { title, year, genre, director, duration, rating, cover, description } = req.body;
    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Movie title is required.' });
    }

    const parsedYear = parseInt(year);
    if (isNaN(parsedYear) || parsedYear > 2026) {
      return res.status(400).json({ error: 'Movie release year cannot be in the future (> 2026).' });
    }

    const hasNegativeNumber = (str: string) => {
      const numbers = str.match(/\-?\d+/g);
      if (numbers) {
        return numbers.some(n => parseInt(n) < 0);
      }
      return false;
    };

    if (duration && hasNegativeNumber(duration)) {
      return res.status(400).json({ error: 'Movie duration cannot contain negative values.' });
    }

    try {
      const newMovie = createMovie(sessionId, {
        title: title.trim(),
        year: parsedYear,
        genre: genre ? genre.trim() : 'Unknown',
        director: director ? director.trim() : 'Unknown',
        duration: duration ? duration.trim() : 'N/A',
        rating: parseFloat(rating) || 0.0,
        cover: cover ? cover.trim() : '',
        description: description ? description.trim() : ''
      });

      const ip = getClientIp(req);
      logActivity(
        sessionId,
        user.username,
        'MOVIE_ADD',
        `Successfully added film "${newMovie.title}" (${newMovie.year}) to SQLite catalog.`,
        ip
      );

      res.status(201).json({ movie: newMovie });
    } catch (err) {
      console.error('Error adding movie:', err);
      res.status(500).json({ error: 'Database write failure.' });
    }
  });

  // Update movie metadata
  app.put('/api/movies/:id', (req, res) => {
    const sessionId = req.cookies.session_id;
    if (!sessionId) {
      return res.status(401).json({ error: 'Unauthorized session' });
    }

    const user = getUserById(sessionId);
    if (!user) {
      return res.status(401).json({ error: 'User does not exist.' });
    }

    const { id } = req.params;
    const { title, year, genre, director, duration, rating, cover, description } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Movie title is required' });
    }

    const parsedYear = parseInt(year);
    if (isNaN(parsedYear) || parsedYear > 2026) {
      return res.status(400).json({ error: 'Movie release year cannot be in the future (> 2026).' });
    }

    const hasNegativeNumber = (str: string) => {
      const numbers = str.match(/\-?\d+/g);
      if (numbers) {
        return numbers.some(n => parseInt(n) < 0);
      }
      return false;
    };

    if (duration && hasNegativeNumber(duration)) {
      return res.status(400).json({ error: 'Movie duration cannot contain negative values.' });
    }

    try {
      const updatedMovie = updateMovie(id, {
        title: title.trim(),
        year: parsedYear,
        genre: genre ? genre.trim() : 'Unknown',
        director: director ? director.trim() : 'Unknown',
        duration: duration ? duration.trim() : 'N/A',
        rating: parseFloat(rating) || 0.0,
        cover: cover ? cover.trim() : '',
        description: description ? description.trim() : ''
      });

      if (!updatedMovie) {
        return res.status(404).json({ error: 'Movie not found.' });
      }

      const ip = getClientIp(req);
      logActivity(
        sessionId,
        user.username,
        'MOVIE_UPDATE',
        `Updated details for film "${updatedMovie.title}" in SQLite database.`,
        ip
      );

      res.json({ movie: updatedMovie });
    } catch (err) {
      console.error('Error updating movie:', err);
      res.status(500).json({ error: 'Database update failure.' });
    }
  });

  // Delete a movie from CineManage
  app.delete('/api/movies/:id', (req, res) => {
    const sessionId = req.cookies.session_id;
    if (!sessionId) {
      return res.status(401).json({ error: 'Unauthorized session' });
    }

    const user = getUserById(sessionId);
    if (!user) {
      return res.status(401).json({ error: 'User does not exist.' });
    }

    const { id } = req.params;

    try {
      const targetMovie = db.prepare('SELECT title FROM movies WHERE id = ?').get(id) as any;
      const movieTitle = targetMovie ? targetMovie.title : 'Unknown Film';

      const success = deleteMovie(id);
      if (!success) {
        return res.status(404).json({ error: 'Movie not found.' });
      }

      const ip = getClientIp(req);
      logActivity(
        sessionId,
        user.username,
        'MOVIE_DELETE',
        `Removed film "${movieTitle}" (ID: ${id}) from secure SQLite store.`,
        ip
      );

      res.json({ success: true });
    } catch (err) {
      console.error('Error deleting movie:', err);
      res.status(500).json({ error: 'Database delete failure.' });
    }
  });

  // --- VITE MIDDLEWARE SETUP ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server successfully started at port ${PORT}`);
  });
}

startServer();
