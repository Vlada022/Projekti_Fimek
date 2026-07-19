import React, { useState, useEffect } from 'react';
import { UserProfile, CodeAnalysis, CodeAnalysisResult, CodeIssue, Movie } from './types';
import LoginForm from './components/LoginForm';
import ProfilePanel from './components/ProfilePanel';
import MovieGrid from './components/MovieGrid';
import MovieForm from './components/MovieForm';
import MovieDetailsModal from './components/MovieDetailsModal';
import { 
  LogOut, 
  User, 
  Code, 
  Sparkles, 
  History, 
  Trash2, 
  Copy, 
  Check, 
  Play, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Activity, 
  Terminal, 
  ChevronRight, 
  Info,
  Layers,
  Cpu,
  ShieldCheck,
  ShieldAlert,
  Zap,
  RotateCcw,
  Film,
  PlusCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Predefined code snippets to facilitate testing and demoing themed around Movie Finder App code
const PRESET_SNIPPETS = [
  {
    name: 'Movie Search SQL Injection & Sync Block',
    language: 'typescript',
    title: 'movie-db-adapter.ts',
    code: `import Database from 'better-sqlite3';

export function searchAndFilterMovies(dbConnection: any, titleQuery: string, genreFilter: string) {
  // CRITICAL: SQL Injection Risk - Direct query concatenation of search input
  const query = "SELECT * FROM movies WHERE title LIKE '%" + titleQuery + "%' AND genre = '" + genreFilter + "'";
  console.log("Searching database with raw query: " + query);
  
  // Potential PMD violation: synchronous execution inside main event loop
  const statement = dbConnection.prepare(query);
  const results = statement.all();
  
  // ESLint Warning: unused variables left in local scope
  const cachedAt = new Date().toISOString();
  let debugCounter = 0;
  
  // Code smell: duplicate mapping logic
  const formattedResults = results.map((movie: any) => {
    return {
      id: movie.id,
      title: movie.title,
      year: parseInt(movie.year),
      genre: movie.genre || 'Uncategorized',
      director: movie.director || 'Unknown',
      rating: parseFloat(movie.rating)
    };
  });
  
  return formattedResults;
}`
  },
  {
    name: 'Movie Grid Complex Render & Keys Warning',
    language: 'javascript',
    title: 'MovieGridRenderer.jsx',
    code: `import React from 'react';

// ESLint and React warning: nested complex logic in render and missing unique React keys
export default function MovieGridRenderer({ moviesList, filterText, selectedGenre, onSelect }) {
  let displayedMovies = [];
  
  // Cognitive complexity design smell: deep nesting instead of early returns
  if (moviesList !== null && moviesList !== undefined) {
    if (moviesList.length > 0) {
      for (let i = 0; i < moviesList.length; i++) {
        if (moviesList[i].rating >= 0) {
          if (moviesList[i].title.toLowerCase().includes(filterText.toLowerCase())) {
            if (selectedGenre === 'All' || moviesList[i].genre === selectedGenre) {
              displayedMovies.push(moviesList[i]);
            }
          }
        }
      }
    }
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {displayedMovies.map((movie) => (
        // WARNING: Missing "key" prop on mapped element, and inline handler warning
        <div className="movie-card bg-neutral-900 p-4 rounded-xl border border-neutral-800">
          <h3 className="text-white font-bold">{movie.title}</h3>
          <p className="text-xs text-neutral-400">{movie.genre}</p>
          <button 
            onClick={() => {
              console.log("Selected movie " + movie.title);
              // BAD PRACTICE: direct DOM modification in React callback
              document.title = "Movie Finder & Review: " + movie.title;
              onSelect(movie);
            }} 
            className="mt-2 text-emerald-400 text-xs font-semibold"
          >
            View Details
          </button>
        </div>
      ))}
    </div>
  );
}`
  },
  {
    name: 'Movie Add Form Duplicate & State Mutation',
    language: 'typescript',
    title: 'MovieFormValidator.ts',
    code: `interface MovieInput {
  title: string;
  year: number;
  genre: string;
  rating: number;
}

export function validateMovieInputs(movie: MovieInput) {
  // SonarQube Code Smell: Highly redundant and duplicated validation logic blocks
  if (movie.genre === "Action") {
    console.log("Evaluating Action movie release validation rules...");
    if (!movie.title || movie.title.trim().length === 0) {
      return { valid: false, error: "Movie title cannot be empty" };
    }
    if (movie.year < 1888 || movie.year > 2030) {
      return { valid: false, error: "Invalid movie release year specified" };
    }
    if (movie.rating < 0 || movie.rating > 10) {
      return { valid: false, error: "Rating must be between 0 and 10" };
    }
    return { valid: true };
  } else if (movie.genre === "Sci-Fi") {
    console.log("Evaluating Sci-Fi movie release validation rules...");
    if (!movie.title || movie.title.trim().length === 0) {
      return { valid: false, error: "Movie title cannot be empty" };
    }
    if (movie.year < 1888 || movie.year > 2030) {
      return { valid: false, error: "Invalid movie release year specified" };
    }
    if (movie.rating < 0 || movie.rating > 10) {
      return { valid: false, error: "Rating must be between 0 and 10" };
    }
    return { valid: true };
  }
  
  // Fallback: direct object state mutation parameter
  movie.genre = "General";
  return { valid: true };
}`
  }
];

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'catalog' | 'analyzer' | 'history' | 'profile'>('catalog');
  const [analyses, setAnalyses] = useState<CodeAnalysis[]>([]);
  const [logs, setLogs] = useState<any[]>([]);

  // Movie catalog state
  const [movies, setMovies] = useState<Movie[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [movieToEdit, setMovieToEdit] = useState<Movie | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Analyzer Form & Result State
  const [aiAssistant, setAiAssistant] = useState<'codeium' | 'gemini'>('codeium');
  const [snippetTitle, setSnippetTitle] = useState('snippet.ts');
  const [snippetLanguage, setSnippetLanguage] = useState('typescript');
  const [snippetCode, setSnippetCode] = useState(PRESET_SNIPPETS[0].code);
  const [saveToHistory, setSaveToHistory] = useState(true);
  
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<CodeAnalysisResult | null>(null);
  const [activeResultTab, setActiveResultTab] = useState<'dashboard' | 'issues' | 'refactored' | 'performance' | 'security' | 'perspectives'>('dashboard');
  const [selectedToolFilter, setSelectedToolFilter] = useState<'all' | 'SonarQube' | 'PMD' | 'ESLint'>('all');
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Fetch Movies
  const fetchMovies = async () => {
    try {
      const res = await fetch('/api/movies');
      if (res.ok) {
        const data = await res.json();
        setMovies(data.movies || []);
      }
    } catch (err) {
      console.error('Error fetching movies:', err);
    }
  };

  // Movie submit handler (Add / Edit)
  const handleMovieSubmit = async (movieData: any): Promise<boolean> => {
    try {
      const url = movieToEdit ? `/api/movies/${movieToEdit.id}` : '/api/movies';
      const method = movieToEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(movieData)
      });
      if (res.ok) {
        await fetchMovies();
        await fetchLogs();
        setIsFormOpen(false);
        setMovieToEdit(null);
        return true;
      }
    } catch (err) {
      console.error('Error saving movie:', err);
    }
    return false;
  };

  // Movie delete handler
  const handleDeleteMovie = async (id: string) => {
    try {
      const res = await fetch(`/api/movies/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await fetchMovies();
        await fetchLogs();
        if (selectedMovie && selectedMovie.id === id) {
          setSelectedMovie(null);
        }
      }
    } catch (err) {
      console.error('Error deleting movie:', err);
    }
  };

  const handleStartEditMovie = (movie: Movie) => {
    setMovieToEdit(movie);
    setIsFormOpen(true);
  };

  const handleStartAddMovie = () => {
    setMovieToEdit(null);
    setIsFormOpen(true);
  };

  const handleLoadPresetToAnalyzer = (index: number) => {
    if (index >= 0 && index < PRESET_SNIPPETS.length) {
      const preset = PRESET_SNIPPETS[index];
      setSnippetTitle(preset.title);
      setSnippetLanguage(preset.language);
      setSnippetCode(preset.code);
      setActiveTab('analyzer');
      setAnalysisResult(null);
      setError(null);
    }
  };

  // Check Session
  const fetchSession = async () => {
    try {
      const res = await fetch('/api/session');
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        await fetchAnalyses();
        await fetchLogs();
        await fetchMovies();
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Session verification error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Saved Analyses
  const fetchAnalyses = async () => {
    try {
      const res = await fetch('/api/analyses');
      if (res.ok) {
        const data = await res.json();
        setAnalyses(data.analyses || []);
      }
    } catch (err) {
      console.error('Error fetching analyses:', err);
    }
  };

  // Fetch Activity Logs
  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Error loading logs:', err);
    }
  };

  // Clear Logs
  const handleClearLogs = async () => {
    try {
      const res = await fetch('/api/logs/clear', { method: 'POST' });
      if (res.ok) {
        await fetchLogs();
      }
    } catch (err) {
      console.error('Error clearing database activity logs:', err);
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      setUser(null);
      setAnalyses([]);
      setLogs([]);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Update Profile
  const handleUpdateProfile = async (updates: Partial<UserProfile>): Promise<boolean> => {
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          await fetchLogs();
          return true;
        }
      }
    } catch (err) {
      console.error('Error updating profile in SQLite database:', err);
    }
    return false;
  };

  // Run Code Analysis
  const handleRunAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!snippetCode || snippetCode.trim() === '') {
      setError('Please provide code content for analysis.');
      return;
    }

    setAnalyzing(true);
    setAnalysisResult(null);
    setError(null);

    // Dynamic messaging simulation to make load states highly interactive
    const statuses = aiAssistant === 'codeium' ? [
      'Tokenizing input code stream via Codeium Cortex...',
      'Mapping AST and looking for duplicate code blocks...',
      'Evaluating cognitive complexity algorithms...',
      'Scanning variables for potential SQL Injection & XSS vulnerabilities...',
      'Formulating Codeium AI refactoring proposals...',
      'Optimizing refactored code block architecture...'
    ] : [
      'Tokenizing input code stream...',
      'Mapping AST and looking for duplicate code blocks...',
      'Evaluating cognitive complexity algorithms...',
      'Scanning variables for potential SQL Injection & XSS vulnerabilities...',
      'Formulating Gemini refactoring proposals...',
      'Optimizing refactored code block architecture...'
    ];

    let currentMsgIndex = 0;
    setStatusMessage(statuses[0]);

    const messageInterval = setInterval(() => {
      currentMsgIndex = (currentMsgIndex + 1) % statuses.length;
      setStatusMessage(statuses[currentMsgIndex]);
    }, 1500);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: snippetTitle.trim() || 'snippet.ts',
          language: snippetLanguage,
          code: snippetCode,
          save: saveToHistory,
          aiAssistant: aiAssistant
        })
      });

      clearInterval(messageInterval);

      const data = await res.json();
      if (res.ok && data.success) {
        setAnalysisResult(data.result);
        setActiveResultTab('dashboard');
        if (saveToHistory) {
          await fetchAnalyses();
        }
        await fetchLogs();
      } else {
        setError(data.error || 'Failed to analyze code quality. Please verify server connectivity.');
      }
    } catch (err: any) {
      clearInterval(messageInterval);
      setError(err.message || 'Server connection timeout. Please check your API key configurations.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Copy refactored code to clipboard
  const handleCopyCode = () => {
    if (!analysisResult) return;
    navigator.clipboard.writeText(analysisResult.refactoredCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Load an analysis from history
  const handleLoadSavedAnalysis = (saved: CodeAnalysis) => {
    try {
      const parsed = JSON.parse(saved.analysis_json);
      setSnippetTitle(saved.title);
      setSnippetLanguage(saved.language);
      setSnippetCode(saved.code);
      setAnalysisResult(parsed);
      setActiveTab('analyzer');
      setActiveResultTab('dashboard');
      setError(null);
    } catch (err) {
      console.error('Error parsing historical analysis JSON:', err);
    }
  };

  // Delete an analysis from history
  const handleDeleteAnalysis = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/analyses/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchAnalyses();
        await fetchLogs();
      }
    } catch (err) {
      console.error('Error deleting saved analysis:', err);
    }
  };

  // Populate form with preset snippets
  const handleLoadPreset = (preset: typeof PRESET_SNIPPETS[0]) => {
    setSnippetTitle(preset.title);
    setSnippetLanguage(preset.language);
    setSnippetCode(preset.code);
    setAnalysisResult(null);
    setError(null);
  };

  useEffect(() => {
    fetchSession();
  }, []);

  // Poll logs and history when user is active
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      fetchAnalyses();
      fetchLogs();
      fetchMovies();
    }, 6000);
    return () => clearInterval(interval);
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col justify-center items-center font-sans">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-neutral-800 border-t-emerald-500 animate-spin" />
          <Film className="w-6 h-6 text-emerald-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <span className="text-xs font-mono text-neutral-400 mt-5 uppercase tracking-widest animate-pulse">
          Booting Movie Finder & Review...
        </span>
      </div>
    );
  }

  if (!user) {
    return <LoginForm onLoginSuccess={fetchSession} />;
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans flex flex-col relative overflow-x-hidden">
      {/* Background decoration */}
      <div className={`absolute top-0 right-1/4 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none transition-all duration-500 ${
        aiAssistant === 'codeium' ? 'bg-indigo-950/10' : 'bg-emerald-950/5'
      }`} />
      <div className={`absolute bottom-10 left-10 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none transition-all duration-500 ${
        aiAssistant === 'codeium' ? 'bg-violet-950/10' : 'bg-teal-950/5'
      }`} />

      {/* Header */}
      <header className="bg-neutral-900/90 border-b border-neutral-800 px-6 py-4 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-950/50 border border-emerald-800/40 text-emerald-400 rounded-xl shadow-inner">
              <Film className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-bold text-lg tracking-tight text-white">
                  Movie Finder & Review
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-mono rounded-full border font-bold bg-emerald-950 text-emerald-400 border-emerald-800/55">
                  SQLite DB Active
                </span>
              </div>
              <p className="text-xs text-neutral-400">Interactive Film Cataloging & Integrated LLM-Powered Code Smells Analyzer</p>
            </div>
          </div>

          {/* User profile & controls */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-neutral-950/85 border border-neutral-800 px-3 py-1.5 rounded-xl">
              <img
                src={user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                alt={user.display_name}
                className="w-7 h-7 rounded-lg object-cover border border-neutral-800"
                referrerPolicy="no-referrer"
              />
              <div className="hidden md:block text-left">
                <span className="text-xs font-semibold text-neutral-200 block truncate max-w-[120px]">{user.display_name}</span>
                <span className="text-[10px] font-mono text-neutral-500 block">@{user.username}</span>
              </div>
            </div>

            <button
              id="btn-logout"
              onClick={handleLogout}
              className="px-3.5 py-2 bg-neutral-850 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white rounded-xl transition-all duration-150 flex items-center gap-2 text-xs font-medium cursor-pointer test-btn-logout"
            >
              <LogOut className="w-4 h-4 text-neutral-500" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Subnav & Tabs */}
      <div className="bg-neutral-900 border-b border-neutral-850 py-2.5 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div role="tablist" className="flex gap-2 p-1 bg-neutral-950 rounded-xl border border-neutral-850/60 flex-wrap sm:flex-nowrap">
            <button
              id="btn-nav-catalog"
              onClick={() => setActiveTab('catalog')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer test-btn-nav-catalog ${
                activeTab === 'catalog'
                  ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700/50'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              Movie Finder
            </button>
            <button
              id="btn-nav-analyzer"
              onClick={() => setActiveTab('analyzer')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer test-btn-nav-analyzer ${
                activeTab === 'analyzer'
                  ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700/50'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              Code Auditor
            </button>
            <button
              id="btn-nav-history"
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer test-btn-nav-history ${
                activeTab === 'history'
                  ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700/50'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Saved Audits ({analyses.length})
            </button>
            <button
              id="btn-nav-profile"
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer test-btn-nav-profile ${
                activeTab === 'profile'
                  ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700/50'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Profile & Logs
            </button>
          </div>
          
          <div className="hidden sm:flex items-center gap-2 text-xs text-neutral-500 font-mono">
            <Zap className={`w-3.5 h-3.5 transition-all duration-300 ${
              aiAssistant === 'codeium' ? 'text-indigo-400 animate-pulse' : 'text-yellow-500'
            }`} />
            <span>LLM: {aiAssistant === 'codeium' ? 'Codeium Cortex Active' : 'Gemini 3.5 Active'}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 relative z-10">
        <AnimatePresence mode="wait">

          {/* TAB 0: MOVIE FINDER CATALOG */}
          {activeTab === 'catalog' && (
            <motion.div
              key="catalog-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                    <Film className="w-5 h-5 text-emerald-400" />
                    Movie Finder & Review Database
                  </h2>
                  <p className="text-xs text-neutral-400">Search, discover, review, and catalog your film collections in SQLite.</p>
                </div>
                <button
                  id="btn-add-movie-trigger"
                  onClick={handleStartAddMovie}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg cursor-pointer transition-all duration-200"
                >
                  <PlusCircle className="w-4 h-4" />
                  Add New Movie
                </button>
              </div>

              {/* Render Grid */}
              <MovieGrid
                movies={movies}
                currentUser={user}
                onEditMovie={handleStartEditMovie}
                onDeleteMovie={handleDeleteMovie}
                onSelectMovie={(movie) => setSelectedMovie(movie)}
              />

              {/* Code Quality & Audit Center section */}
              <div className="bg-gradient-to-r from-neutral-900 to-neutral-950 border border-neutral-800 rounded-2xl p-6 shadow-xl space-y-4 mt-8">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-400 animate-pulse" />
                      Movie Finder & Review Integrated Code Quality Auditor
                    </h3>
                    <p className="text-xs text-neutral-400 mt-1">
                      Directly audit the custom SQLite database adapter or React rendering components of Movie Finder & Review to find reliability bugs and security flaws in real-time.
                    </p>
                  </div>
                  <span className="px-2.5 py-1 text-[10px] font-mono rounded-full bg-emerald-950/50 text-emerald-400 border border-emerald-800/40 font-semibold">
                    Interactive LLM Integration Active
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  {PRESET_SNIPPETS.map((preset, index) => (
                    <div 
                      key={index} 
                      className="bg-neutral-950 border border-neutral-850 p-4 rounded-xl flex flex-col justify-between hover:border-emerald-500/30 transition-all group"
                    >
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider font-bold block">
                          Module {index + 1}: {preset.title}
                        </span>
                        <h4 className="text-xs font-semibold text-white group-hover:text-emerald-300 transition-colors">
                          {preset.name}
                        </h4>
                        <p className="text-[11px] text-neutral-400 line-clamp-2">
                          Analyze SQL injection vulnerability risks, duplicated validate rules, or deep nesting warnings inside Movie Finder & Review's codebase.
                        </p>
                      </div>
                      <button
                        onClick={() => handleLoadPresetToAnalyzer(index)}
                        className="mt-4 w-full py-1.5 px-3 bg-neutral-900 hover:bg-emerald-900/30 border border-neutral-800 hover:border-emerald-700/40 text-[11px] font-mono font-semibold text-neutral-300 hover:text-emerald-300 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-200"
                      >
                        <Terminal className="w-3.5 h-3.5" />
                        Load & Audit Module
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
          
          {/* TAB 1: CODE ANALYZER WORKSPACE */}
          {activeTab === 'analyzer' && (
            <motion.div
              key="analyzer-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Left Column: Code Input Form */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                      <Terminal className={`w-4 h-4 transition-all duration-300 ${aiAssistant === 'codeium' ? 'text-indigo-400' : 'text-emerald-400'}`} />
                      Code Audit Editor
                    </h2>
                    
                    {/* Clear form button */}
                    <button
                      type="button"
                      onClick={() => setSnippetCode('')}
                      className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Clear
                    </button>
                  </div>

                  {/* Preset Quick Fillers */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono text-neutral-500 block uppercase font-bold">Select Preset Demo Scenarios:</span>
                    <div className="grid grid-cols-3 gap-2">
                      {PRESET_SNIPPETS.map((preset, index) => (
                        <button
                          key={index}
                          onClick={() => handleLoadPreset(preset)}
                          className={`px-2 py-2 bg-neutral-950 border border-neutral-800/80 rounded-xl text-left transition-all cursor-pointer group text-[11px] ${
                            aiAssistant === 'codeium' ? 'hover:border-indigo-500/40' : 'hover:border-emerald-500/40'
                          }`}
                        >
                          <span className={`font-semibold block truncate ${
                            aiAssistant === 'codeium' ? 'text-indigo-400 group-hover:text-indigo-300' : 'text-emerald-400 group-hover:text-emerald-300'
                          }`}>{preset.name}</span>
                          <span className="text-[9px] text-neutral-500 block font-mono uppercase mt-0.5">{preset.language}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <form onSubmit={handleRunAnalysis} className="space-y-4">
                    {/* AI Assistant Engine Selection */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono font-semibold text-neutral-400 block flex items-center gap-1">
                        <Sparkles className={`w-3 h-3 ${aiAssistant === 'codeium' ? 'text-indigo-400 animate-pulse' : 'text-emerald-400'}`} />
                        AI ASSISTANT ENGINE
                      </label>
                      <select
                        value={aiAssistant}
                        onChange={(e) => setAiAssistant(e.target.value as 'codeium' | 'gemini')}
                        className={`w-full bg-neutral-950 border border-neutral-800 text-white rounded-lg px-3 py-2 text-xs font-mono outline-none transition-colors cursor-pointer ${
                          aiAssistant === 'codeium' ? 'focus:border-indigo-500' : 'focus:border-emerald-500'
                        }`}
                      >
                        <option value="codeium">Codeium Assistant (Fast, Cortex-Powered)</option>
                        <option value="gemini">Gemini 3.5 Flash (Advanced Reasoning)</option>
                      </select>
                    </div>

                    {/* File Title */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono font-semibold text-neutral-400 block">FILE TITLE</label>
                      <input
                        type="text"
                        value={snippetTitle}
                        onChange={(e) => setSnippetTitle(e.target.value)}
                        placeholder="E.g. db-service.ts"
                        className={`w-full bg-neutral-950 border border-neutral-800 text-white rounded-lg px-3 py-2 text-xs font-mono outline-none transition-colors ${
                          aiAssistant === 'codeium' ? 'focus:border-indigo-500' : 'focus:border-emerald-500'
                        }`}
                      />
                    </div>

                    {/* Language Selection */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono font-semibold text-neutral-400 block">LANGUAGE / DIALECT</label>
                      <select
                        value={snippetLanguage}
                        onChange={(e) => setSnippetLanguage(e.target.value)}
                        className={`w-full bg-neutral-950 border border-neutral-800 text-white rounded-lg px-3 py-2 text-xs font-mono outline-none transition-colors cursor-pointer ${
                          aiAssistant === 'codeium' ? 'focus:border-indigo-500' : 'focus:border-emerald-500'
                        }`}
                      >
                        <option value="typescript">TypeScript</option>
                        <option value="javascript">JavaScript</option>
                        <option value="python">Python</option>
                        <option value="go">Go</option>
                        <option value="java">Java</option>
                        <option value="cpp">C++</option>
                        <option value="html">HTML / CSS</option>
                        <option value="sql">SQL / Database</option>
                      </select>
                    </div>

                    {/* Source Code Box */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono font-semibold text-neutral-400 block">SOURCE CODE</label>
                      <div className="relative rounded-lg overflow-hidden border border-neutral-800 bg-neutral-950">
                        <textarea
                          value={snippetCode}
                          onChange={(e) => setSnippetCode(e.target.value)}
                          placeholder="// Paste your raw code here to analyze quality..."
                          rows={14}
                          className="w-full bg-transparent text-neutral-200 p-4 font-mono text-xs outline-none resize-none leading-relaxed"
                        />
                      </div>
                    </div>

                    {/* Save to persistence toggle */}
                    <div className="flex items-center gap-2.5 py-1">
                      <input
                        id="checkbox-save"
                        type="checkbox"
                        checked={saveToHistory}
                        onChange={(e) => setSaveToHistory(e.target.checked)}
                        className={`w-4 h-4 bg-neutral-950 border-neutral-800 rounded cursor-pointer ${
                          aiAssistant === 'codeium'
                            ? 'text-indigo-650 focus:ring-indigo-500'
                            : 'text-emerald-600 focus:ring-emerald-500'
                        }`}
                      />
                      <label htmlFor="checkbox-save" className="text-xs font-medium text-neutral-400 cursor-pointer hover:text-neutral-200 transition-colors selection:bg-transparent">
                        Save results to SQLite History
                      </label>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={analyzing}
                      className={`w-full h-11 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer disabled:opacity-50 ${
                        aiAssistant === 'codeium'
                          ? 'bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.25)]'
                          : 'bg-emerald-600 hover:bg-emerald-500'
                      }`}
                    >
                      {analyzing ? (
                        <>
                          <div className={`w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin`} />
                          <span>Auditing Code...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-current" />
                          <span>Run Quality Audit</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>

              {/* Right Column: AI Analysis Result Display */}
              <div className="lg:col-span-7">
                {analyzing ? (
                  /* Loading State */
                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-12 shadow-xl flex flex-col justify-center items-center text-center h-[580px]">
                    <div className="relative mb-6">
                      <div className={`w-20 h-20 rounded-full border-4 border-neutral-800 animate-spin ${
                        aiAssistant === 'codeium' ? 'border-t-indigo-500' : 'border-t-emerald-500'
                      }`} />
                      <Sparkles className={`w-8 h-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse ${
                        aiAssistant === 'codeium' ? 'text-indigo-400' : 'text-emerald-400'
                      }`} />
                    </div>
                    <h3 className="font-semibold text-lg text-white mb-2">Analyzing Quality & Bad Practices</h3>
                    <p className={`text-xs font-mono uppercase tracking-widest max-w-md mx-auto animate-pulse ${
                      aiAssistant === 'codeium' ? 'text-indigo-400' : 'text-emerald-400'
                    }`}>
                      {statusMessage}
                    </p>
                    <div className="w-48 h-1 bg-neutral-950 rounded-full overflow-hidden mt-6">
                      <div className={`h-full rounded-full animate-infinite-loading w-1/2 ${
                        aiAssistant === 'codeium' ? 'bg-indigo-500' : 'bg-emerald-500'
                      }`} />
                    </div>
                  </div>
                ) : error ? (
                  /* Error State */
                  <div className="bg-neutral-900 border border-red-900/50 rounded-2xl p-8 shadow-xl flex flex-col justify-center items-center text-center h-[580px] space-y-4">
                    <div className="p-4 bg-red-950/40 border border-red-800/40 rounded-2xl text-red-400">
                      <ShieldAlert className="w-12 h-12" />
                    </div>
                    <h3 className="font-bold text-lg text-white">Analysis Pipeline Interrupted</h3>
                    <p className="text-xs text-neutral-400 max-w-md leading-relaxed">
                      {error}
                    </p>
                    <p className="text-[10px] font-mono text-neutral-500 max-w-sm">
                      Please confirm that the backend has a valid GEMINI_API_KEY environment variable.
                    </p>
                  </div>
                ) : analysisResult ? (
                  /* Results Loaded State */
                  (() => {
                    const score = analysisResult.score;
                    const qualityGate = analysisResult.qualityGate || (score >= 80 ? 'Passed' : 'Failed');
                    const reliabilityRating = analysisResult.reliabilityRating || (score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'D');
                    const securityRating = analysisResult.securityRating || (score >= 80 ? 'A' : score >= 60 ? 'B' : 'C');
                    const maintainabilityRating = analysisResult.maintainabilityRating || (score >= 80 ? 'A' : 'B');
                    const technicalDebt = analysisResult.technicalDebt || `${(analysisResult.issues || []).length * 15}m`;
                    const bugsCount = typeof analysisResult.bugsCount === 'number' ? analysisResult.bugsCount : (analysisResult.issues || []).filter(i => i.type === 'syntax-error').length;
                    const vulnerabilitiesCount = typeof analysisResult.vulnerabilitiesCount === 'number' ? analysisResult.vulnerabilitiesCount : (analysisResult.issues || []).filter(i => i.type === 'security-flaw').length;
                    const codeSmellsCount = typeof analysisResult.codeSmellsCount === 'number' ? analysisResult.codeSmellsCount : (analysisResult.issues || []).filter(i => i.type === 'bad-practice' || i.type === 'duplicate' || i.type === 'complexity').length;

                    const sonarSummary = analysisResult.sonarSummary || "SonarQube perspective: Complete quality analysis focusing on reliability issues (bugs), vulnerability risks (hotspots), and code smells causing technical debt.";
                    const pmdSummary = analysisResult.pmdSummary || "PMD perspective: Code complexity and architecture scanner focusing on nesting, resource leaks, unused imports, or sub-optimal patterns.";
                    const eslintSummary = analysisResult.eslintSummary || "ESLint perspective: Rule-based Javascript/TypeScript syntax standards engine scanning for stylistic flaws, loose typing, and scope safety warnings.";

                    const normalizedIssues = (analysisResult.issues || []).map(issue => {
                      const tool = issue.tool || (issue.type === 'security-flaw' ? 'SonarQube' : issue.type === 'complexity' ? 'PMD' : 'ESLint');
                      const ruleId = issue.ruleId || (issue.type === 'security-flaw' ? 'S1145' : issue.type === 'complexity' ? 'PMD-Design' : 'eslint-rule');
                      const category = issue.category || (issue.type === 'security-flaw' ? 'Security' : issue.type === 'complexity' ? 'Design' : 'Code Style');
                      return { ...issue, tool, ruleId, category };
                    });

                    const filteredIssues = normalizedIssues.filter(issue => {
                      if (selectedToolFilter === 'all') return true;
                      return issue.tool === selectedToolFilter;
                    });

                    const renderRatingBadge = (rating: string) => {
                      const colors = {
                        A: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
                        B: 'bg-teal-500/10 text-teal-400 border-teal-500/25',
                        C: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/25',
                        D: 'bg-orange-500/10 text-orange-400 border-orange-500/25',
                        E: 'bg-red-500/10 text-red-400 border-red-500/25',
                      };
                      const colorClass = colors[rating as keyof typeof colors] || colors.C;
                      return (
                        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center font-mono font-bold text-sm ${colorClass}`}>
                          {rating}
                        </div>
                      );
                    };

                    return (
                      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl shadow-xl overflow-hidden h-full flex flex-col">
                        
                        {/* Interactive SonarQube Quality Gate Status Header */}
                        <div className={`p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-neutral-800 transition-colors ${
                          qualityGate === 'Passed'
                            ? 'bg-gradient-to-r from-emerald-950/20 to-neutral-950/50'
                            : 'bg-gradient-to-r from-red-950/20 to-neutral-950/50'
                        }`}>
                          <div className="flex items-center gap-4">
                            {qualityGate === 'Passed' ? (
                              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 flex items-center justify-center">
                                <CheckCircle className="w-6 h-6" />
                              </div>
                            ) : (
                              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center justify-center">
                                <AlertTriangle className="w-6 h-6" />
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-neutral-500 uppercase font-bold tracking-wider">SonarQube Quality Gate</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                                  qualityGate === 'Passed' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                                }`}>
                                  {qualityGate}
                                </span>
                              </div>
                              <h3 className="font-semibold text-white text-base">
                                {qualityGate === 'Passed' ? 'All static analysis criteria matched.' : 'Rule violations exceeded gate limit.'}
                              </h3>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {/* Circle score indicator */}
                            <div className="relative shrink-0">
                              <svg className="w-14 h-14 transform -rotate-90">
                                <circle cx="28" cy="28" r="24" className="stroke-neutral-850 fill-none" strokeWidth="4" />
                                <circle 
                                  cx="28" cy="28" r="24" 
                                  className={`fill-none transition-all duration-1000 ${
                                    score >= 80 ? 'stroke-emerald-500' : score >= 50 ? 'stroke-yellow-500' : 'stroke-red-500'
                                  }`} 
                                  strokeWidth="4" 
                                  strokeDasharray="151" 
                                  strokeDashoffset={151 - (151 * score) / 100} 
                                />
                              </svg>
                              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-mono font-bold">
                                {score}%
                              </span>
                            </div>
                            <div className="hidden sm:block text-left">
                              <span className="text-[9px] font-mono text-neutral-500 uppercase block tracking-wider">Overall Score</span>
                              <span className="text-xs font-bold font-mono text-neutral-300">COMPLIANCE</span>
                            </div>
                          </div>
                        </div>

                        {/* Results Sub-Tabs */}
                        <div className="flex border-b border-neutral-800 bg-neutral-950/20 px-4 overflow-x-auto">
                          {(['dashboard', 'issues', 'refactored', 'performance', 'security', 'perspectives'] as const).map((tab) => (
                            <button
                              key={tab}
                              onClick={() => setActiveResultTab(tab)}
                              className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-all cursor-pointer shrink-0 ${
                                activeResultTab === tab
                                  ? 'border-emerald-500 text-emerald-400 font-bold bg-emerald-500/5'
                                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
                              }`}
                            >
                              {tab === 'dashboard' && 'Quality Dashboard'}
                              {tab === 'issues' && `Rule Violations (${normalizedIssues.length})`}
                              {tab === 'refactored' && 'Refactored Code'}
                              {tab === 'performance' && 'Big-O & Performance'}
                              {tab === 'security' && 'Security Audit'}
                              {tab === 'perspectives' && 'Tool Perspectives'}
                            </button>
                          ))}
                        </div>

                        {/* Active Results Pane */}
                        <div className="p-6 flex-1 overflow-y-auto max-h-[460px] space-y-5">
                          
                          {/* SUB-TAB: DASHBOARD OVERVIEW */}
                          {activeResultTab === 'dashboard' && (
                            <div className="space-y-6">
                              {/* Bento Grid Metrics Row */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {/* Reliability */}
                                <div className="bg-neutral-950/60 border border-neutral-850 p-4 rounded-xl flex flex-col justify-between space-y-3">
                                  <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block font-bold">Reliability</span>
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-neutral-300">Bugs ({bugsCount})</span>
                                    {renderRatingBadge(reliabilityRating)}
                                  </div>
                                </div>

                                {/* Security */}
                                <div className="bg-neutral-950/60 border border-neutral-850 p-4 rounded-xl flex flex-col justify-between space-y-3">
                                  <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block font-bold">Security</span>
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-neutral-300">Risks ({vulnerabilitiesCount})</span>
                                    {renderRatingBadge(securityRating)}
                                  </div>
                                </div>

                                {/* Maintainability */}
                                <div className="bg-neutral-950/60 border border-neutral-850 p-4 rounded-xl flex flex-col justify-between space-y-3">
                                  <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block font-bold">Maintainability</span>
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-neutral-300">Smells ({codeSmellsCount})</span>
                                    {renderRatingBadge(maintainabilityRating)}
                                  </div>
                                </div>

                                {/* Technical Debt */}
                                <div className="bg-neutral-950/60 border border-neutral-850 p-4 rounded-xl flex flex-col justify-between space-y-3">
                                  <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block font-bold">Technical Debt</span>
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-mono font-bold text-emerald-400">{technicalDebt}</span>
                                    <div className="p-1.5 bg-neutral-900 border border-neutral-800 rounded-lg text-neutral-500">
                                      <Clock className="w-4 h-4" />
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Tool Rules Breakdown */}
                              <div className="space-y-3">
                                <span className="text-[10px] font-mono text-neutral-500 uppercase font-bold block tracking-wider">Multi-Tool Rule Engine Compliance</span>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                  
                                  {/* SonarQube */}
                                  <div className="p-4 bg-neutral-950/30 border border-neutral-850 rounded-xl space-y-2">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                                        <span className="text-xs font-bold text-neutral-200">SonarQube rules</span>
                                      </div>
                                      <span className="text-xs font-mono font-bold text-blue-400">
                                        {normalizedIssues.filter(i => i.tool === 'SonarQube').length} Violations
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-neutral-400 leading-relaxed font-mono">
                                      Scanned for code smells, hotspots, complexity depth, and debt.
                                    </p>
                                  </div>

                                  {/* PMD */}
                                  <div className="p-4 bg-neutral-950/30 border border-neutral-850 rounded-xl space-y-2">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-purple-500" />
                                        <span className="text-xs font-bold text-neutral-200">PMD Rulesets</span>
                                      </div>
                                      <span className="text-xs font-mono font-bold text-purple-400">
                                        {normalizedIssues.filter(i => i.tool === 'PMD').length} Violations
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-neutral-400 leading-relaxed font-mono">
                                      Checked design architecture patterns, duplication rules, and style.
                                    </p>
                                  </div>

                                  {/* ESLint */}
                                  <div className="p-4 bg-neutral-950/30 border border-neutral-850 rounded-xl space-y-2">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                                        <span className="text-xs font-bold text-neutral-200">ESLint Linter</span>
                                      </div>
                                      <span className="text-xs font-mono font-bold text-amber-400">
                                        {normalizedIssues.filter(i => i.tool === 'ESLint').length} Warnings
                                      </span>
                                    </div>
                                    <p className="text-[11px] text-neutral-400 leading-relaxed font-mono">
                                      Identified variable scopes, type integrity, and style rules.
                                    </p>
                                  </div>

                                </div>
                              </div>

                              {/* Complexity Quick Insight */}
                              <div className="p-4 bg-neutral-950/50 border border-neutral-850 rounded-xl space-y-2">
                                <div className="flex items-center gap-2 text-white">
                                  <Layers className="w-4 h-4 text-emerald-400" />
                                  <span className="text-xs font-semibold uppercase tracking-wider font-mono">Cognitive & Branch Complexity Insight</span>
                                </div>
                                <p className="text-xs text-neutral-300 font-mono leading-relaxed">
                                  {analysisResult.complexityExplanation}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* SUB-TAB: ISSUES & DUPLICATES WITH TOOL FILTERING */}
                          {activeResultTab === 'issues' && (
                            <div className="space-y-4">
                              {/* Tool Filtering Header */}
                              <div className="flex flex-wrap gap-1.5 p-1 bg-neutral-950 rounded-lg border border-neutral-850 self-start">
                                {(['all', 'SonarQube', 'PMD', 'ESLint'] as const).map((filter) => {
                                  const count = filter === 'all' 
                                    ? normalizedIssues.length 
                                    : normalizedIssues.filter(i => i.tool === filter).length;
                                  return (
                                    <button
                                      key={filter}
                                      onClick={() => setSelectedToolFilter(filter)}
                                      className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                                        selectedToolFilter === filter
                                          ? 'bg-neutral-850 text-white border border-neutral-750'
                                          : 'text-neutral-400 hover:text-white'
                                      }`}
                                    >
                                      <span className="capitalize">{filter}</span>
                                      <span className="text-[9px] px-1.5 py-0.5 bg-neutral-900 rounded font-mono text-neutral-500 font-bold border border-neutral-800">
                                        {count}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>

                              {filteredIssues.length === 0 ? (
                                <div className="p-8 bg-neutral-950/30 border border-neutral-850 rounded-xl text-center space-y-2">
                                  <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
                                  <h4 className="font-semibold text-white">No Violations Found!</h4>
                                  <p className="text-xs text-neutral-400">Excellent! This linter perspective reports zero warnings.</p>
                                </div>
                              ) : (
                                filteredIssues.map((issue, idx) => {
                                  const toolColors = {
                                    SonarQube: 'bg-blue-950/40 text-blue-400 border-blue-900/40',
                                    PMD: 'bg-purple-950/40 text-purple-400 border-purple-900/40',
                                    ESLint: 'bg-amber-950/40 text-amber-400 border-amber-900/40'
                                  };
                                  const toolColorClass = toolColors[issue.tool] || 'bg-neutral-950 text-neutral-400 border-neutral-800';

                                  return (
                                    <div key={idx} className={`p-4 border rounded-xl flex items-start gap-3.5 transition-colors ${
                                      issue.severity === 'high' 
                                        ? 'bg-red-950/10 border-red-900/40 hover:bg-red-950/20' 
                                        : issue.severity === 'medium'
                                        ? 'bg-yellow-950/10 border-yellow-900/40 hover:bg-yellow-950/20'
                                        : 'bg-neutral-950/40 border-neutral-850 hover:bg-neutral-950/60'
                                    }`}>
                                      <div className={`p-2 rounded-lg mt-0.5 ${
                                        issue.severity === 'high' 
                                          ? 'bg-red-950 text-red-400' 
                                          : issue.severity === 'medium'
                                          ? 'bg-yellow-950 text-yellow-400'
                                          : 'bg-neutral-800 text-neutral-400'
                                      }`}>
                                        {issue.type === 'security-flaw' ? (
                                          <ShieldAlert className="w-4 h-4" />
                                        ) : (
                                          <AlertTriangle className="w-4 h-4" />
                                        )}
                                      </div>
                                      <div className="space-y-1 flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 justify-between">
                                          <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 border text-[9px] font-mono font-bold uppercase rounded-md ${toolColorClass}`}>
                                              {issue.tool}
                                            </span>
                                            <span className="text-xs font-semibold text-neutral-300 font-mono">
                                              Rule: {issue.ruleId}
                                            </span>
                                            <span className="text-[10px] font-mono text-neutral-500">
                                              Line {issue.line}
                                            </span>
                                          </div>
                                          <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                                            issue.severity === 'high' 
                                              ? 'bg-red-950 text-red-400 border border-red-900/40' 
                                              : issue.severity === 'medium'
                                              ? 'bg-yellow-950 text-yellow-400 border border-yellow-900/40'
                                              : 'bg-neutral-800 text-neutral-400 border border-neutral-750'
                                          }`}>
                                            {issue.severity}
                                          </span>
                                        </div>
                                        <p className="text-xs text-neutral-300 font-mono pr-2 leading-relaxed mt-1.5">{issue.description}</p>
                                        <div className="pt-2 mt-2 border-t border-neutral-850 text-[11px] text-neutral-400">
                                          <span className="font-mono font-bold text-emerald-400 mr-1">Refactoring Recommendation:</span>
                                          {issue.recommendation}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          )}

                          {/* SUB-TAB: REFACTORED CODE */}
                          {activeResultTab === 'refactored' && (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono text-neutral-500 uppercase font-bold">Optimized Clean Variant:</span>
                                <button
                                  onClick={handleCopyCode}
                                  className="px-3 py-1.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-850 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer text-emerald-400 hover:text-emerald-300"
                                >
                                  {copied ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                                      <span>Copied!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3.5 h-3.5" />
                                      <span>Copy Refactored Code</span>
                                    </>
                                  )}
                                </button>
                              </div>
                              
                              <div className="bg-neutral-950 border border-neutral-850 rounded-xl overflow-hidden p-4">
                                <pre className="font-mono text-xs leading-relaxed text-neutral-300 overflow-x-auto whitespace-pre">
                                  {analysisResult.refactoredCode}
                                </pre>
                              </div>
                              <div className="p-3 bg-neutral-950/50 border border-neutral-850 rounded-xl text-[11px] text-neutral-400 flex items-start gap-2">
                                <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                <span>This code complies with all static linter rules, eliminates code duplicates, optimizes allocations, and resolves security bugs cleanly.</span>
                              </div>
                            </div>
                          )}

                          {/* SUB-TAB: PERFORMANCE */}
                          {activeResultTab === 'performance' && (
                            <div className="space-y-4">
                              <div className="p-4 bg-neutral-950/60 border border-neutral-850 rounded-xl space-y-3">
                                <div className="flex items-center gap-2 text-white">
                                  <Cpu className="w-4 h-4 text-yellow-500" />
                                  <span className="text-xs font-semibold uppercase tracking-wider font-mono">Performance & Big-O Summary</span>
                                </div>
                                <p className="text-xs text-neutral-300 leading-relaxed font-mono">
                                  {analysisResult.performanceSummary}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* SUB-TAB: SECURITY AUDIT */}
                          {activeResultTab === 'security' && (
                            <div className="space-y-4">
                              <div className={`p-4 border rounded-xl space-y-3 ${
                                analysisResult.securitySummary.toLowerCase().includes('vulnerab') || 
                                analysisResult.securitySummary.toLowerCase().includes('risk') ||
                                analysisResult.securitySummary.toLowerCase().includes('warn')
                                  ? 'bg-red-950/15 border-red-900/40 text-red-300'
                                  : 'bg-emerald-950/15 border-emerald-900/40 text-emerald-300'
                              }`}>
                                <div className="flex items-center gap-2">
                                  {analysisResult.securitySummary.toLowerCase().includes('vulnerab') || 
                                  analysisResult.securitySummary.toLowerCase().includes('risk') ||
                                  analysisResult.securitySummary.toLowerCase().includes('warn') ? (
                                    <ShieldAlert className="w-5 h-5 text-red-400" />
                                  ) : (
                                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                                  )}
                                  <span className="text-xs font-semibold uppercase tracking-wider font-mono text-white">Vulnerability & Security Audit</span>
                                </div>
                                <p className="text-xs leading-relaxed font-mono text-neutral-300 font-normal">
                                  {analysisResult.securitySummary}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* SUB-TAB: PERSPECTIVES */}
                          {activeResultTab === 'perspectives' && (
                            <div className="space-y-4">
                              {/* SonarQube Summary Card */}
                              <div className="p-4 bg-blue-950/10 border border-blue-900/25 rounded-xl space-y-2">
                                <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest block font-bold">SonarQube Standard perspective</span>
                                <p className="text-xs text-neutral-300 leading-relaxed font-mono">
                                  {sonarSummary}
                                </p>
                              </div>

                              {/* PMD Summary Card */}
                              <div className="p-4 bg-purple-950/10 border border-purple-900/25 rounded-xl space-y-2">
                                <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest block font-bold">PMD design perspective</span>
                                <p className="text-xs text-neutral-300 leading-relaxed font-mono">
                                  {pmdSummary}
                                </p>
                              </div>

                              {/* ESLint Summary Card */}
                              <div className="p-4 bg-amber-950/10 border border-amber-900/25 rounded-xl space-y-2">
                                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest block font-bold">ESLint linting perspective</span>
                                <p className="text-xs text-neutral-300 leading-relaxed font-mono">
                                  {eslintSummary}
                                </p>
                              </div>
                            </div>
                          )}

                        </div>
                      </div>
                    );
                  })()
                ) : (
                  /* Initial Placeholder State */
                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-12 shadow-xl flex flex-col justify-center items-center text-center h-[580px] space-y-5">
                    <div className="p-5 bg-neutral-950 border border-neutral-800 rounded-3xl text-neutral-500">
                      <Sparkles className="w-12 h-12 text-neutral-600 animate-pulse" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-bold text-lg text-white">Audit Result Engine Ready</h3>
                      <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
                        Input your raw code snippet, configure the file environment parameter settings, and run a static quality analysis scan!
                      </p>
                    </div>
                    
                    {/* Visual guidelines */}
                    <div className="grid grid-cols-2 gap-3 max-w-md w-full pt-4 text-left">
                      <div className="p-3 bg-neutral-950/50 border border-neutral-850 rounded-xl text-[11px] space-y-1">
                        <span className="font-mono text-emerald-400 font-bold block">Duplicates Scan</span>
                        <p className="text-neutral-500 leading-normal">Flags repeated logic structures and recommends DRY helpers.</p>
                      </div>
                      <div className="p-3 bg-neutral-950/50 border border-neutral-850 rounded-xl text-[11px] space-y-1">
                        <span className="font-mono text-yellow-400 font-bold block">Complexity Audit</span>
                        <p className="text-neutral-500 leading-normal">Measures deep nested control structures and calculates Big-O.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* TAB 2: AUDIT REPORTS HISTORY */}
          {activeTab === 'history' && (
            <motion.div
              key="history-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-4xl mx-auto space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">Saved Audit History</h2>
                  <p className="text-xs text-neutral-400">Review, load or delete your previously saved code audits stored in SQLite.</p>
                </div>
                <span className="text-xs font-mono text-neutral-500 bg-neutral-900 border border-neutral-800 px-3 py-1 rounded-full">
                  Total saved: {analyses.length}
                </span>
              </div>

              {analyses.length === 0 ? (
                <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-12 text-center space-y-3">
                  <div className="inline-flex p-4 bg-neutral-950 rounded-2xl text-neutral-600">
                    <History className="w-8 h-8" />
                  </div>
                  <h3 className="font-semibold text-white">No Saved Audits Found</h3>
                  <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
                    Once you check the "Save results to SQLite History" box and click "Run Quality Audit", they will be persisted securely in your local SQLite ledger.
                  </p>
                  <button
                    onClick={() => setActiveTab('analyzer')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs font-semibold text-white cursor-pointer mt-2"
                  >
                    Go Back To Analyzer
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analyses.map((saved) => {
                    let healthScore = saved.score;
                    let dotColor = healthScore >= 80 ? 'bg-emerald-500' : healthScore >= 50 ? 'bg-yellow-500' : 'bg-red-500';
                    return (
                      <div
                        key={saved.id}
                        onClick={() => handleLoadSavedAnalysis(saved)}
                        className="bg-neutral-900 border border-neutral-800 hover:border-emerald-500/30 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all cursor-pointer group flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                              <h3 className="font-semibold text-neutral-200 group-hover:text-emerald-400 transition-colors font-mono truncate max-w-[200px]">
                                {saved.title}
                              </h3>
                            </div>
                            <span className="text-[10px] font-mono text-neutral-500 uppercase">{saved.language}</span>
                          </div>

                          <div className="flex items-center gap-6">
                            <div className="bg-neutral-950 px-3 py-1.5 border border-neutral-850 rounded-xl text-center">
                              <span className="text-xs font-mono text-neutral-400 block font-bold">{saved.score}%</span>
                              <span className="text-[8px] text-neutral-600 block uppercase tracking-wider">Score</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-neutral-500 block uppercase font-mono">Complexity</span>
                              <span className="text-xs font-semibold text-neutral-300">{saved.complexity_rating}</span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 mt-4 border-t border-neutral-850/60 flex items-center justify-between text-[10px] font-mono text-neutral-500">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{saved.created_at}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => handleDeleteAnalysis(saved.id, e)}
                              className="p-1.5 bg-neutral-950/60 hover:bg-red-950 border border-neutral-850 hover:border-red-900/60 text-neutral-400 hover:text-red-400 rounded-lg transition-all cursor-pointer"
                              title="Delete audit report"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-neutral-400 hover:text-emerald-400 font-bold flex items-center gap-0.5">
                              Open
                              <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* TAB 3: USER PROFILE & ACTIVITY LOGS */}
          {activeTab === 'profile' && (
            <motion.div
              key="profile-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8"
            >
              {/* Profile Card */}
              <div className="md:col-span-5">
                <ProfilePanel user={user} onUpdateProfile={handleUpdateProfile} />
              </div>

              {/* Activity Logs Panel */}
              <div className="md:col-span-7 bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl flex flex-col h-full">
                <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-emerald-400" />
                    <h2 className="font-semibold text-white">SQLite Hub Audit Trail</h2>
                  </div>
                  {logs.length > 0 && (
                    <button
                      onClick={handleClearLogs}
                      className="px-2.5 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider bg-neutral-950 hover:bg-neutral-850 hover:text-red-400 border border-neutral-800 hover:border-red-900/30 text-neutral-400 rounded-lg cursor-pointer transition-colors"
                    >
                      Clear Logs
                    </button>
                  )}
                </div>

                {logs.length === 0 ? (
                  <div className="flex-1 flex flex-col justify-center items-center text-center p-8 space-y-2">
                    <Terminal className="w-8 h-8 text-neutral-700" />
                    <h3 className="font-semibold text-neutral-400 text-xs font-mono uppercase">Audit trail empty</h3>
                    <p className="text-[11px] text-neutral-500">Every write action and query on this system will log SQLite credentials here.</p>
                  </div>
                ) : (
                  <div className="space-y-3 overflow-y-auto max-h-[380px] pr-1.5 scrollbar-thin">
                    {logs.map((log) => (
                      <div key={log.id} className="p-3 bg-neutral-950/80 border border-neutral-850 rounded-xl text-xs flex items-start gap-3 justify-between">
                        <div className="space-y-1 flex-1 min-w-0 pr-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-[10px] bg-neutral-850 px-1.5 py-0.5 rounded text-neutral-400 border border-neutral-800 font-bold uppercase shrink-0">
                              {log.action}
                            </span>
                            <span className="text-[10px] text-neutral-500 font-mono shrink-0">
                              {log.timestamp}
                            </span>
                          </div>
                          <p className="text-neutral-300 font-mono pr-1 break-words">{log.details}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[10px] font-mono text-neutral-500 block truncate max-w-[80px]">@{log.username}</span>
                          <span className="text-[9px] font-mono text-neutral-600 block">{log.ip_address}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Movie Form Modal Overlay */}
      {isFormOpen && (
        <div id="movie-form-modal-overlay" className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <MovieForm
              movieToEdit={movieToEdit}
              onSubmit={handleMovieSubmit}
              onCancel={() => {
                setIsFormOpen(false);
                setMovieToEdit(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Movie Details Modal Overlay */}
      {selectedMovie && (
        <MovieDetailsModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
        />
      )}

      {/* Footer */}
      <footer className="bg-neutral-900 border-t border-neutral-850 py-4 px-6 text-center text-xs text-neutral-500 font-mono flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span>SQLite Store Active: WAL mode</span>
        </div>
        <div className="text-[11px] text-neutral-600 flex items-center gap-2">
          <span>AI Engine Powered by Gemini 3.5 Flash API</span>
        </div>
      </footer>
    </div>
  );
}
