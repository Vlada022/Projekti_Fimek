# Code Quality Analyzer & Audit System
## Practical UI & Code Implementation Documentation Guide

---

### Executive Summary

The **Code Quality Analyzer** is an integrated static code audit subsystem in our application. It evaluates code for security vulnerabilities, cognitive complexity hotspots, style smells, and duplicate logic blocks across three unified standard rule engines: **SonarQube Standards**, **PMD Rulesets**, and **ESLint Linter Rules**.

---

## 1. Tool Summary & Core Engine Capabilities

| Tool Engine | Primary Focus Areas | Detection Examples in Our App |
| :--- | :--- | :--- |
| **SonarQube** | Security Vulnerabilities, Code Smells, Reliability Bugs, Technical Debt | SQL Injection risks, direct query string concatenation, unhandled exceptions, hardcoded credentials. |
| **PMD** | Design Architecture, Cognitive Complexity, Copy-Paste Duplication (CPD) | Deeply nested loops ($O(N^2)$ quadratic complexity), duplicate validation logic across multiple branches. |
| **ESLint** | Syntax Integrity, Variable Scope, React Best Practices, Style Rules | Missing React `key` props on mapped elements, residual `console.log` statements, obsolete `var` declarations, inline function bindings inside render loops. |

---

## 2. User Execution Workflow & Application UI Layout

