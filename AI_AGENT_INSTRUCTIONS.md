# AI Agent Instructions

This instruction system has been modularized for better maintainability and focused guidance.

**📍 Main Instructions Hub: [`docs/ai-instructions/README.md`](docs/ai-instructions/README.md)**

## Quick Access to Key Instructions

### Core Development Guidelines
- **[Core Principles](docs/ai-instructions/01-core-principles.md)** - Fundamental development approach
- **[Authentication](docs/ai-instructions/02-authentication.md)** - Session-based auth patterns ⚠️ CRITICAL
- **[Page Objects](docs/ai-instructions/03-page-objects.md)** - Page object model guidelines ⚠️ CRITICAL

### Implementation Guidelines
- **[Testing Patterns](docs/ai-instructions/04-testing-patterns.md)** - Test structure and best practices
- **[Code Style](docs/ai-instructions/05-code-style.md)** - TypeScript and formatting standards
- **[Debugging](docs/ai-instructions/06-debugging.md)** - Error handling and troubleshooting

### Advanced Topics
- **[Anti-Patterns](docs/ai-instructions/07-anti-patterns.md)** - Common mistakes to avoid ⚠️ INCLUDES: Static waits, hardcoded values
- **[Advanced Features](docs/ai-instructions/08-advanced.md)** - SmartLogger, utilities, and tools ⚠️ INCLUDES: Utils usage, environment variables

---

⚠️ **CRITICAL REMINDERS**:
- **🔍 ALWAYS inspect live site FIRST** - Launch staging.go.ione.nyc, crawl UI, inspect elements with DevTools before writing ANY test
- **NO static waits** - Use constants from `testTimeouts` fixture and smart waiting strategies
- **NO hardcoded URLs** - Always use `EnvironmentManager.getBaseUrl()` from environment variables  
- **USE utilities properly** - Import and use `elementHelper`, `TestUtils`, `SmartLogger` as documented
- **Follow session authentication** - No login steps in functional tests (session exists)
- **Follow page object patterns** - No direct Playwright API calls in test files

For the complete instruction system, start with the [main hub](docs/ai-instructions/README.md).
