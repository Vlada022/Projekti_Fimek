import React from 'react';
import { Movie } from '../types';
import { X, Star, Calendar, Clock, User, ShieldCheck, Film, Tag } from 'lucide-react';
import { motion } from 'motion/react';

interface MovieDetailsModalProps {
  movie: Movie | null;
  onClose: () => void;
}

export default function MovieDetailsModal({ movie, onClose }: MovieDetailsModalProps) {
  if (!movie) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl relative"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-neutral-950/60 hover:bg-neutral-950 text-neutral-400 hover:text-white rounded-full border border-neutral-800/40 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col md:flex-row">
          {/* Cover image area */}
          <div className="w-full md:w-2/5 h-64 md:h-auto bg-neutral-950 relative">
            <img
              src={movie.cover || 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400'}
              alt={movie.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-neutral-900 via-transparent to-transparent pointer-events-none" />
          </div>

          {/* Metadata detail body */}
          <div className="p-6 md:p-8 flex-1 space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-md text-[10px] font-mono font-bold text-amber-400 flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span>{movie.rating.toFixed(1)} / 10</span>
                </span>
                <span className="text-[10px] text-neutral-500 font-mono">SQLite ID: {movie.id}</span>
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight leading-tight">
                {movie.title}
              </h2>
              <p className="text-xs text-neutral-400 font-medium mt-1">Directed by <span className="text-neutral-200">{movie.director}</span></p>
            </div>

            {/* Quick Metadata Pill row */}
            <div className="grid grid-cols-3 gap-3 py-3 border-y border-neutral-800/60 text-xs">
              <div className="text-center">
                <span className="text-[10px] text-neutral-500 block uppercase font-mono tracking-wider mb-0.5">Year</span>
                <span className="font-semibold text-neutral-200 flex items-center justify-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                  {movie.year}
                </span>
              </div>
              <div className="text-center border-x border-neutral-800/60">
                <span className="text-[10px] text-neutral-500 block uppercase font-mono tracking-wider mb-0.5">Length</span>
                <span className="font-semibold text-neutral-200 flex items-center justify-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-neutral-500" />
                  {movie.duration}
                </span>
              </div>
              <div className="text-center">
                <span className="text-[10px] text-neutral-500 block uppercase font-mono tracking-wider mb-0.5">Owner</span>
                <span className="font-semibold text-neutral-200 flex items-center justify-center gap-1">
                  <User className="w-3.5 h-3.5 text-neutral-500" />
                  SQLite
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] text-neutral-500 block uppercase font-mono tracking-wider font-bold">Synopsis</span>
              <p className="text-xs text-neutral-300 leading-relaxed italic font-sans">
                "{movie.description || 'No summary plot details added yet. Feel free to edit metadata to supply plot.'}"
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] text-neutral-500 block uppercase font-mono tracking-wider font-bold">Genres</span>
              <div className="flex flex-wrap gap-1.5">
                {movie.genre.split(',').map(genre => (
                  <span key={genre} className="px-2.5 py-1 bg-neutral-950 border border-neutral-850 rounded-lg text-[10px] text-neutral-300 font-medium">
                    {genre.trim()}
                  </span>
                ))}
              </div>
            </div>

            {/* Ledger Footprint Note */}
            <div className="pt-4 border-t border-neutral-800/60 flex items-center gap-2 text-[10px] text-neutral-500 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Full CRUD ledger footprint auditable in SQLite logs</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
