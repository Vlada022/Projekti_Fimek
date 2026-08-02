# Primena DevOps i CI/CD procesa u razvoju skalabilne web aplikacije
> **Razvoj aplikacije sa automatizacijom testiranja, Docker kontejnerima i automatskim deploy procesom**

---

## 1. Uvod i Arhitektura DevOps Sistema

Moderne skalabilne web aplikacije zahtevaju visoku pouzdanost, kontinualnu isporuku novih funkcionalnosti i nulto zastojno vreme (*zero-downtime deployment*). Primena **DevOps** metodologije i **CI/CD (Continuous Integration / Continuous Deployment)** procesa omogućava automatsku validaciju svakog commit-a kroz lintere, jedinčne i integracione testove, statičku analizu bezbednosti (SonarQube/ESLint/PMD), kao i automatizovano pakovanje u nepromenljive (*immutable*) Docker kontejnere i deployment na Cloud infrastrukturu.

### Ključni stubovi DevOps arhitekture u ovoj aplikaciji:
1. **Automatsko Testiranje**: Vitest jedinčni testovi i Playwright e2e automatizovani testovi.
2. **Statika Koda & Sigurnost**: Lokalne i pipeline provere opremljene SonarQube, PMD i ESLint pravilima.
3. **Kontejnerizacija**: Multi-stage Docker build za minimalan napadački površinski sloj i brže pokretanje.
4. **Automatski CI/CD Pipeline**: GitHub Actions workflow sa staging i production automatskim deploy koracima.

---

## 2. Automatizacija Testiranja (Automated Testing Framework)

Automatsko testiranje osigurava da novi kod ne narušava postojeću funkcionalnost (regresioni testovi) i da web aplikacija ispunjava sve funkcionalne i bezbednosne specifikacije pre izrade Docker kontejnera.

### Primer 1: Vitest Jedinični i Integracioni Test (Pseudo-kod / Skripta)

```typescript
// tests/unit/movie-search.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { searchAndFilterMovies } from '../../src/services/movieService';

describe('Movie Search & Filtering Integration Test', () => {
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      prepare: (sql: string) => ({
        all: (...params: any[]) => [
          { id: 'm1', title: 'Inception', genre: 'Sci-Fi', rating: 8.8 },
          { id: 'm2', title: 'Interstellar', genre: 'Sci-Fi', rating: 8.6 }
        ]
      })
    };
  });

  it('treba sigurno filtrirati filmove koristeći parametrizovane upite (Bez SQL Injection)', () => {
    const results = searchAndFilterMovies(mockDb, 'Inception', 'Sci-Fi');
    expect(results).toHaveLength(2);
    expect(results[0].title).toBe('Inception');
  });
});
```

### Primer 2: Playwright End-to-End Automated Browser Test

```typescript
// tests/e2e/code-audit-editor.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Code Audit Editor & Quality Scan Flow', () => {
  test('Korisnik pokreće preset scenario i dobija linter izveštaj', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Otvori Code Audit Editor tab
    await page.click('#btn-nav-analyzer');
    await expect(page.locator('text=CODE AUDIT EDITOR')).toBeVisible();

    // Izaberi preset "Movie Grid Complex Render & Keys Warning"
    await page.click('button:has-text("Movie Grid Complex")');

    // Proveri da li je linter detektovao ESLint / PMD upozorenja
    await expect(page.locator('text=ESLint Linter')).toBeVisible();
    await expect(page.locator('text=Missing "key" prop')).toBeVisible();
  });
});
```

---

## 3. Kontejnerizacija sa Docker-om

Docker omogućava izolaciju aplikacije i njenih zavisnosti. Korišćenjem **Multi-stage Docker build-a**, smanjujemo veličinu finalne slike sa ~1GB na ispod ~150MB, što drastično ubrzava deployment i skaliranje.

### Multi-stage Dockerfile (Optimized Production Image)

```dockerfile
# Stage 1: Dependency Installation & Compilation
FROM node:20-alpine AS builder
WORKDIR /app

# Kopiranje package definicija radi keširanja slojeva
COPY package*.json ./
RUN npm ci

# Kopiranje izvornog koda i kompilacija Vite/Express servera
COPY . .
RUN npm run build

# Stage 2: Production Execution Image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Instalacija minimalnih production zavisnosti
COPY package*.json ./
RUN npm ci --only=production

# Kopiranje kompajliranih artefakata iz builder faze
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/CODE_QUALITY_AUDITOR_GUIDE.pdf ./

EXPOSE 3000

# Neprivilegovani korisnik za maksimalnu sigurnost
USER node

CMD ["node", "dist/server.cjs"]
```

### Lokalno Razvojno Okruženje (`docker-compose.yml`)

```yaml
version: '3.8'

services:
  web-app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - PORT=3000
    volumes:
      - .:/app
      - /app/node_modules
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 15s
      timeout: 5s
      retries: 3
```

---

## 4. CI/CD Automatski Pipeline (GitHub Actions Workflow)

CI/CD pipeline se automatski okida pri svakom `git push` ili `Pull Request` na `main` granu. On prolazi kroz faze validacije, gradnje kontejnera, registra i produkcionog deploy-a.

