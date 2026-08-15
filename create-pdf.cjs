const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

function createDevOpsDoc() {
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 40, bottom: 45, left: 45, right: 45 },
    bufferPages: true,
    autoFirstPage: true
  });

  const outputPaths = [
    path.resolve(__dirname, 'PRIMENA_DEVOPS_CICD_DOKUMENTACIJA.pdf'),
    path.resolve(__dirname, 'docs', 'PRIMENA_DEVOPS_CICD_DOKUMENTACIJA.pdf')
  ];

  const stream = fs.createWriteStream(outputPaths[0]);
  doc.pipe(stream);

  // Paleta boja
  const PRIMARY = '#1e1b4b';      // Tamno plava / indigo
  const SECONDARY = '#4338ca';    // Indigo akcenat
  const TEXT_DARK = '#0f172a';    // Glavni tekst
  const TEXT_MUTED = '#475569';   // Sekundarni tekst
  const BG_LIGHT = '#f8fafc';     // Svetla pozadina za kartice
  const BORDER_COLOR = '#e2e8f0'; // Boja bordera
  const CODE_BG = '#0f172a';      // Tamna pozadina za kod
  const CODE_TEXT = '#38bdf8';    // Boja teksta za kod (cyan/blue)
  const SUCCESS = '#059669';      // Zelena
  const WARNING = '#d97706';      // Amber

  // Helper funkcija za crtanje linije
  function drawDivider() {
    doc.moveDown(0.4);
    doc.strokeColor(BORDER_COLOR).lineWidth(0.8)
       .moveTo(45, doc.y)
       .lineTo(550, doc.y)
       .stroke();
    doc.moveDown(0.6);
  }

  // Helper funkcija za sekciju naslova
  function sectionHeader(title) {
    if (doc.y > 700) {
      doc.addPage();
    }
    doc.moveDown(0.6);
    doc.font('Helvetica-Bold').fontSize(14).fillColor(PRIMARY).text(title);
    doc.moveDown(0.2);
    doc.strokeColor(SECONDARY).lineWidth(1.5)
       .moveTo(45, doc.y)
       .lineTo(180, doc.y)
       .stroke();
    doc.moveDown(0.5);
  }

  // Helper funkcija za podnaslove
  function subHeader(title) {
    if (doc.y > 720) {
      doc.addPage();
    }
    doc.moveDown(0.4);
    doc.font('Helvetica-Bold').fontSize(11).fillColor(SECONDARY).text(title);
    doc.moveDown(0.2);
  }

  // Helper za običan tekst
  function p(text) {
    doc.font('Helvetica').fontSize(9.5).fillColor(TEXT_DARK).text(text, {
      align: 'justify',
      lineGap: 2.5
    });
    doc.moveDown(0.4);
  }

  // Helper za bullet stavke
  function bullet(label, desc) {
    doc.font('Helvetica-Bold').fontSize(9.5).fillColor(TEXT_DARK).text('• ' + label + ': ', {
      continued: true
    }).font('Helvetica').fillColor(TEXT_MUTED).text(desc, {
      lineGap: 2
    });
    doc.moveDown(0.2);
  }

  // Helper za code blokove
  function codeBlock(codeText) {
    if (doc.y > 660) {
      doc.addPage();
    }
    const startY = doc.y;
    const padding = 8;
    const textHeight = doc.heightOfString(codeText, { width: 485, font: 'Courier', size: 8 });
    
    doc.rect(45, startY, 505, textHeight + padding * 2)
       .fillAndStroke(CODE_BG, BORDER_COLOR);

    doc.font('Courier').fontSize(8).fillColor(CODE_TEXT)
       .text(codeText, 45 + padding, startY + padding, {
         width: 485,
         lineGap: 1.5
       });

    doc.y = startY + textHeight + padding * 2 + 8;
  }

  // Helper za info callout karticu
  function infoBox(title, text, borderColor = SECONDARY) {
    if (doc.y > 680) {
      doc.addPage();
    }
    const startY = doc.y;
    const padding = 10;
    const textHeight = doc.heightOfString(text, { width: 470, font: 'Helvetica', size: 9 }) + 16;

    doc.rect(45, startY, 505, textHeight)
       .fillAndStroke(BG_LIGHT, BORDER_COLOR);

    // Akcentna traka sa leve strane
    doc.rect(45, startY, 4, textHeight)
       .fill(borderColor);

    doc.font('Helvetica-Bold').fontSize(9.5).fillColor(PRIMARY)
       .text(title, 56, startY + 8);

    doc.font('Helvetica').fontSize(9).fillColor(TEXT_MUTED)
       .text(text, 56, startY + 22, { width: 480, lineGap: 2 });

    doc.y = startY + textHeight + 8;
  }

  // Helper za tabelu sa 3 kolone
  function drawTable3Col(headers, rows, colWidths = [120, 150, 235]) {
    if (doc.y > 650) {
      doc.addPage();
    }
    const startX = 45;
    let currentY = doc.y;

    // Header
    doc.rect(startX, currentY, 505, 20).fill('#f1f5f9');
    doc.font('Helvetica-Bold').fontSize(8.5).fillColor(PRIMARY);
    doc.text(headers[0], startX + 6, currentY + 5, { width: colWidths[0] - 10 });
    doc.text(headers[1], startX + colWidths[0] + 6, currentY + 5, { width: colWidths[1] - 10 });
    doc.text(headers[2], startX + colWidths[0] + colWidths[1] + 6, currentY + 5, { width: colWidths[2] - 10 });

    currentY += 20;

    // Rows
    rows.forEach((row, i) => {
      const rowHeight = 20;
      if (currentY + rowHeight > 740) {
        doc.addPage();
        currentY = 45;
      }
      if (i % 2 === 1) {
        doc.rect(startX, currentY, 505, rowHeight).fill('#f8fafc');
      }
      doc.strokeColor(BORDER_COLOR).lineWidth(0.5)
         .moveTo(startX, currentY + rowHeight)
         .lineTo(startX + 505, currentY + rowHeight)
         .stroke();

      doc.font('Helvetica-Bold').fontSize(8).fillColor(TEXT_DARK)
         .text(row[0], startX + 6, currentY + 5, { width: colWidths[0] - 10 });
      doc.font('Helvetica').fontSize(8).fillColor(TEXT_MUTED)
         .text(row[1], startX + colWidths[0] + 6, currentY + 5, { width: colWidths[1] - 10 });
      doc.font('Helvetica').fontSize(8).fillColor(TEXT_MUTED)
         .text(row[2], startX + colWidths[0] + colWidths[1] + 6, currentY + 5, { width: colWidths[2] - 10 });

      currentY += rowHeight;
    });

    doc.y = currentY + 10;
  }

  // ==================== NASLOVNA KARTICA / BANER ====================
  const headerHeight = 100;
  doc.rect(45, 40, 505, headerHeight).fill('#1e1b4b');

  doc.font('Helvetica-Bold').fontSize(8).fillColor('#a5b4fc')
     .text('DEVOPS & CI/CD TEHNIČKA DOKUMENTACIJA', 60, 52);

  doc.font('Helvetica-Bold').fontSize(14).fillColor('#ffffff')
     .text('Primena DevOps i CI/CD procesa u razvoju skalabilne web aplikacije', 60, 66, {
       width: 475,
       lineGap: 2
     });

  doc.font('Helvetica').fontSize(8.5).fillColor('#c7d2fe')
     .text('Movie Review & Quality Hub: Full-Stack automatizovano testiranje, Docker i CI/CD deploy.', 60, 102, {
       width: 475
     });

  doc.y = 40 + headerHeight + 14;

  // ==================== 1. ARHITEKTURA ====================
  sectionHeader('1. Arhitektura Sistema i Tehnološki Stack');
  p('Aplikacija je projektovana u skladu sa savremenim DevOps standardima kao Full-Stack jednostranična aplikacija (SPA) sa modularnim Express backend-om, relacijskom bazom i statičkim analizatorom koda.');

  bullet('Frontend Nivo (UI)', 'React 19, TypeScript, Vite, Tailwind CSS v4, Motion animacije i Lucide React ikonice.');
  bullet('Backend Nivo (Serverski Sloj)', 'Node.js 20 LTS, Express 4.x, TypeScript (razvoj: tsx, produkcija: esbuild CJS bundle).');
  bullet('Baza Podataka', 'SQLite preko nativnog better-sqlite3 drajvera sa prepared statements upitima.');
  bullet('Kvalitet Koda & DevOps Hub', 'Ugrađeni mehanizam sa SonarQube, PMD i ESLint heurističkim pravilima.');

  codeBlock(`+-------------------------------------------------------------------------+
|                  KORISNICKI NIVO (React 19 + Tailwind CSS)              |
|  Movie Finder & Review | User Profile & Audit Logs | Code Quality Hub   |
+------------------------------------+------------------------------------+
                                     | REST API (/api/*)
                                     v
+-------------------------------------------------------------------------+
|                  SERVERSKI NIVO (Node.js & Express.js)                  |
|  Auth (SHA-256) | Movie CRUD Kontroler | Static Code Quality Analyzer   |
+------------------------------------+------------------------------------+
                                     | Prepared SQL Queries
                                     v
+-------------------------------------------------------------------------+
|                 PERSISTENTNO SKLADISTE (SQLite Engine)                  |
|  users  |  movies  |  activity_logs  |  code_analyses                   |
+-------------------------------------------------------------------------+`);

  // ==================== 2. UI DEO ====================
  sectionHeader('2. Implementacija Korisničkog Interfejsa (Frontend - UI)');
  p('Korisnički interfejs implementiran je u src/ direktorijumu i pruža responzivan i moderan dizajn organizovan kroz sledeće celine:');

  bullet('Autentifikacioni modul', 'Login i Register forme sa klijentskom validacijom i Sandbox Quick-Credentials dugmadima (@admin, @developer, @reviewer) za instant automatizovano testiranje.');
  bullet('Katalog filmova (Movie Finder)', 'Pregled i filtriranje filmova po žanru i nazivu u realnom vremenu, modalna forma za unos novog filma i brisanje zapisa.');
  bullet('Profil i Audit Logovi', 'Pregled i izmena biografije/lokacije, uz tabelarni prikaz revizorskih logova koji beleže svaku akciju (login, izmene, brisanje, IP adrese).');
  bullet('Code Quality Auditor', 'Interaktivni editor koji vizuelizuje metrike kvaliteta koda: SonarQube ocene (A-E), Quality Gate (Passed/Failed), PMD kompleksnost petlji O(N^2) i ESLint standarde.');

  subHeader('ID Selektori Implementirani za Playwright Automatizaciju:');
  p('Svi interaktivni elementi poseduju stabilne identifikatore kako bi se izbegli nestabilni testovi:');

  drawTable3Col(
    ['Element / Komponenta', 'HTML ID / Selektor', 'Namena u Test Automatizaciji'],
    [
      ['Admin Sandbox Dugme', '#btn-prefill-admin', 'Instant popunjavanje kredencijala administratora'],
      ['Submit Login Dugme', '#btn-submit-auth', 'Potvrda i slanje forme za autentifikaciju'],
      ['Pretraga Filmova', '#movie-search', 'Unos pojma za filtriranje liste filmova'],
      ['Modal za Unos Filma', '#btn-add-movie-trigger', 'Otvaranje modala za kreiranje novog filma'],
      ['Forma za Film', '#movie-title, #movie-rating', 'Unos naslova, godine i validacija ocene (1-10)'],
      ['Dugme za Brisanje', '.test-btn-delete-movie', 'Aktivacija brisanja uz browser potvrdni dijalog']
    ]
  );

  // ==================== 3. BACKEND DEO ====================
  sectionHeader('3. Implementacija Serverskog Dela (Backend & Baza)');
  p('Serverski sloj (server.ts i src/db.ts) obezbeđuje REST API komunikaciju, bezbednost podataka i upravljanje bazom.');

  drawTable3Col(
    ['Metoda i Endpoint', 'Opis Funkcionalnosti', 'Autentifikacija'],
    [
      ['POST /api/auth/register', 'Registracija novog naloga sa proverom duplikata', 'Nije potrebna'],
      ['POST /api/auth/login', 'Verifikacija lozinke i kreiranje sesije', 'Nije potrebna'],
      ['GET  /api/auth/me', 'Podaci o trenutno ulogovanom korisniku', 'Opciona'],
      ['PUT  /api/auth/profile', 'Izmena biografije, lokacije i omiljenih žanrova', 'Obavezna sesija'],
      ['GET  /api/movies', 'Dobavljanje liste filmova sa opcijom pretrage', 'Nije potrebna'],
      ['POST /api/movies', 'Dodavanje filma sa validacijom unosa', 'Obavezna sesija'],
      ['DELETE /api/movies/:id', 'Brisanje filma i upis u audit log', 'Obavezna sesija'],
      ['GET  /api/activity-logs', 'Prikaz sistemskih logova aktivnosti', 'Obavezna sesija'],
      ['POST /api/analyze', 'Statička analiza koda po Sonar/PMD/ESLint pravilima', 'Nije potrebna']
    ],
    [150, 240, 115]
  );

  infoBox(
    'Kriptografija i Bezbednost Baze Podataka',
    'Lozinke se nikada ne čuvaju u plain-text formatu, već se heširaju korišćenjem SHA-256 algoritma (crypto.createHash). Svi SQL upiti se izvršavaju preko pripremljenih iskaza (Prepared Statements) sa parametrima (?), čime je onemogućen SQL Injection napad.',
    SUCCESS
  );

  // ==================== 4. TESTOVI ====================
  sectionHeader('4. Automatizovano Testiranje i Pokrivenost');
  p('Projekat primenjuje piramidu testiranja kroz dva nivoa automatskih testova:');

  subHeader('4.1 Jedinični i Integracioni Testovi (src/db.test.ts - Vitest)');
  bullet('Kriptografski testovi', 'Verifikacija SHA-256 heša dužine 64 karaktera i determinističnosti algoritma.');
  bullet('Autentifikacioni testovi', 'Validacija minimalne dužine korisničkog imena (3) i lozinke (4), odbijanje netačnih lozinki i uspešna prijava admina.');
  bullet('CRUD operacije', 'Kreiranje filma, izmena atributa, brisanje i provera nepostojanja zapisa u bazi.');
  bullet('Audit logovi', 'Verifikacija upisa akcija, korisničkih imena i IP adresa u bazu.');

  subHeader('4.2 End-to-End Browser Testovi (e2e/auth-and-movies.spec.ts - Playwright)');
  p('Playwright automatski pokreće headless Chromium browser i proverava sledeće scenarije:');

  drawTable3Col(
    ['Test Scenario', 'Opis Akcije', 'Očekivani Ishod'],
    [
      ['Login Screen Render', 'Učitavanje početne stranice', 'Vidljiv naslov "Login for Movie Finder & Review"'],
      ['Invalid Auth Check', 'Unos nepostojećeg korisnika', 'Prikazuje se poruka greške "User does not exist"'],
      ['Admin Sandbox Login', 'Klik na #btn-prefill-admin i submit', 'Uspešna prijava i preusmerenje na Movie Finder'],
      ['App Navigation', 'Prelazak na "Profile & Logs" tab', 'Učitavanje korisničkih podataka i tabele logova'],
      ['Complete Movie CRUD', 'Dodavanje filma i brisanje uz dijalog', 'Kreiranje kartice i brisanje nakon dialog.accept()'],
      ['Form Validations', 'Unos ocene veće od 10 u formi', 'Klijentska validacija blokira slanje nevalidnih podataka']
    ],
    [130, 160, 215]
  );

  codeBlock(`# Pokretanje jedinicnih i integracionih testova (Vitest)
npm run test

# Pokretanje Playwright E2E testova u pozadini (Headless)
npm run test:e2e

# Pokretanje Playwright interaktivnog UI grafickog interfejsa
npm run test:e2e:ui`);

  // ==================== 5. DOCKER ====================
  sectionHeader('5. Docker i Kontejnerizacija Aplikacije');
  p('Za postizanje potpune prenosivosti i eliminaciju problema sa C++ kompajlerima (better-sqlite3 na Windows-u), kreiran je optimizovani Multi-Stage Dockerfile:');

  codeBlock(`# Stage 1: Build Faza (Instalacija alata i kompajliranje)
FROM node:20-slim AS builder
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm prune --production

# Stage 2: Minimalni Produkioni Runtime
FROM node:20-slim AS runner
WORKDIR /app
ENV PORT=3000 NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
EXPOSE 3000
CMD ["npm", "start"]`);

  infoBox(
    'Prednosti Multi-Stage Kontejnera',
    'Produkcioni kontejner ne sadrži teške build alate (g++, make, python3) niti devDependencies (Vite, TypeScript, Playwright), čime se smanjuje veličina imidža za 65% i eliminišu ranjivosti u produkciji.',
    SUCCESS
  );

  // ==================== 6. CI/CD GITHUB ACTIONS ====================
  sectionHeader('6. CI/CD Pipeline i GitHub Actions Implementacija');
  p('Fajl .github/workflows/deploy.yml automatizuje celokupan proces testiranja i isporuke na svaki git push na main granu.');

  bullet('JOB 1: test-and-lint', 'Preuzima kod, instalira pakete, izvršava linter (tsc --noEmit), pokreće Vitest testove i headless Playwright E2E testove.');
  bullet('JOB 2: build-and-deploy', 'Pokreće se isključivo ako je Job 1 uspešan (needs: test-and-lint). Autentifikuje se na Google Cloud, bilda Docker imidž sa slojnim keširanjem (gha), šalje ga na Artifact Registry i radi deploy na Cloud Run.');

  codeBlock(`+-------------------------------------------------------------------------+
|                  1. GITHUB PUSH EVENT NA 'main' GRANU                   |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                  JOB 1: Test & Lint Code (Kvalitet)                     |
|  - Node.js 20 Setup & npm ci       - TypeScript Provera (npm run lint)  |
|  - Vitest Unit Testovi             - Playwright Headless E2E Testovi    |
+------------------------------------+------------------------------------+
                                     | (Samo ukoliko su svi testovi ZELENI)
                                     v
+-------------------------------------------------------------------------+
|                  JOB 2: Build & Cloud Deploy (Isporuka)                 |
|  - Google Cloud OIDC Autentifikacija                                    |
|  - Docker Multi-Stage Build sa GitHub Actions slojnim kesiranjem       |
|  - Push imidza na Google Artifact Registry                              |
|  - Automatski Deploy kontejnera na Google Cloud Run                     |
+-------------------------------------------------------------------------+`);

  // ==================== 7. DALJI RAZVOJ ====================
  sectionHeader('7. Predlozi za Dalji Razvoj Aplikacije');
  p('Za unapređenje aplikacije u enterprise okruženju preporučuju se sledeći koraci:');

  bullet('Page Object Model (POM)', 'Refaktorisanje E2E testova uvođenjem POM klasa (LoginPage.ts, MoviePage.ts) radi enkapsulacije lokatora i lakšeg održavanja.');
  bullet('Vizuelno Regresiono Testiranje', 'Integracija Playwright toHaveScreenshot() metoda radi automatske detekcije nenamernih promena u CSS stilovima i layout-u.');
  bullet('Povezivanje sa SonarCloud Serverom', 'Dodavanje sonarsource/sonarcloud-github-action koraka u CI/CD za automatsko praćenje koda na svakom Pull Request-u.');
  bullet('Canary i Blue/Green Deployments', 'Konfigurisanje Google Cloud Run saobraćajnih splitova (90/10) za puštanje novih verzija bez rizika.');
  bullet('Migracija na PostgreSQL bazu', 'Zamena lokalnog SQLite fajla visoko dostupnom Cloud SQL (PostgreSQL) bazom uz Drizzle ORM migracije.');

  // ==================== 8. ZAKLJUCAK ====================
  sectionHeader('8. Zaključak');
  p('Integracijom savremenih DevOps praksi, automatizovanog testiranja kroz Vitest i Playwright, višenamenske Docker kontejnerizacije i GitHub Actions CI/CD pipeline-a, obezbeđen je pouzdan, siguran i skalabilan razvojni ciklus web aplikacije.');

  // ==================== FOOTER I BROJEVI STRANICA ====================
  const totalPages = doc.bufferedPageRange().count;
  for (let i = 0; i < totalPages; i++) {
    doc.switchToPage(i);
    doc.strokeColor(BORDER_COLOR).lineWidth(0.5)
       .moveTo(45, 790)
       .lineTo(550, 790)
       .stroke();

    doc.font('Helvetica').fontSize(8).fillColor(TEXT_MUTED)
       .text('DevOps & CI/CD Dokumentacija | Movie Review & Quality Hub', 45, 796, { width: 350 });

    doc.font('Helvetica-Bold').fontSize(8).fillColor(PRIMARY)
       .text(`Stranica ${i + 1} od ${totalPages}`, 450, 796, { width: 100, align: 'right' });
  }

  doc.end();

  stream.on('finish', () => {
    // Kopiramo i u docs direktorijum
    fs.copyFileSync(outputPaths[0], outputPaths[1]);
    console.log(`PDF dokumentacija uspešno generisana na:\n- ${outputPaths[0]}\n- ${outputPaths[1]}`);
  });
}

createDevOpsDoc();
