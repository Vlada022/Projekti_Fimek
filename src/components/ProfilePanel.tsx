import React, { useState } from 'react';
import { UserProfile } from '../types';
import { User, Mail, MapPin, Globe, Film, Edit3, Save, ShieldCheck, Github, Clock } from 'lucide-react';
import { motion } from 'motion/react';

interface ProfilePanelProps {
  user: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => Promise<boolean>;
}

export default function ProfilePanel({ user, onUpdateProfile }: ProfilePanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    display_name: user.display_name,
    email: user.email || '',
    bio: user.bio || '',
    location: user.location || '',
    website: user.website || '',
    favorite_genres: user.favorite_genres || ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (errorMsg) setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.display_name.trim()) {
      setErrorMsg('Display name is required');
      return;
    }

    setIsSaving(true);
    setSuccessMsg(false);

    const success = await onUpdateProfile(formData);
    setIsSaving(false);

    if (success) {
      setSuccessMsg(true);
      setIsEditing(false);
      setTimeout(() => setSuccessMsg(false), 3000);
    } else {
      setErrorMsg('Failed to persist profile to SQLite DB.');
    }
  };

  const isOAuth = user.id.startsWith('github_');

  return (
    <div id="profile-panel" className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Upper Cover Gradient */}
      <div className="h-32 bg-gradient-to-r from-emerald-600 via-teal-700 to-indigo-800 relative">
        <div className="absolute top-4 right-4 bg-neutral-950/60 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-mono font-medium text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>SQLite Store Active</span>
        </div>
      </div>

      {/* Main Avatar & General Details Header */}
      <div className="px-6 pb-6 relative">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-16 mb-6 gap-4">
          <div className="relative inline-block">
            <img
              src={user.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150'}
              alt={user.display_name}
              className="w-28 h-28 rounded-2xl border-4 border-neutral-900 object-cover shadow-lg bg-neutral-800"
              referrerPolicy="no-referrer"
            />
            <div className="absolute -bottom-1 -right-1 p-1.5 bg-neutral-900 border border-neutral-700 rounded-lg text-neutral-300">
              {isOAuth ? <Github className="w-4 h-4 fill-current text-white" /> : <User className="w-4 h-4 text-emerald-400" />}
            </div>
          </div>

          <div className="flex gap-2">
            {!isEditing ? (
              <button
                id="btn-edit-profile"
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 hover:border-neutral-600 text-white rounded-lg text-sm font-medium transition-all duration-150 inline-flex items-center gap-2 cursor-pointer test-btn-edit-profile"
              >
                <Edit3 className="w-4 h-4" />
                Edit Profile
              </button>
            ) : (
              <button
                id="btn-cancel-edit-profile"
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    display_name: user.display_name,
                    email: user.email || '',
                    bio: user.bio || '',
                    location: user.location || '',
                    website: user.website || '',
                    favorite_genres: user.favorite_genres || ''
                  });
                }}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer test-btn-cancel-edit-profile"
              >
                Cancel
              </button>
            )}
          </div>
        </div>

        {/* Edit and View Content State toggling */}
        {!isEditing ? (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-display font-bold text-white tracking-tight flex items-center gap-2">
                {user.display_name}
              </h2>
              <p className="text-sm font-mono text-neutral-400 mt-0.5">@{user.username}</p>
            </div>

            {/* User Bio */}
            {user.bio ? (
              <p className="text-sm text-neutral-300 leading-relaxed italic border-l-2 border-neutral-700 pl-4 py-1">
                "{user.bio}"
              </p>
            ) : (
              <p className="text-sm text-neutral-500 leading-relaxed italic">
                No bio added yet. Click Edit Profile to add one!
              </p>
            )}

            {/* Profile Fields Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-neutral-800/60">
              <div className="flex items-center gap-3 text-neutral-300 text-sm">
                <div className="p-2 bg-neutral-800/40 border border-neutral-800 rounded-lg text-neutral-400">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="overflow-hidden">
                  <span className="text-[11px] text-neutral-500 block uppercase font-mono font-bold tracking-wider">Email</span>
                  <span className="truncate block">{user.email || 'N/A'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-neutral-300 text-sm">
                <div className="p-2 bg-neutral-800/40 border border-neutral-800 rounded-lg text-neutral-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] text-neutral-500 block uppercase font-mono font-bold tracking-wider">Location</span>
                  <span>{user.location || 'Everywhere'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-neutral-300 text-sm">
                <div className="p-2 bg-neutral-800/40 border border-neutral-800 rounded-lg text-neutral-400">
                  <Globe className="w-4 h-4" />
                </div>
                <div className="overflow-hidden">
                  <span className="text-[11px] text-neutral-500 block uppercase font-mono font-bold tracking-wider">Website</span>
                  {user.website ? (
                    <a
                      href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:underline truncate block"
                    >
                      {user.website}
                    </a>
                  ) : (
                    <span className="text-neutral-500">N/A</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 text-neutral-300 text-sm">
                <div className="p-2 bg-neutral-800/40 border border-neutral-800 rounded-lg text-neutral-400">
                  <Film className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] text-neutral-500 block uppercase font-mono font-bold tracking-wider">Favorite Genres</span>
                  <span>{user.favorite_genres || 'Action, Comedy, Drama'}</span>
                </div>
              </div>
            </div>

            {/* Profile Audit Metadata */}
            <div className="flex flex-wrap gap-4 pt-6 mt-6 border-t border-neutral-800/60 text-[11px] font-mono text-neutral-500">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Created: {user.created_at}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>ID: {user.id}</span>
              </div>
            </div>
          </div>
        ) : (
          /* Profile Edit Form */
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <h3 className="font-display font-semibold text-white text-sm uppercase tracking-wider mb-2">Edit SQL User Profile</h3>

            {errorMsg && (
              <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-lg text-xs text-red-300">
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="profile-display-name" className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider block">Display Name *</label>
                <input
                  id="profile-display-name"
                  type="text"
                  name="display_name"
                  value={formData.display_name}
                  onChange={handleChange}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 text-white rounded-lg px-3 py-2 text-sm outline-none transition-colors test-profile-display-name"
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="profile-email" className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider block">Email Address</label>
                <input
                  id="profile-email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 text-white rounded-lg px-3 py-2 text-sm outline-none transition-colors test-profile-email"
                  placeholder="name@email.com"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="profile-location" className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider block">Location</label>
                <input
                  id="profile-location"
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 text-white rounded-lg px-3 py-2 text-sm outline-none transition-colors test-profile-location"
                  placeholder="San Francisco, CA"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="profile-website" className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider block">Personal Website</label>
                <input
                  id="profile-website"
                  type="text"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 text-white rounded-lg px-3 py-2 text-sm outline-none transition-colors test-profile-website"
                  placeholder="https://example.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="profile-favorite-genres" className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider block">Favorite Movie Genres</label>
              <input
                id="profile-favorite-genres"
                type="text"
                name="favorite_genres"
                value={formData.favorite_genres}
                onChange={handleChange}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 text-white rounded-lg px-3 py-2 text-sm outline-none transition-colors test-profile-favorite-genres"
                placeholder="Sci-Fi, Crime Noir, Drama (Comma separated)"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="profile-bio" className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider block">Profile Biography</label>
              <textarea
                id="profile-bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={3}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-emerald-500 text-white rounded-lg px-3 py-2 text-sm outline-none transition-colors resize-none test-profile-bio"
                placeholder="Tell us about yourself..."
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                id="btn-discard-profile"
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-neutral-850 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 rounded-lg text-sm font-medium transition-colors cursor-pointer"
              >
                Discard
              </button>
              <button
                id="btn-save-profile-changes"
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 border border-emerald-500 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 test-btn-save-profile"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}

        {/* Global Success Banner */}
        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-4 left-6 right-6 bg-emerald-950/80 backdrop-blur border border-emerald-800/80 rounded-xl p-3 flex items-center justify-between text-xs text-emerald-300 font-mono shadow-lg"
          >
            <span>💾 SQLite Write Success! Profile persisted securely.</span>
            <span className="text-[10px] text-emerald-500">LOGGED</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
