# 🚀 Voditič za Pokretanje Aplikacije za Početnike

Dobrodošli! Ovaj dokument sadrži korak-po-korak uputstvo kako da klonirate, podesite i pokrenete ovu aplikaciju lokalno na svom računaru od nule.

---

## 📋 1. Preduslovi (Šta vam je potrebno na računaru)

Pre nego što počnete, uverite se da na svom računaru imate instalirane sledeće besplatne alate:

1. **Git** - Alat za preuzimanje i praćenje verzija koda.
   - [Preuzmite Git ovde](https://git-scm.com/downloads)
2. **Node.js (Verzija 20 ili novija)** - Razvojno okruženje za izvršavanje JavaScript i TypeScript koda. *(Node.js dolazi u paketu sa `npm` menadžerom)*.
   - [Preuzmite Node.js LTS ovde](https://nodejs.org/)
3. **Code Editor (Preporučeno: VS Code)** - Besplatan program za rad sa kodom.
   - [Preuzmite VS Code ovde](https://code.visualstudio.com/)
4. *(Opciono)* **Docker Desktop** - Ukoliko želite da pokrenete aplikaciju u izolovanom kontejneru.
   - [Preuzmite Docker ovde](https://www.docker.com/products/docker-desktop/)

---

## 📥 2. Korak 1: Kloniranje Projekta sa Git-a

Otvorite vaš terminal (**Command Prompt**, **PowerShell** na Windows-u ili **Terminal** na Mac/Linux-u) i pokrenite komandu za kloniranje spremišta (replace-ujte sa vašim Git URL-om):

```bash
git clone https://github.com/vas-korisnik/vas-projekat.git
```

---

## 📂 3. Korak 2: Pozicioniranje u Direktorijum Projekta

Nakon preuzimanja, uđite u folder projekta:

```bash
cd vas-projekat
```

*(Zamenite `vas-projekat` tačnim nazivom foldera koji se kreirao).*

---

## ⚙️ 4. Korak 3: Podešavanje Okruženja (`.env` fajl)

Aplikacija koristi konfigurisane promenljive okruženja. U korenu projekta kreirajte `.env` fajl na osnovu priloženog primera `.env.example`:

### Na Linux / macOS / Git Bash:
```bash
cp .env.example .env
```

### Na Windows PowerShell-u:
```powershell
copy .env.example .env
```

*Sadržaj `.env` fajla možete otvoriti u VS Code-u i po potrebi dodati specifične API ključeve ako ih koristite.*

---

## 📦 5. Korak 4: Instalacija Zavisnosti (npm install)

Da bi aplikacija imala sve potrebne biblioteke (React, Vite, Express, Tailwind, itd.), pokrenite:

```bash
npm install
```

> 💡 **Napomena:** Ova komanda se pokreće samo **jednom** nakon kloniranja, ili kada neko od kolega doda novu biblioteku u `package.json`.

---

## 🚀 6. Korak 5: Pokretanje Aplikacije u Razvojnom Režimu (Dev Mode)

Za svakodnevni rad i izmene koda u realnom vremenu, pokrenite razvojni server:

```bash
npm run dev
```

Nakon pokretanja, u terminalu ćete videti poruku nalik sledećoj:
```text
Server running on http://localhost:3000
```

Otvorite vaš internet pregledač (Chrome, Firefox, Edge...) i posetite adresu:
👉 **[http://localhost:3000](http://localhost:3000)**

---

## 🏗️ 7. Korak 6: Izrada i Testiranje Produkcionog Build-a

Kada želite da proverite kako aplikacija radi spremljena za produkciju (bez dev servera):

### 1. Kompajliranje aplikacije:
```bash
npm run build
```

### 2. Pokretanje produkcionog servera:
```bash
npm start
```

Aplikacija će ponovo biti dostupna na adresi `http://localhost:3000`.

---

## 🐳 8. Alternativa: Pokretanje putem Docker-a (Za 1 minut)

Ako imate instaliran **Docker Desktop**, aplikaciju možete pokrenuti bez ručne instalacije Node.js-a ili `npm install` komande!

### Pokretanje jedne komande:
```bash
docker-compose up --build
```

Aplikacija će se automatski spakovati u kontejner i biti dostupna na **`http://localhost:3000`**.

Za zaustavljanje Docker kontejnera pritisnite `Ctrl + C` ili pokrenite:
```bash
docker-compose down
```

---

## 🧪 9. Provera Koda i Pokretanje Automatskih Testova

U projektu su konfigurisani alati za automatsku provere kvaliteta koda, jedinične testove i end-to-end (E2E) browser testove.

### 🔍 1. Provera Lintera i Sintakse TypeScript Koda
Za brzu proveru grešaka u kodu i tipovima pre commit-a pokrenite:
```bash
npm run lint
```

### 🧪 2. Pokretanje Jediničnih i Integracionih Testova (Vitest)
Za pokretanje brzi brze prover unutar logika i servisa pokrenite:
```bash
npm run test
```
*Ili opciono:* `npm run test:unit`

---

### 🎭 3. Pokretanje Automatskih End-to-End (E2E) Testova (Playwright)

Playwright omogućava automatsko testiranje u pravom brauzeru (kliktanje na dugmad, unosi u forme, provera linter izveštaja i navigacija).

#### A. Pokretanje Testova u Pozadini (Headless Mode):
Za brzu i automatsku proveru svih E2E testova u terminalu:
```bash
npx playwright test
```

#### B. Pokretanje Interaktivnog Grafičkog Interfejsa (Playwright UI Mode):
Za početnike i vizuelno praćenje izvršavanja testova korak-po-korak sa prikazom brauzera uživo:
```bash
npx playwright test --ui
```
> 💡 **Šta se dešava pri `--ui` komandi?**
> Otvara se moderan Playwright UI prozor u kojem možete birati pojedinačne testove, gledati snimak svih akcija u aplikaciji (DOM snapshot, mrežne zahtev, klikove mišom) i debug-ovati testove uživo.

#### C. Pregled Detaljnog HTML Izveštaja Testova:
Nakon izvršenih testova, detaljan izveštaj možete otvoriti u pregledaču komandom:
```bash
npx playwright show-report
```

---

## ❓ 10. Često Postavljana Pitanja & Rešavanje Problema

### 1. *"Dobijam grešku: 'npm: command not found'"*
- **Rešenje:** Niste instalirali Node.js ili niste restartovali terminal nakon instalacije. Preuzmite i instalirajte [Node.js](https://nodejs.org/).

### 2. *"Port 3000 is already in use"*
- **Rešenje:** Neki drugi program ili prethodno pokrenut server već zauzima port 3000. Zaustavite prethodne procese u terminalu pritiskanjem `Ctrl + C`.

### 3. *"Kako da zaustavim pokrenut server u terminalu?"*
- U terminalu pritisnite kombinaciju tastera **`Ctrl + C`** i potvrdite sa `Y` ukoliko vas pita.

---

✨ **Čestitamo!** Sada uspešno pokrećete aplikaciju na vašem lokalnom računaru.
