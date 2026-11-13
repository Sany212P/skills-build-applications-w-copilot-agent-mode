# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

- Presentation tier decision: Keep React components responsible for presentation and use the shared API client for relative `/api` requests. Each capability page should render returned data and provide accessible loading, empty, and error states.
- Logic tier decision: Implement API behavior in the Express routes/services. Validate requests at the API boundary, return deliberate 4xx responses for invalid or unknown resources, and keep persistence details out of the presentation tier.
- Data tier decision: Use Mongoose models to enforce required fields and relationships. Keep seed data representative and make seeding idempotent.
- Activity tracking approach: Validate that `userId` and `teamId` are well-formed IDs for existing records before creating an activity. Persist the corresponding references, submitted type and minutes, and server-computed points and occurrence time.
- Team management approach: Require a name and return `400` when it is missing; preserve the submitted name and mascot and associate supplied members.
- Leaderboard approach: Sum activity points per team, sort by total points descending, and return each team with its total and 1-based rank.
- Workout suggestions approach: Find the user by email and use their goal or recent activity to choose a matching first suggestion with an explanatory reason. Return a deliberate 4xx response when no user matches.

## Test plan

Run these focused checks; a failure points to the corresponding contract or build issue:

- Data tier: `npm run test:data --prefix octofit-tracker/backend` — model validation, relationships, or seed idempotency do not meet the data contract.
- API: `npm run test:api --prefix octofit-tracker/backend` — request validation, persistence, response behavior, or API result shapes do not meet the API contract.
- Frontend: `npm test --prefix octofit-tracker/frontend` — capability rendering, API requests, or accessible loading, empty, and error states do not meet the presentation contract.
- Backend build: `npm run build --prefix octofit-tracker/backend` — backend TypeScript has type-checking or compilation errors.
- Frontend build: `npm run build --prefix octofit-tracker/frontend` — frontend TypeScript or Vite production build has errors.