```yaml
# .github/workflows/devops-cicd-pipeline.yml
name: Scalable Web App CI/CD Pipeline

on:
  push:
    branches: [ main, staging ]
  pull_request:
    branches: [ main ]

jobs:
  # Faza 1: Linting, Statika i Automatski Testovi
  validate-and-test:
    name: 🧪 Automated Testing & Code Audit
    runs-on: ubuntu-latest
    steps:
      - name: Checkout izvornog koda
        uses: actions/checkout@v4

      - name: Podešavanje Node.js okruženja
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Instalacija zavisnosti
        run: npm ci

      - name: Pokretanje Lintera (ESLint / TypeScript)
        run: npm run lint

      - name: Pokretanje Jediničnih Testova (Vitest)
        run: npm run test:unit

      - name: Pokretanje End-to-End Testova (Playwright)
        run: npx playwright test

  # Faza 2: Izrada Docker Kontejnera i Push u Artifact Registry
  build-and-push-docker:
    name: 🐳 Docker Multi-Stage Build & Registry Push
    needs: validate-and-test
    runs-on: ubuntu-latest
    steps:
      - name: Checkout koda
        uses: actions/checkout@v4

      - name: Autentifikacija na Google Cloud / Docker Registry
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}

      - name: Izrada i Push Docker Slike sa SHA Tagom
        run: |
          IMAGE_TAG="europe-west2-docker.pkg.dev/${{ secrets.GCP_PROJECT_ID }}/app-repo/web-app:${{ github.sha }}"
          docker build -t $IMAGE_TAG .
          docker push $IMAGE_TAG

  # Faza 3: Automatski Deployment na Cloud Run (Zero Downtime)
  deploy-production:
    name: 🚀 Production Auto-Deploy (Cloud Run)
    needs: build-and-push-docker
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy na Cloud Run
        uses: google-github-actions/deploy-cloudrun@v2
        with:
          service: 'scalable-web-app'
          region: 'europe-west2'
          image: 'europe-west2-docker.pkg.dev/${{ secrets.GCP_PROJECT_ID }}/app-repo/web-app:${{ github.sha }}'

      - name: Health Check & Smoke Test
        run: |
          curl -f https://ais-dev-rvmpd7a4bp5uqvtic45iny-306948099795.europe-west2.run.app/api/health || exit 1
```

---

## 5. UI Ekranopisi i Vizuelni Prikaz Interfejsa

### 1. Vizuelni Grafički Prikaz CI/CD Pipeline Staza (GitHub Actions Executed #142)

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ Pipeline Run #142 — Push event to origin/main                      ✓ PASSED (2m 14s)  │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────┐   ┌──────────────────┐   ┌──────────────────┐   ┌───────────────────┐ │
│ │ Code         │   │ Lint & Static    │   │ Playwright       │   │ Docker Build      │ │
│ │ Checkout     ├──>│ Audit            ├──>│ Tests            ├──>│ & Push            │ │
│ │ ✓ 4s         │   │ ✓ 18s            │   │ ✓ 42s            │   │ ✓ 51s             │ │
│ └──────────────┘   └──────────────────┘   └──────────────────┘   └─────────┬─────────┘ │
│                                                                            │           │
│                                           ┌────────────────────────────────┘           │
│                                           ▼                                            │
│                                  ┌──────────────────┐                                  │
│                                  │ Cloud Run Deploy │                                  │
│                                  │ ● Active (19s)   │                                  │
│                                  └──────────────────┘                                  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2. Ekranopis Docker Container Status & Metrics Dashboard UI

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 🐳 DOCKER CONTAINER RUNTIME MONITOR                                  ● RUNNING (Port) │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ CONTAINER ID                   CPU & MEMORY                   HEALTH CHECK             │
│ c8f92a10e4b7                   0.8% / 128MB                   HTTP 200 OK              │
│ node:20-alpine (Runner)        Limit: 512MB RAM               /api/health (Every 15s)  │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ CONTAINER LOGSTREAM (STDOUT):                                                          │
│ [INFO] 2026-08-02 08:35:12 - Server running on http://0.0.0.0:3000                      │
│ [INFO] 2026-08-02 08:35:14 - Local Static Rules Engine (SonarQube/ESLint/PMD) init.    │
│ [INFO] 2026-08-02 08:35:20 - GET /api/health 200 - 1.2ms                               │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Detaljno Objašnjenje Integracije i Rollback Strategije

| Faza Lanca | Isporučena Komponenta | Integraciono Objašnjenje i Zaštitni Mehanizam |
| :--- | :--- | :--- |
| **1. Git Trigger** | `Git Webhook` | Svaki `git push` šalje webhook notifikaciju sa SHA hesom komita ka CI runner-u. |
| **2. Statika & Testovi** | `Vitest + ESLint + SonarQube` | Ako bilo koji jedinični test ili kritično SonarQube pravilo (npr. SQL Injection) padne, pipeline prekida rad i blokira build. |
| **3. Kontejnerizacija** | `Docker Multi-Stage Build` | Predstavlja nepromenljivu artefakt sliku (*immutable image*) koja garantuje identično ponašanje u lokalnom i produkcionom okruženju. |
| **4. CD Deployment** | `Cloud Run Rolling Upgrade` | Novi Docker kontejner se pokreće paralelno sa starim. Saobraćaj se preusmerava tek nakon što nova verzija prođe `/api/health` provere. |
| **5. Rollback Strategija** | `Automatski Rollback` | Ako nova verzija vrati HTTP 5xx ili padne na smoke testu, trafik se u milisekundi vraća na prethodnu ispravnu Docker reviziju. |
