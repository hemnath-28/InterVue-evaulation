# AI Coding Rules for Intervue

To maintain consistency and high-quality code, follow these rules when working on this repository:

## 1. UI & Styling
- **Framework**: Use **Tailwind CSS** via CDN for all frontend files.
- **Aesthetic**: Maintain a professional, crisp, Light Mode UI. Avoid "vibe coded" elements like neon glows, heavy gradients, or dot backgrounds unless explicitly requested.
- **Typography**: Use the **Inter** font family for maximum readability.
- **Responsiveness**: Ensure all new UI components are mobile-responsive using Tailwind's `sm:`, `md:`, and `lg:` prefixes.

## 2. Backend & API
- **Authentication**: Always use the `ensureAuthenticated` middleware for routes involving user data (Resumes, Sessions).
- **Error Handling**: Use `try-catch` blocks in controllers and return meaningful JSON error messages to the frontend.
- **Logging**: Maintain helpful console logs for debugging the parsing and speech pipelines.

## 3. Database
- **Schema Integrity**: When adding new fields to models, ensure they are properly documented in the schema and validated where necessary.
- **Population**: Use Mongoose `.populate()` to handle relationships between Users, Resumes, and Sessions to avoid multiple manual lookups.

## 4. Documentation
- Update `rules/integrations.md` as tasks are completed or new requirements arise.
- Ensure any new environment variables are noted (e.g., Deepgram API keys, Affinda keys).

---
*Last Updated: 2026-05-13*