Below is the exact UI component layout for the **Code Audit Editor** where preset scenarios are selected and triggered:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ >_ CODE AUDIT EDITOR                                                          ↺ Clear  │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ SELECT PRESET DEMO SCENARIOS:                                                          │
│ ┌───────────────────────────┐ ┌───────────────────────────┐ ┌────────────────────────┐ │
│ │ Movie Search SQL Inj...   │ │ Movie Grid Complex ...    │ │ Movie Add Form Dupl... │ │
│ │ TYPESCRIPT                │ │ JAVASCRIPT [SELECTED]     │ │ TYPESCRIPT             │ │
│ └───────────────────────────┘ └───────────────────────────┘ └────────────────────────┘ │
│                                                                                        │
│ AUDIT SCANNER ENGINE                                                                   │
│ ┌────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ Local Static Rules Engine (High-Fidelity Offline Scanner)                          │ │
│ └────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                        │
│ FILE TITLE                                                                             │
│ ┌────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ MovieGridRenderer.jsx                                                              │ │
│ └────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                        │
│ LANGUAGE / DIALECT                                                                     │
│ ┌────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ JavaScript                                                                       ▼ │ │
│ └────────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                        │
│ SOURCE CODE                                                                            │
│ ┌────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ import React from 'react';                                                         │ │
│ │                                                                                    │ │
│ │ // ESLint and React warning: nested complex logic in render and missing keys       │ │
│ │ export default function MovieGridRenderer({ moviesList, filterText, ... }) {       │ │
│ │   let displayedMovies = [];                                                        │ │
│ │                                                                                    │ │
│ │   // Cognitive complexity design smell: deep nesting instead of early returns      │ │
│ │   if (moviesList !== null && moviesList !== undefined) {                           │ │
│ └────────────────────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Step-by-Step UI Execution Flow:
1. **Access Code Audit Editor**: Click on the `Code Audit Editor` tab in the application header.
2. **Select & Trigger Preset Scenario**:
   Click any of the 3 preset buttons displayed above the code area:
   - `Movie Search SQL Injection & Sync Block`
   - `Movie Grid Complex Render & Keys Warning` (Targeting ESLint + PMD)
   - `Movie Add Form Duplicate & State Mutation` (Targeting PMD CPD + SonarQube)
3. **Automatic Execution (`runAnalysis`)**:
   Selecting a preset populates the code workspace and automatically triggers the static scanning stream (`runAnalysis`), providing real-time feedback without requiring manual form submission.
4. **Inspect Dashboard Metrics & Interactive Bento Cards**:
   Review the Quality Score, Quality Gate status (`PASSED` / `FAILED`), and click on any of the **SonarQube**, **PMD**, or **ESLint** Bento cards to instantly deep-link and filter the issue list.
5. **Review Refactored Code**:
   Switch to the `Refactored Code` sub-tab to inspect and copy sanitized, parameterized production code.

---

## 3. Practical Preset Examples: UI, Code & Output Breakdown

### Preset 1: `Movie Search SQL Injection & Sync Block`
- **File Analyzed**: `movie-db-adapter.ts` (Language: TypeScript)
- **Code Evaluated**:
  ```typescript
  export function searchAndFilterMovies(dbConnection: any, titleQuery: string, genreFilter: string) {
    // CRITICAL: SQL Injection Risk - Direct query concatenation
    const query = "SELECT * FROM movies WHERE title LIKE '%" + titleQuery + "%' AND genre = '" + genreFilter + "'";
    console.log("Searching database with raw query: " + query);
    
    const statement = dbConnection.prepare(query);
    const results = statement.all();
    
    // ESLint Warning: unused variables left in local scope
    const cachedAt = new Date().toISOString();
    ...
  }
  ```
- **How It Is Implemented in Code (`server.ts`)**:
  - **SonarQube Engine**: Scans string concatenation inside SQL statements (`SELECT ... + input`), generating a `high` severity Security Flaw under Rule ID `S2068/S1523`.
  - **ESLint Engine (`no-console`)**: Flags `console.log("Searching...")` on line 49.
  - **ESLint Engine (`no-unused-vars`)**: Flags unused variable `cachedAt`.
- **What It Provides You in the UI**:
  - **Quality Gate Status**: **FAILED** (Security Rating downgraded to **D**).
  - **Overall Quality Score**: `65 / 100` due to critical security risk.
  - **Technical Debt**: `1h 30m` remediation estimate.
  - **Refactored Code**: Replaces raw string concatenation with secure SQL parameter placeholders (`?`):
    ```typescript
    const query = "SELECT * FROM movies WHERE title LIKE ? AND genre = ?";
    const statement = dbConnection.prepare(query);
    const results = statement.all(`%${titleQuery}%`, genreFilter);
    ```

---

### Preset 2: `Movie Grid Complex Render & Keys Warning`
- **File Analyzed**: `MovieGridRenderer.jsx` (Language: JavaScript / React JSX)
- **Is ESLint Used Here?** **YES! ESLint is the primary target engine for this preset example.**
- **Code Evaluated**:
  ```jsx
  export default function MovieGridRenderer({ moviesList, filterText, selectedGenre, onSelect }) {
    // Cognitive complexity design smell: deep nesting
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
          // WARNING: Missing "key" prop on mapped element!
          <div className="movie-card">
            <button onClick={() => { console.log(movie.title); document.title = movie.title; }}>
              View Details
            </button>
          </div>
        ))}
      </div>
    );
  }
  ```
- **How It Is Implemented in Code (`server.ts`)**:
  - **ESLint Engine (`react/jsx-key`)**: Detects `displayedMovies.map(...)` rendering JSX elements without a unique `key={movie.id}` prop.
  - **ESLint Engine (`no-console`)**: Identifies inline `console.log(...)` statement inside button `onClick` handler.
  - **ESLint Engine (`react/jsx-no-bind`)**: Detects inline arrow function allocation inside render loop.
  - **PMD Engine (`AvoidDeeplyNestedLoops`)**: Detects 5 levels of nested `if` statements and loops, flagging elevated Cognitive Complexity.
- **What It Provides You in the UI**:
  - **ESLint Warning Count**: `3 Warnings` (Missing React key, console log, inline function bind).
  - **PMD Complexity Rating**: **High Cognitive Complexity** (Quadratic branching depth).
  - **Refactored Code**: Converts deep nested `if` statements into clean array `.filter()` guard clauses and adds `key={movie.id}` to mapped React cards.

---

### Preset 3: `Movie Add Form Duplicate & State Mutation`
- **File Analyzed**: `MovieFormValidator.ts` (Language: TypeScript)
- **Code Evaluated**:
  ```typescript
  export function validateMovieInputs(movie: MovieInput) {
    // SonarQube Code Smell & PMD CPD: Duplicate validation blocks
    if (movie.genre === "Action") {
      if (!movie.title || movie.title.trim().length === 0) return { valid: false, error: "Movie title cannot be empty" };
      if (movie.year < 1888 || movie.year > 2030) return { valid: false, error: "Invalid movie release year specified" };
      if (movie.rating < 0 || movie.rating > 10) return { valid: false, error: "Rating must be between 0 and 10" };
      return { valid: true };
    } else if (movie.genre === "Sci-Fi") {
      // EXACT DUPLICATE BLOCK across 10 lines
      if (!movie.title || movie.title.trim().length === 0) return { valid: false, error: "Movie title cannot be empty" };
      if (movie.year < 1888 || movie.year > 2030) return { valid: false, error: "Invalid movie release year specified" };
      if (movie.rating < 0 || movie.rating > 10) return { valid: false, error: "Rating must be between 0 and 10" };
      return { valid: true };
    }
    
    // ESLint Rule (no-param-reassign): Direct parameter mutation
    movie.genre = "General";
    return { valid: true };
  }
  ```
- **How It Is Implemented in Code (`server.ts`)**:
  - **PMD CopyPasteDetector (CPD) Engine**: Canonicalizes lines and scans sliding windows. Detects identical sequence of 10+ matching lines starting at line 148.
  - **SonarQube Rule (`S1192`)**: Flags duplicated validation logic and duplicate string literals.
  - **ESLint Rule (`no-param-reassign`)**: Flags direct object parameter mutation `movie.genre = "General"`.
- **What It Provides You in the UI**:
  - **PMD Duplication Violations**: `1 Duplicated Block Flag` pinpointing exact line numbers.
  - **Maintainability Rating**: Downgraded to **C** due to DRY violations.
  - **Refactored Code**: Consolidates duplicate checks into a single reusable validator function without parameter mutation.

---

## 4. Interactive Bento Grid Deep-Linking UI Feature

The dashboard UI contains an interactive 3-column Bento Grid representing the static rule categories:

- **SonarQube rules** (Blue card) -> Clicking navigates to Rule Violations tab filtered by `SonarQube`.
- **PMD Rulesets** (Purple card) -> Clicking navigates to Rule Violations tab filtered by `PMD`.
- **ESLint Linter** (Amber card) -> Clicking navigates to Rule Violations tab filtered by `ESLint`.

### Implementation Code (`src/App.tsx`):
```tsx
<button
  onClick={() => {
    setActiveResultTab('issues');
    setSelectedToolFilter('ESLint');
  }}
  className="p-4 bg-neutral-950/30 border border-neutral-850 hover:border-amber-500/50 rounded-xl cursor-pointer"
>
  <span className="text-xs font-bold text-neutral-200">ESLint Linter</span>
  <span className="text-xs font-mono font-bold text-amber-400">1 Warning</span>
  <span className="text-[9px] text-amber-400/80">Click to see rules &rarr;</span>
</button>
```

---

## 5. Downloadable PDF & HTML Documentation Access

The documentation is served directly from the Express API server:

- **PDF Download**: Click the **PDF Guide** button in the header or access `/docs/CODE_QUALITY_AUDITOR_GUIDE.pdf` directly.
- **HTML View**: Access `/docs/CODE_QUALITY_AUDITOR_GUIDE.html`.
