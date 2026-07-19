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

export interface CodeIssue {
  type: 'duplicate' | 'bad-practice' | 'complexity' | 'syntax-error' | 'security-flaw' | 'other';
  line: number;
  severity: 'low' | 'medium' | 'high';
  description: string;
  recommendation: string;
  tool: 'SonarQube' | 'PMD' | 'ESLint';
  ruleId?: string;
  category?: string;
}

export interface CodeAnalysisResult {
  score: number;
  complexityRating: 'Low' | 'Medium' | 'High';
  complexityExplanation: string;
  issues: CodeIssue[];
  refactoredCode: string;
  performanceSummary: string;
  securitySummary: string;
  qualityGate: 'Passed' | 'Failed';
  reliabilityRating: 'A' | 'B' | 'C' | 'D' | 'E';
  securityRating: 'A' | 'B' | 'C' | 'D' | 'E';
  maintainabilityRating: 'A' | 'B' | 'C' | 'D' | 'E';
  technicalDebt: string;
  bugsCount: number;
  vulnerabilitiesCount: number;
  codeSmellsCount: number;
  sonarSummary: string;
  pmdSummary: string;
  eslintSummary: string;
}

export interface CodeAnalysis {
  id: string;
  user_id: string | null;
  title: string;
  language: string;
  code: string;
  score: number;
  complexity_rating: string;
  analysis_json: string;
  created_at: string;
}

