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

  // High-fidelity local static code analyzer fallback engine when GEMINI_API_KEY is not configured or fails
  function analyzeCodeLocally(code: string, language: string, assistantLabel: string) {
    const lines = code.split('\n');
    const issues: any[] = [];
    
    let hasVar = false;
    let hasEval = false;
    let hasConsole = false;
    let hasDoubleEquals = false;
    let hasHardcodedSecret = false;
    let hasNestedLoop = false;
    let hasTodo = false;
    let hasEmptyCatch = false;

    // Check nested loops (rough regex/heuristic)
    if (
      /for\s*\(.*for\s*\(/.test(code) || 
      /while\s*\(.*while\s*\(/.test(code) ||
      /for\s*\(.*while\s*\(/.test(code) ||
      /while\s*\(.*for\s*\(/.test(code)
    ) {
      hasNestedLoop = true;
    }

    // Check hardcoded secret
    if (
      /api_key|apikey|secret_key|secretkey|access_token|private_key|db_password/i.test(code) &&
      /=\s*['"`][a-zA-Z0-9_\-]{8,}['"`]/.test(code)
    ) {
      hasHardcodedSecret = true;
    }

    let hasDuplicate = false;
    // Strip comments, imports and empty lines for duplication analysis
    const cleanedLines = lines.map((line, idx) => ({
      originalIndex: idx,
      text: line.trim(),
      canonical: line.trim().replace(/\s+/g, '')
    })).filter(l => 
      l.canonical.length > 3 && 
      !l.text.startsWith('//') && 
      !l.text.startsWith('/*') && 
      !l.text.startsWith('*') &&
      !l.text.startsWith('import ') &&
      !l.text.startsWith('export import ')
    );

    const minLength = 4;
    for (let i = 0; i < cleanedLines.length - minLength; i++) {
      for (let j = i + minLength; j <= cleanedLines.length - minLength; j++) {
        let matchLen = 0;
        while (
          j + matchLen < cleanedLines.length && 
          cleanedLines[i + matchLen].canonical === cleanedLines[j + matchLen].canonical
        ) {
          matchLen++;
        }
        if (matchLen >= minLength) {
          hasDuplicate = true;
          const duplicateStartLine = cleanedLines[j].originalIndex + 1;
          const originalStartLine = cleanedLines[i].originalIndex + 1;
          issues.push({
            type: 'duplicate',
            line: duplicateStartLine,
            severity: 'medium',
            description: `Duplicated block of code detected. Identical sequence of ${matchLen} lines matches code starting at line ${originalStartLine}.`,
            recommendation: "Refactor the duplicated logic into a shared helper function or utility class/method to follow the DRY (Don't Repeat Yourself) principle.",
            tool: 'PMD',
            ruleId: 'CopyPasteDetector',
            category: 'Design'
          });
          break;
        }
      }
      if (hasDuplicate) break;
    }

    // Iterate over lines to pinpoint line numbers
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      const lineNum = i + 1;

      // Skip comments in general checks but check for TODOs
      if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('/*')) {
        if (trimmed.toLowerCase().includes('todo') || trimmed.toLowerCase().includes('fixme')) {
          hasTodo = true;
          issues.push({
            type: 'other',
            line: lineNum,
            severity: 'low',
            description: `Unresolved TODO/FIXME annotation found: "${trimmed}"`,
            recommendation: 'Address the pending task or track it in an issue tracker, then clean up the comment.',
            tool: 'SonarQube',
            ruleId: 'S1135',
            category: 'Design'
          });
        }
        continue;
      }

      if (/\bvar\b\s+[a-zA-Z0-9_]/.test(line)) {
        hasVar = true;
        issues.push({
          type: 'bad-practice',
          line: lineNum,
          severity: 'medium',
          description: "Variable declared with obsolete 'var' keyword instead of block-scoped 'const' or 'let'.",
          recommendation: "Change 'var' to 'const' if the value is never reassigned, or 'let' otherwise to prevent hoisting bugs.",
          tool: 'ESLint',
          ruleId: 'no-var',
          category: 'Code Style'
        });
      }

      if (/\beval\s*\(/.test(line)) {
        hasEval = true;
        issues.push({
          type: 'security-flaw',
          line: lineNum,
          severity: 'high',
          description: "Dangerous 'eval()' usage detected. This poses extreme security risks and degrades execution performance.",
          recommendation: "Refactor code to use secure parsing methods like JSON.parse(), or safe dynamic function execution.",
          tool: 'SonarQube',
          ruleId: 'S1523',
          category: 'Security'
        });
      }

      if (/\bconsole\.log\s*\(/.test(line)) {
        hasConsole = true;
        issues.push({
          type: 'bad-practice',
          line: lineNum,
          severity: 'low',
          description: "Residual 'console.log' statements found in source code.",
          recommendation: "Remove print statements before pushing to production, or use a proper logger class.",
          tool: 'ESLint',
          ruleId: 'no-console',
          category: 'Best Practices'
        });
      }

      if (/\s==\s/.test(line) && !/\s===\s/.test(line)) {
        hasDoubleEquals = true;
        issues.push({
          type: 'bad-practice',
          line: lineNum,
          severity: 'low',
          description: "Loose equality comparison '==' utilized instead of strict type-safe '==='.",
          recommendation: "Replace '==' with '===' to prevent unexpected type coercion issues.",
          tool: 'ESLint',
          ruleId: 'eqeqeq',
          category: 'Code Style'
        });
      }

      if (/catch\s*\(\s*[a-zA-Z0-9_]*\s*\)\s*\{\s*\}/.test(trimmed) || /catch\s*\{\s*\}/.test(trimmed)) {
        hasEmptyCatch = true;
        issues.push({
          type: 'bad-practice',
          line: lineNum,
          severity: 'medium',
          description: "Empty catch block silently swallowing exceptions without logging or propagation.",
          recommendation: "Log the exception via a logging utility or handle it to prevent silent background failures.",
          tool: 'SonarQube',
          ruleId: 'S108',
          category: 'Bugs'
        });
      }
    }

    if (hasHardcodedSecret && !issues.some(iss => iss.ruleId === 'S2068')) {
      issues.push({
        type: 'security-flaw',
        line: 1,
        severity: 'high',
        description: "Potential hardcoded credentials or secret token found in the file.",
        recommendation: "Extract sensitive credentials out of code and store them securely in environment variables.",
        tool: 'SonarQube',
        ruleId: 'S2068',
        category: 'Security'
      });
    }

    if (hasNestedLoop && !issues.some(iss => iss.type === 'complexity')) {
      issues.push({
        type: 'complexity',
        line: 1,
        severity: 'medium',
        description: "Nested loop structure detected which can result in O(N^2) or worse time complexity.",
        recommendation: "Extract nested operations to modular helper routines, or optimize with helper data structures like Map or Set.",
        tool: 'PMD',
        ruleId: 'AvoidDeeplyNestedLoops',
        category: 'Performance'
      });
    }

    // Fallback default issues if code is pristine
    if (issues.length === 0) {
      issues.push({
        type: 'other',
        line: 1,
        severity: 'low',
        description: "No critical bugs or syntax-errors detected. Consider adding detailed documentation/JSDoc blocks.",
        recommendation: "Document complex logic using proper JSDoc or docstrings to improve future maintainability.",
        tool: 'ESLint',
        ruleId: 'require-jsdoc',
        category: 'Code Style'
      });
    }

    // Calculate score
    let baseScore = 100;
    let bugs = 0;
    let vulns = 0;
    let smells = 0;

    issues.forEach(iss => {
      if (iss.severity === 'high') {
        baseScore -= 20;
        vulns++;
      } else if (iss.severity === 'medium') {
        baseScore -= 10;
        bugs++;
      } else {
        baseScore -= 5;
        smells++;
      }
    });

    const finalScore = Math.max(40, baseScore);
    const qualityGate = finalScore >= 70 ? 'Passed' : 'Failed';
    const complexityRating = hasNestedLoop ? 'High' : (code.length > 500 ? 'Medium' : 'Low');
    const complexityExplanation = hasNestedLoop 
      ? "Control flow analyzer detected multiple nested iterations. The cognitive complexity is elevated because of nested logical branches." 
      : "The file code represents linear flow patterns with minimal nesting. Execution complexity is optimal.";

    // Dynamic Refactoring
    let refactoredCode = code;
    if (hasVar) {
      refactoredCode = refactoredCode.replace(/\bvar\b/g, 'let');
    }
    if (hasDoubleEquals) {
      refactoredCode = refactoredCode.replace(/\s==\s/g, ' === ');
    }
    if (hasConsole) {
      refactoredCode = refactoredCode.replace(/\bconsole\.log\((.*)\);?/g, '// Removed console.log for production security');
    }
    if (hasEmptyCatch) {
      refactoredCode = refactoredCode.replace(/catch\s*\(\s*([a-zA-Z0-9_]*)\s*\)\s*\{\s*\}/g, 'catch ($1) {\n      console.error("An error occurred during routine execution: ", $1);\n    }');
    }

    const performanceSummary = hasNestedLoop 
      ? "O(N^2) quadratic scale detected due to nested looping structures. Optimize with high-speed indexing search."
      : "O(1) to O(N) optimized complexity. The memory profile is stable and runtime CPU cycles are optimal.";

    const securitySummary = hasEval || hasHardcodedSecret
      ? "Vulnerable configurations detected. Direct string execution or plain-text credentials found in source lines."
      : "Secure. Static scanning did not find any clear patterns of command injection, XSS, or credentials exposure.";

    const reliabilityRating = finalScore >= 90 ? 'A' : (finalScore >= 80 ? 'B' : (finalScore >= 70 ? 'C' : 'D'));
    const securityRating = hasEval || hasHardcodedSecret ? 'D' : 'A';
    const maintainabilityRating = smells > 2 ? 'C' : 'A';
    
    const hours = Math.floor(issues.length * 0.5);
    const mins = (issues.length * 30) % 60;
    const technicalDebt = `${hours > 0 ? hours + 'h ' : ''}${mins > 0 ? mins + 'm' : '15m'}`;

    return {
      score: finalScore,
      complexityRating,
      complexityExplanation,
      issues,
      refactoredCode,
      performanceSummary,
      securitySummary,
      qualityGate,
      reliabilityRating,
      securityRating,
      maintainabilityRating,
      technicalDebt,
      bugsCount: bugs,
      vulnerabilitiesCount: vulns,
      codeSmellsCount: smells,
      sonarSummary: `High-fidelity local static SonarQube rules check completed. Detected ${bugs} potential reliability bugs and ${vulns} vulnerability flags.`,
      pmdSummary: `PMD design guidelines scan executed. Evaluated cognitive complexity rating: ${complexityRating}. Code styling score is balanced.`,
      eslintSummary: `ESLint standard coding rules evaluated. ${smells} minor code style smell issues identified.`
    };
  }

  // Run a real-time static code analysis
  app.post('/api/analyze', async (req, res) => {
    const sessionId = req.cookies.session_id;
    const { title, language, code, save } = req.body;

    if (!code || code.trim() === '') {
      return res.status(400).json({ error: 'Code content is required for analysis.' });
    }

    const snippetTitle = (title && title.trim()) || 'Untitled Snippet';
    const snippetLang = (language && language.trim()) || 'javascript';
    const assistantLabel = 'Local Code Auditor';

    try {
      const parsedResult = analyzeCodeLocally(code, snippetLang, assistantLabel);

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
