# UML Dijagrami Projekta i Uputstvo za Besplatne Alate

Ovaj dokument sadrži specifikacije i kodove dijagrama koji se mogu direktno kopirati u besplatne UML alate ili otvoriti u namenskom generisanom PDF-u.

## 📄 Generisani Zasebni Fajlovi
- **`UML_DIJAGRAMI.pdf`** *(u root-u i u `/docs/`)* — Zaseban PDF dokument sa svim dijagramima.
- **`PRIMENA_DEVOPS_CICD_DOKUMENTACIJA.pdf`** — Glavna tehnička DevOps & CI/CD dokumentacija.
- **`/docs/dijagrami/1_arhitektura_sistema.puml`** — PlantUML izvorni kod arhitekture sistema.
- **`/docs/dijagrami/2_test_automation_framework.puml`** — PlantUML izvorni kod okvira za testiranje.

---

## 🛠️ Besplatni Alati za Otvaranje i Editovanje UML Dijagrama

1. **Mermaid Live Editor (Web - Bez instalacije):**
   - URL: [https://mermaid.live](https://mermaid.live)
   - Samo prekopirajte Mermaid kod ispod i odmah dobijate interaktivni dijagram sa mogućnošću izvoza u PNG, SVG ili PDF.

2. **PlantUML Online Server (Web - Bez instalacije):**
   - URL: [http://www.plantuml.com/plantuml](http://www.plantuml.com/plantuml)
   - Otvorite `.puml` fajl iz `/docs/dijagrami/` foldera ili kopirajte `@startuml ... @enduml` blok.

3. **Draw.io / Diagrams.net (Web & Desktop):**
   - URL: [https://app.diagrams.net](https://app.diagrams.net)
   - U meniju izaberite: **Arrange > Insert > Advanced > Mermaid** (ili **PlantUML**) i zalepite kod.

---

## 📊 Dijagram 1: Arhitektura Sistema i Domenski Model (Mermaid Kod)

```mermaid
classDiagram
    direction TB

    class User {
        +string id
        +string username
        +string password_hash
        +string role
        +string bio
        +string location
        +string favorite_genres
        +string created_at
    }

    class Movie {
        +string id
        +string user_id
        +string title
        +number year
        +string genre
        +string director
        +string duration
        +number rating
        +string cover
        +string description
        +string created_at
    }

    class ActivityLog {
        +number id
        +string user_id
        +string username
        +string action
        +string details
        +string ip_address
        +string timestamp
    }

    class CodeAnalysis {
        +string id
        +string user_id
        +string code_snippet
        +number score
        +string quality_gate
        +string reliability_rating
        +string security_rating
        +string maintainability_rating
        +string technical_debt
        +string issues_json
        +string created_at
    }

    class DatabaseService {
        -Database db
        +hashPassword(password: string) string
        +createUser(user) User
        +authenticateUser(username, password) User
        +getUserById(id: string) User
        +updateUserProfile(id, bio, location, genres) User
        +getAllMovies(searchQuery) Movie[]
        +getMovieById(id: string) Movie
        +createMovie(userId, movie) Movie
        +deleteMovie(id: string) boolean
        +logActivity(userId, username, action, details, ip) void
        +getActivityLogs(limit) ActivityLog[]
        +analyzeCodeQuality(code: string) AnalysisResult
    }

    class ExpressAPIControllers {
        +POST /api/auth/register
        +POST /api/auth/login
        +GET  /api/auth/me
        +PUT  /api/auth/profile
        +GET  /api/movies
        +POST /api/movies
        +DELETE /api/movies/:id
        +GET  /api/activity-logs
        +POST /api/analyze
    }

    class ReactFrontendUI {
        +LoginForm (#btn-prefill-admin)
        +MovieGrid (#movie-search)
        +AddMovieModal (#movie-title, #movie-rating)
        +UserProfileView (#profile-bio)
        +AuditLogTable (#btn-nav-profile)
        +CodeQualityAuditor (#code-editor)
    }

    User "1" -- "0..*" Movie : creates
    User "1" -- "0..*" ActivityLog : logs
    User "1" -- "0..*" CodeAnalysis : requests
    DatabaseService ..> User : persists
    DatabaseService ..> Movie : persists
    DatabaseService ..> ActivityLog : records
    DatabaseService ..> CodeAnalysis : stores
    ExpressAPIControllers --> DatabaseService : calls
    ReactFrontendUI --> ExpressAPIControllers : REST HTTP
```

---

## 🎭 Dijagram 2: Okvir za Automatizaciju Testova (Mermaid Kod)

```mermaid
classDiagram
    direction TB

    class CICDPipelineRunner {
        +trigger: onPush("main")
        +job_test_and_lint()
        +executeLinter()
        +executeVitest()
        +executePlaywrightE2E()
        +evaluateQualityGate()
    }

    class VitestDatabaseTestSuite {
        +test_hashPasswordDeterministic()
        +test_userRegistrationValidations()
        +test_authRejectsInvalidCredentials()
        +test_movieCRUDLifecycle()
        +test_activityLogsPersistence()
    }

    class PlaywrightE2ETestSuite {
        +test_loginScreenRender()
        +test_invalidAuthErrorHandling()
        +test_adminSandboxOneClickLogin()
        +test_navigationTabsSwitching()
        +test_completeMovieCRUDWithDialog()
        +test_realTimeSearchFiltering()
        +test_html5ClientValidation()
    }

    class BasePage {
        #Page page
        +goto(path: string) Promise
        +waitForSelector(selector: string) Promise
        +expectVisible(selector: string) Promise
        +takeScreenshot(name: string) Promise
    }

    class LoginPagePOM {
        -Locator usernameInput
        -Locator passwordInput
        -Locator submitButton (#btn-submit-auth)
        -Locator adminPrefillButton (#btn-prefill-admin)
        +login(user, pass) Promise
        +loginAsAdminViaSandbox() Promise
        +verifyErrorDisplayed(msg: string) Promise
    }

    class MovieCatalogPagePOM {
        -Locator searchInput (#movie-search)
        -Locator addMovieTriggerButton (#btn-add-movie-trigger)
        -Locator movieCards (.test-movie-card)
        -Locator deleteButtons (.test-btn-delete-movie)
        +searchMovie(title: string) Promise
        +openAddMovieModal() Promise
        +deleteMovieWithConfirmation(title: string) Promise
    }

    class AddMovieModalPOM {
        -Locator titleInput (#movie-title)
        -Locator ratingInput (#movie-rating)
        -Locator submitButton (#btn-movie-submit)
        +fillMovieDetails(title, year, genre, rating) Promise
        +submitForm() Promise
    }

    CICDPipelineRunner --> VitestDatabaseTestSuite : runs Unit Tests
    CICDPipelineRunner --> PlaywrightE2ETestSuite : runs E2E Tests
    PlaywrightE2ETestSuite --> LoginPagePOM : interacts
    PlaywrightE2ETestSuite --> MovieCatalogPagePOM : interacts
    PlaywrightE2ETestSuite --> AddMovieModalPOM : interacts
    LoginPagePOM --|> BasePage
    MovieCatalogPagePOM --|> BasePage
    AddMovieModalPOM --|> BasePage
```
