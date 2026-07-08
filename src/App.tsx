import React, { useState, useEffect } from 'react';
import { UserProfile, Movie } from './types';
import LoginForm from './components/LoginForm';
import ProfilePanel from './components/ProfilePanel';
import MovieGrid from './components/MovieGrid';
import MovieForm from './components/MovieForm';
import MovieDetailsModal from './components/MovieDetailsModal';
import { LogOut, Database, User, Film, PlusCircle, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  // CineManage active states
  const [activeTab, setActiveTab] = useState<'catalog' | 'profile'>('catalog');
  const [movieToEdit, setMovieToEdit] = useState<Movie | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  // Fetch user session state
  const fetchSession = async () => {
    try {
      const res = await fetch('/api/session');
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
        // Immediately load movies if session active
        await fetchMovies();
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Error checking active session:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch movies from SQLite DB
  const fetchMovies = async () => {
    try {
      const res = await fetch('/api/movies');
      const data = await res.json();
      if (data.movies) {
        setMovies(data.movies);
      }
    } catch (err) {
      console.error('Error fetching movies:', err);
    }
  };

  // Logout session
  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      setUser(null);
      setMovies([]);
    } catch (err) {
      console.error('Error signing out of session:', err);
    }
  };

  // Update custom user profile
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
          return true;
        }
      }
    } catch (err) {
      console.error('Error updating SQLite user profile:', err);
    }
    return false;
  };

  // Save movie (Create or Update)
  const handleSaveMovie = async (movieData: any): Promise<boolean> => {
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
        setIsFormOpen(false);
        setMovieToEdit(null);
        return true;
      }
    } catch (err) {
      console.error('Error saving film to SQLite DB:', err);
    }
    return false;
  };

  // Delete movie
  const handleDeleteMovie = async (id: string) => {
    try {
      const res = await fetch(`/api/movies/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchMovies();
      }
    } catch (err) {
      console.error('Error deleting movie:', err);
    }
  };

  // Set up live logs intervals
  useEffect(() => {
    fetchSession();
  }, []);

  // Poll database updates for continuous real-time state viewing if logged in
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      fetchMovies();
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col justify-center items-center font-sans">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-neutral-800 border-t-emerald-500 animate-spin" />
          <Database className="w-6 h-6 text-emerald-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <span className="text-xs font-mono text-neutral-400 mt-5 uppercase tracking-widest animate-pulse">
          Connecting to Movie Review SQLite Engine...
        </span>
      </div>
    );
  }

  if (!user) {
    return <LoginForm onLoginSuccess={fetchSession} />;
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans flex flex-col relative overflow-x-hidden">
      {/* Decorative Background Mesh */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-950/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-teal-950/10 rounded-full blur-3xl pointer-events-none" />

      {/* Global Navigation Header */}
      <header className="bg-neutral-900/90 border-b border-neutral-800 px-6 py-4 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-950/50 border border-emerald-800/40 rounded-xl text-emerald-400 shadow-inner">
              <Film className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg tracking-tight text-white">
                Movie Review & Finder
              </h1>
            </div>
          </div>

          {/* User info and Logout panel */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-neutral-950/80 border border-neutral-850 px-3 py-1.5 rounded-xl">
              <img
                src={user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
                alt={user.display_name}
                className="w-7 h-7 rounded-lg object-cover border border-neutral-850"
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

      {/* Primary Navigation Tabs */}
      <div className="bg-neutral-900 border-b border-neutral-850 py-2.5 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex gap-2 p-1 bg-neutral-950 rounded-xl border border-neutral-850/60">
            <button
              id="btn-nav-catalog"
              onClick={() => { setActiveTab('catalog'); setIsFormOpen(false); }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer test-btn-nav-catalog ${
                activeTab === 'catalog'
                  ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700/50'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              Movie Catalog
            </button>
            <button
              id="btn-nav-profile"
              onClick={() => { setActiveTab('profile'); setIsFormOpen(false); }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer test-btn-nav-profile ${
                activeTab === 'profile'
                  ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700/50'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              User Profile
            </button>
          </div>

          {activeTab === 'catalog' && !isFormOpen && (
            <button
              id="btn-add-movie-trigger"
              onClick={() => { setMovieToEdit(null); setIsFormOpen(true); }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-lg test-btn-add-movie-trigger"
            >
              <PlusCircle className="w-4 h-4" />
              Add Movie
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 relative z-10">
        <AnimatePresence mode="wait">
          {isFormOpen && activeTab === 'catalog' ? (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-xl mx-auto"
            >
              <div className="mb-4">
                <button
                  id="btn-back-to-catalog"
                  onClick={() => { setIsFormOpen(false); setMovieToEdit(null); }}
                  className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer font-mono test-btn-back-to-catalog"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Catalog
                </button>
              </div>
              <MovieForm
                movieToEdit={movieToEdit}
                onSubmit={handleSaveMovie}
                onCancel={() => { setIsFormOpen(false); setMovieToEdit(null); }}
              />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {activeTab === 'catalog' && (
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                    <div>
                      <h2 className="text-xl font-bold text-white tracking-tight">Catalog Collection</h2>
                    </div>
                  </div>

                  <MovieGrid
                    movies={movies}
                    currentUser={user}
                    onEditMovie={(movie) => {
                      setMovieToEdit(movie);
                      setIsFormOpen(true);
                    }}
                    onDeleteMovie={handleDeleteMovie}
                    onSelectMovie={setSelectedMovie}
                  />
                </div>
              )}

              {activeTab === 'profile' && (
                <div className="max-w-2xl mx-auto">
                  <ProfilePanel user={user} onUpdateProfile={handleUpdateProfile} />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Immersive Details Modal Popup */}
      <AnimatePresence>
        {selectedMovie && (
          <MovieDetailsModal
            movie={selectedMovie}
            onClose={() => setSelectedMovie(null)}
          />
        )}
      </AnimatePresence>

      {/* Footer Audit Indicators */}
      <footer className="bg-neutral-900 border-t border-neutral-850 py-4 px-6 text-center text-xs text-neutral-500 font-mono flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span>SQLite Movie Review Ledger: Online (WAL journal mode)</span>
        </div>
        <div className="text-[11px] text-neutral-600">
          <span>Note: You can export your full workspace with database and files via the settings menu at any time.</span>
        </div>
      </footer>
    </div>
  );
}
