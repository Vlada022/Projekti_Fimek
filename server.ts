import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
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
  getCodeAnalyses,
  getCodeAnalysisById,
  createCodeAnalysis,
  deleteCodeAnalysis,
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

  // Run a real-time AI code analysis
  app.post('/api/analyze', async (req, res) => {
    const sessionId = req.cookies.session_id;
    const { title, language, code, save, aiAssistant } = req.body;

    if (!code || code.trim() === '') {
      return res.status(400).json({ error: 'Code content is required for analysis.' });
    }

    const snippetTitle = (title && title.trim()) || 'Untitled Snippet';
    const snippetLang = (language && language.trim()) || 'javascript';
    const activeAssistant = aiAssistant === 'codeium' ? 'codeium' : 'gemini';
    const assistantLabel = activeAssistant === 'codeium' ? 'Codeium Assistant' : 'Gemini 3.5';

    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server. Please add it to your secrets.' });
      }

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const systemInstruction = activeAssistant === 'codeium'
        ? `You are Codeium Assistant, an elite AI coding companion, software architect, and static analysis compiler expert.
Analyze the provided code using Codeium's high-speed contextual intelligence and evaluate it against three specific linting and static analysis standards:
1. SonarQube Static Analysis Rules: Identify Bugs (reliability), Vulnerabilities/Security Hotspots (security), and Code Smells (maintainability). Calculate SonarQube ratings (A to E) for Reliability, Security, and Maintainability. Estimate Technical Debt (e.g. "2h 15m" or "30m"). Determine if it passes the Quality Gate (Passed/Failed).
2. PMD Static Analyzer Rules: Evaluate style, code complexity, error-proneness, performance-prone designs, and multithreading safety. Categorize violations by PMD categories (e.g., Best Practices, Code Style, Design, Error Prone, Performance, Security).
3. ESLint rules: Scan for syntax issues, unused elements, non-standard constructs, scoping issues, or style warnings (e.g., eqeqeq, no-unused-vars, no-eval).

For every issue found, assign it to one of these three tools: 'SonarQube', 'PMD', or 'ESLint'. Specify the rule ID (e.g., 'S1145', 'eqeqeq', 'UseCollectionIsEmpty') and rule category (e.g., 'Bugs', 'Code Style', 'Design', 'Performance').

Provide a fully refactored, optimized version of the code resolving all violations. Output strict, valid JSON matching the schema. Feel free to inject Codeium-optimized performance design feedback inside the responses.`
        : `You are an elite software architect, compiler engineer, and an advanced static code analysis system integrating SonarQube, PMD, and ESLint rulesets.
Analyze the provided code and evaluate it against three specific linting and static analysis standards:
1. SonarQube Static Analysis Rules: Identify Bugs (reliability), Vulnerabilities/Security Hotspots (security), and Code Smells (maintainability). Calculate SonarQube ratings (A to E) for Reliability, Security, and Maintainability. Estimate Technical Debt (e.g. "2h 15m" or "30m"). Determine if it passes the Quality Gate (Passed/Failed).
2. PMD Static Analyzer Rules: Evaluate style, code complexity, error-proneness, performance-prone designs, and multithreading safety. Categorize violations by PMD categories (e.g., Best Practices, Code Style, Design, Error Prone, Performance, Security).
3. ESLint rules: Scan for syntax issues, unused elements, non-standard constructs, scoping issues, or style warnings (e.g., eqeqeq, no-unused-vars, no-eval).

For every issue found, assign it to one of these three tools: 'SonarQube', 'PMD', or 'ESLint'. Specify the rule ID (e.g., 'S1145', 'eqeqeq', 'UseCollectionIsEmpty') and rule category (e.g., 'Bugs', 'Code Style', 'Design', 'Performance').

Provide a fully refactored, optimized version of the code resolving all violations. Output strict, valid JSON matching the schema.`;

      const prompt = `Analyze the following code snippet of language "${snippetLang}":\n\n\`\`\`${snippetLang}\n${code}\n\`\`\``;

      const geminiResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { 
                type: Type.INTEGER, 
                description: "Overall quality score from 0 to 100" 
              },
              complexityRating: { 
                type: Type.STRING, 
                description: "Must be exactly 'Low', 'Medium', or 'High'" 
              },
              complexityExplanation: { 
                type: Type.STRING, 
                description: "Detailed explanation of cognitive complexity and nesting depth." 
              },
              issues: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { 
                      type: Type.STRING, 
                      description: "Must be exactly 'duplicate', 'bad-practice', 'complexity', 'syntax-error', 'security-flaw', or 'other'" 
                    },
                    line: { 
                      type: Type.INTEGER, 
                      description: "Estimated 1-indexed line number where the issue starts" 
                    },
                    severity: { 
                      type: Type.STRING, 
                      description: "Must be exactly 'low', 'medium', or 'high'" 
                    },
                    description: { 
                      type: Type.STRING, 
                      description: "Description of the specific code quality issue" 
                    },
                    recommendation: { 
                      type: Type.STRING, 
                      description: "Clear and actionable refactoring recommendation" 
                    },
                    tool: {
                      type: Type.STRING,
                      description: "Must be exactly 'SonarQube', 'PMD', or 'ESLint'"
                    },
                    ruleId: {
                      type: Type.STRING,
                      description: "Specific rule code or ID (e.g., S1145, eqeqeq, UseCollectionIsEmpty)"
                    },
                    category: {
                      type: Type.STRING,
                      description: "Category of rule (e.g., Bugs, Design, Security, Performance)"
                    }
                  },
                  required: ["type", "line", "severity", "description", "recommendation", "tool", "ruleId", "category"]
                }
              },
              refactoredCode: { 
                type: Type.STRING, 
                description: "The complete, optimized, refactored code block with clean formatting" 
              },
              performanceSummary: { 
                type: Type.STRING, 
                description: "Assessment of Big-O complexity and performance bottlenecks" 
              },
              securitySummary: { 
                type: Type.STRING, 
                description: "Vulnerability analysis or 'Secure' if no issues found" 
              },
              qualityGate: {
                type: Type.STRING,
                description: "Must be exactly 'Passed' or 'Failed'"
              },
              reliabilityRating: {
                type: Type.STRING,
                description: "SonarQube Reliability Rating. Must be exactly 'A', 'B', 'C', 'D', or 'E'"
              },
              securityRating: {
                type: Type.STRING,
                description: "SonarQube Security Rating. Must be exactly 'A', 'B', 'C', 'D', or 'E'"
              },
              maintainabilityRating: {
                type: Type.STRING,
                description: "SonarQube Maintainability Rating. Must be exactly 'A', 'B', 'C', 'D', or 'E'"
              },
              technicalDebt: {
                type: Type.STRING,
                description: "Estimated technical debt (e.g., '1h 30m', '15m')"
              },
              bugsCount: {
                type: Type.INTEGER,
                description: "Number of SonarQube Bugs detected"
              },
              vulnerabilitiesCount: {
                type: Type.INTEGER,
                description: "Number of SonarQube Vulnerabilities detected"
              },
              codeSmellsCount: {
                type: Type.INTEGER,
                description: "Number of SonarQube Code Smells detected"
              },
              sonarSummary: {
                type: Type.STRING,
                description: "A summary of SonarQube perspective findings"
              },
              pmdSummary: {
                type: Type.STRING,
                description: "A summary of PMD perspective findings"
              },
              eslintSummary: {
                type: Type.STRING,
                description: "A summary of ESLint perspective findings"
              }
            },
            required: [
              "score", "complexityRating", "complexityExplanation", "issues", 
              "refactoredCode", "performanceSummary", "securitySummary",
              "qualityGate", "reliabilityRating", "securityRating", "maintainabilityRating",
              "technicalDebt", "bugsCount", "vulnerabilitiesCount", "codeSmellsCount",
              "sonarSummary", "pmdSummary", "eslintSummary"
            ]
          }
        }
      });

      const resultText = geminiResponse.text;
      if (!resultText) {
        throw new Error('Empty response from code analysis backend.');
      }

      const parsedResult = JSON.parse(resultText);

      let savedAnalysis = null;
      if (save && sessionId) {
        savedAnalysis = createCodeAnalysis({
          user_id: sessionId,
          title: snippetTitle,
          language: snippetLang,
          code: code,
          score: parsedResult.score,
          complexity_rating: parsedResult.complexityRating,
          analysis_json: JSON.stringify(parsedResult)
        });

        const user = getUserById(sessionId);
        const ip = getClientIp(req);
        logActivity(
          sessionId,
          user ? user.username : 'Guest',
          'CODE_ANALYZE_SAVE',
          `Ran and saved code quality audit via ${assistantLabel} for "${snippetTitle}" (${snippetLang}) with score ${parsedResult.score}%`,
          ip
        );
      } else if (sessionId) {
        const user = getUserById(sessionId);
        const ip = getClientIp(req);
        logActivity(
          sessionId,
          user ? user.username : 'Guest',
          'CODE_ANALYZE_RUN',
          `Ran code quality audit via ${assistantLabel} for "${snippetTitle}" (${snippetLang}) with score ${parsedResult.score}%`,
          ip
        );
      }

      res.json({
        success: true,
        result: parsedResult,
        saved: savedAnalysis
      });

    } catch (err: any) {
      console.error('Code Analysis Backend Error:', err);
      res.status(500).json({ error: err.message || 'An error occurred during code analysis.' });
    }
  });

  // Fetch all saved code analysis reports for the authenticated user
  app.get('/api/analyses', (req, res) => {
    const sessionId = req.cookies.session_id;
    if (!sessionId) {
      return res.status(401).json({ error: 'Unauthorized session' });
    }
    const analyses = getCodeAnalyses(sessionId);
    res.json({ analyses });
  });

  // Fetch details of a specific saved analysis
  app.get('/api/analyses/:id', (req, res) => {
    const sessionId = req.cookies.session_id;
    if (!sessionId) {
      return res.status(401).json({ error: 'Unauthorized session' });
    }
    const { id } = req.params;
    const analysis = getCodeAnalysisById(id);
    if (!analysis) {
      return res.status(404).json({ error: 'Saved analysis report not found.' });
    }
    if (analysis.user_id !== sessionId) {
      return res.status(403).json({ error: 'Access forbidden.' });
    }
    res.json({ analysis });
  });

  // Delete a saved analysis report
  app.delete('/api/analyses/:id', (req, res) => {
    const sessionId = req.cookies.session_id;
    if (!sessionId) {
      return res.status(401).json({ error: 'Unauthorized session' });
    }
    const { id } = req.params;
    const analysis = getCodeAnalysisById(id);
    if (!analysis) {
      return res.status(404).json({ error: 'Saved analysis report not found.' });
    }
    if (analysis.user_id !== sessionId) {
      return res.status(403).json({ error: 'Access forbidden.' });
    }

    deleteCodeAnalysis(id);

    const user = getUserById(sessionId);
    const ip = getClientIp(req);
    logActivity(
      sessionId,
      user ? user.username : 'Guest',
      'CODE_ANALYZE_DELETE',
      `Deleted saved analysis report "${analysis.title}" (${analysis.language})`,
      ip
    );

    res.json({ success: true });
  });

  // --- MOVIE CRUD API ROUTES ---

  // Get all movies in the Movie Finder & Review collection
  app.get('/api/movies', (req, res) => {
    try {
      const movies = getMovies();
      res.json({ movies });
    } catch (err: any) {
      console.error('Error fetching movies:', err);
      res.status(500).json({ error: 'Failed to fetch movies from SQLite DB.' });
    }
  });

  // Create a new movie in the Movie Finder & Review database
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

  // Delete a movie from Movie Finder & Review
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
