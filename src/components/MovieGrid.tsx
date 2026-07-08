import React, { useState } from 'react';
import { Movie, UserProfile } from '../types';
import { Search, Film, Star, Clock, Edit2, Trash2, Shield, Eye, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MovieGridProps {
  movies: Movie[];
  currentUser: UserProfile;
  onEditMovie: (movie: Movie) => void;
  onDeleteMovie: (id: string) => Promise<void>;
  onSelectMovie: (movie: Movie) => void;
}

export default function MovieGrid({ movies, currentUser, onEditMovie, onDeleteMovie, onSelectMovie }: MovieGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');

  // Derive unique genres
  const allGenres = ['All', ...new Set(movies.flatMap(m => m.genre.split(',').map(g => g.trim())))];

  // Filter movies
  const filteredMovies = movies.filter(movie => {
    const matchesSearch = movie.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          movie.director.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          movie.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = selectedGenre === 'All' || movie.genre.includes(selectedGenre);
    return matchesSearch && matchesGenre;
  });

  return (
    <div className="space-y-6">
      {/* Search and Filters panel */}
      <div id="search-filters-panel" className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <label htmlFor="movie-search" className="sr-only">Search movies, directors, plot</label>
          <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-3.5" />
          <input
            id="movie-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search films, directors, plot..."
            className="w-full bg-neutral-950 border border-neutral-850 text-white rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none focus:border-emerald-500 transition-colors test-movie-search"
          />
        </div>

        {/* Genre filters */}
        <div id="genre-filters-list" className="flex flex-wrap gap-1.5 self-start md:self-auto overflow-x-auto max-w-full pb-1 md:pb-0">
          {allGenres.slice(0, 7).map(genre => (
            <button
              id={`btn-genre-${genre.toLowerCase().replace(/\s+/g, '-')}`}
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap test-genre-btn ${
                selectedGenre === genre
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-850'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {/* Grid List */}
      <div id="movies-catalog-grid" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredMovies.map((movie) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              key={movie.id}
              id={`movie-card-${movie.id}`}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:border-neutral-750 transition-all flex flex-col group relative test-movie-card"
            >
              {/* Cover Image Container */}
              <div className="relative h-48 bg-neutral-950 overflow-hidden">
                <img
                  src={movie.cover || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400'}
                  alt={movie.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    // Fallback image on error
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=400';
                  }}
                  referrerPolicy="no-referrer"
                />
                {/* Rating Badge Overlay */}
                <div className="absolute top-3 left-3 bg-neutral-950/80 backdrop-blur border border-neutral-800/40 px-2 py-1 rounded-lg text-[10px] font-mono font-bold text-amber-400 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>{movie.rating.toFixed(1)}</span>
                </div>

                {/* Cover Hover Action Panel */}
                <div className="absolute inset-0 bg-neutral-950/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-3">
                  <button
                    id={`btn-view-movie-${movie.id}`}
                    onClick={() => onSelectMovie(movie)}
                    className="p-2.5 bg-neutral-900/90 border border-neutral-800 rounded-xl hover:bg-emerald-600 hover:text-white hover:border-emerald-500 transition-all text-neutral-200 cursor-pointer flex items-center gap-1.5 text-xs font-semibold test-btn-view-movie"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Detail</span>
                  </button>
                </div>
              </div>

              {/* Movie Meta Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4
                      id={`movie-title-click-${movie.id}`}
                      onClick={() => onSelectMovie(movie)}
                      className="text-base font-bold text-white tracking-tight hover:text-emerald-400 transition-colors cursor-pointer line-clamp-1 test-movie-title-header"
                    >
                      {movie.title}
                    </h4>
                    <span className="text-xs font-mono font-semibold text-neutral-500 shrink-0">
                      {movie.year}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed italic">
                    "{movie.description || 'No plot synopsis provided.'}"
                  </p>

                  <div className="flex flex-wrap gap-1 pt-1">
                    {movie.genre.split(',').map(g => (
                      <span key={g} className="px-2 py-0.5 bg-neutral-950 border border-neutral-850 rounded-md text-[9px] text-neutral-400 font-medium">
                        {g.trim()}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer Meta & Actions */}
                <div className="border-t border-neutral-800/60 pt-4 mt-4 flex items-center justify-between text-[10px] text-neutral-500">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-neutral-600" />
                      {movie.duration}
                    </span>
                  </div>

                  {/* Actions (Allowed for instant testing) */}
                  <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      id={`btn-edit-movie-${movie.id}`}
                      onClick={() => onEditMovie(movie)}
                      className="p-1.5 bg-neutral-850 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-neutral-400 hover:text-emerald-400 transition-colors cursor-pointer test-btn-edit-movie"
                      title="Edit Film Metadata"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      id={`btn-delete-movie-${movie.id}`}
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete film "${movie.title}"?`)) {
                          onDeleteMovie(movie.id);
                        }
                      }}
                      className="p-1.5 bg-neutral-850 hover:bg-red-950 hover:border-red-900/30 rounded-lg text-neutral-400 hover:text-red-400 transition-colors cursor-pointer test-btn-delete-movie"
                      title="Delete Film"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredMovies.length === 0 && (
          <div className="col-span-full bg-neutral-900 border border-neutral-800 rounded-2xl py-12 px-6 text-center text-neutral-500 flex flex-col items-center justify-center gap-2">
            <Film className="w-10 h-10 text-neutral-700 animate-pulse" />
            <span className="text-sm font-semibold text-neutral-400">No films found in SQLite DB</span>
            <span className="text-xs text-neutral-500">Try adjusting your filters or add a new film above!</span>
          </div>
        )}
      </div>
    </div>
  );
}
