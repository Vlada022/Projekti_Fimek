import React, { useState, useEffect } from 'react';
import { Movie } from '../types';
import { Film, Calendar, Tag, Shield, PlusCircle, Check, X, Star, Clock } from 'lucide-react';

interface MovieFormProps {
  movieToEdit?: Movie | null;
  onSubmit: (movieData: any) => Promise<boolean>;
  onCancel: () => void;
}

export default function MovieForm({ movieToEdit, onSubmit, onCancel }: MovieFormProps) {
  const [title, setTitle] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [genre, setGenre] = useState('');
  const [director, setDirector] = useState('');
  const [duration, setDuration] = useState('');
  const [rating, setRating] = useState(5.0);
  const [cover, setCover] = useState('');
  const [description, setDescription] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (movieToEdit) {
      setTitle(movieToEdit.title);
      setYear(movieToEdit.year);
      setGenre(movieToEdit.genre);
      setDirector(movieToEdit.director);
      setDuration(movieToEdit.duration);
      setRating(movieToEdit.rating);
      setCover(movieToEdit.cover);
      setDescription(movieToEdit.description);
    } else {
      setTitle('');
      setYear(new Date().getFullYear());
      setGenre('');
      setDirector('');
      setDuration('');
      setRating(7.5);
      setCover('');
      setDescription('');
    }
  }, [movieToEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg('Movie title is required.');
      return;
    }

    setIsSubmitting(true);
    const success = await onSubmit({
      title: title.trim(),
      year: Number(year),
      genre: genre.trim() || 'Unknown',
      director: director.trim() || 'Unknown',
      duration: duration.trim() || 'N/A',
      rating: Number(rating),
      cover: cover.trim(),
      description: description.trim()
    });
    setIsSubmitting(false);

    if (!success) {
      setErrorMsg('Failed to save movie to SQLite DB.');
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <h3 className="text-sm uppercase font-mono font-bold tracking-wider text-emerald-400 flex items-center gap-2">
          <Film className="w-4 h-4" />
          <span>{movieToEdit ? 'Edit Movie Record' : 'Add Movie to SQLite DB'}</span>
        </h3>
        <button
          onClick={onCancel}
          className="p-1 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-950/40 border border-red-900/60 rounded-xl text-xs text-red-300">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="space-y-1.5">
          <label htmlFor="movie-title" className="text-neutral-400 font-mono font-bold uppercase tracking-wide">Title *</label>
          <input
            id="movie-title"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 text-white rounded-lg px-3 py-2 outline-none transition-colors test-movie-title"
            placeholder="E.g. Inception"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="movie-year" className="text-neutral-400 font-mono font-bold uppercase tracking-wide">Release Year</label>
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-500" />
              <input
                id="movie-year"
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 text-white rounded-lg pl-9 pr-3 py-2 outline-none transition-colors test-movie-year"
                placeholder="2010"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="movie-rating" className="text-neutral-400 font-mono font-bold uppercase tracking-wide">Rating (0 - 10)</label>
            <div className="relative">
              <Star className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-500" />
              <input
                id="movie-rating"
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 text-white rounded-lg pl-9 pr-3 py-2 outline-none transition-colors test-movie-rating"
                placeholder="8.8"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="movie-genre" className="text-neutral-400 font-mono font-bold uppercase tracking-wide">Genre</label>
            <div className="relative">
              <Tag className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-500" />
              <input
                id="movie-genre"
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 text-white rounded-lg pl-9 pr-3 py-2 outline-none transition-colors test-movie-genre"
                placeholder="Sci-Fi, Action"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="movie-duration" className="text-neutral-400 font-mono font-bold uppercase tracking-wide">Duration</label>
            <div className="relative">
              <Clock className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-500" />
              <input
                id="movie-duration"
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 text-white rounded-lg pl-9 pr-3 py-2 outline-none transition-colors test-movie-duration"
                placeholder="148 min"
              />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="movie-director" className="text-neutral-400 font-mono font-bold uppercase tracking-wide">Director</label>
          <input
            id="movie-director"
            type="text"
            value={director}
            onChange={(e) => setDirector(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 text-white rounded-lg px-3 py-2 outline-none transition-colors test-movie-director"
            placeholder="Christopher Nolan"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="movie-cover" className="text-neutral-400 font-mono font-bold uppercase tracking-wide">Cover Image URL</label>
          <input
            id="movie-cover"
            type="url"
            value={cover}
            onChange={(e) => setCover(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 text-white rounded-lg px-3 py-2 outline-none transition-colors test-movie-cover"
            placeholder="https://images.unsplash.com/..."
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="movie-description" className="text-neutral-400 font-mono font-bold uppercase tracking-wide">Synopsis</label>
          <textarea
            id="movie-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 text-white rounded-lg px-3 py-2 outline-none transition-colors resize-none test-movie-description"
            placeholder="A brief summary of the film plot..."
          />
        </div>

        <div className="pt-2 flex justify-end gap-2">
          <button
            id="btn-movie-cancel"
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-neutral-850 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 rounded-lg font-medium transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            id="btn-movie-submit"
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 test-btn-movie-submit"
          >
            <Shield className="w-4 h-4" />
            {isSubmitting ? 'Writing to SQL...' : movieToEdit ? 'Save Movie' : 'Add Movie'}
          </button>
        </div>
      </form>
    </div>
  );
}
