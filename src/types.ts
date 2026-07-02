export interface UserProfile {
  id: string;
  github_id: string | null;
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

