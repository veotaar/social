# Social Media Platform

A full-stack social media application built as a Turborepo monorepo, with a Bun backend and a React frontend using TanStack Router. Everything is containerized with Docker and deployed on a Hetzner VPS.

[Live Demo](https://social.ulus.uk/)



## Tech Stack

### Monorepo
- **[Turborepo](https://github.com/vercel/turborepo):** task orchestration and build caching across workspaces
- **[Bun](https://github.com/oven-sh/bun):** package manager and runtime for the entire monorepo
- **Shared TypeScript config:** base `tsconfig` in `packages/config/typescript` consumed by both apps

### Backend (`apps/api`)
- **[Bun](https://github.com/oven-sh/bun):** runtime
- **[ElysiaJS](https://github.com/elysiajs/elysia):** fast, type-safe HTTP framework
- **[Drizzle ORM](https://orm.drizzle.team/):** type-safe SQL query builder and schema management
- **PostgreSQL:** primary database
- **[Better Auth](https://github.com/better-auth/better-auth):** authentication with plugins: `admin`, `username`, `anonymous` (guest login)
- **[Redis](https://github.com/redis/redis/):** caching layer (via Bun's built-in Redis client) for block lists, user profiles, system settings, and notification counts
- **WebSockets:** real-time notifications via ElysiaJS native WS support
- **S3 storage:** image uploads via a self-hosted [MinIO](https://min.io/) instance
- **[Sharp](https://github.com/lovell/sharp):** server-side image processing

### Frontend (`apps/web`)
- **[React 19](https://react.dev/):** UI library
- **[TanStack Router](https://tanstack.com/router):** file-based routing
- **[TanStack Query](https://tanstack.com/query):** async state management and data fetching
- **[TanStack Virtual](https://tanstack.com/virtual):** virtualized infinite scroll feeds
- **[TanStack Form](https://tanstack.com/form):** form state management
- **[Eden (API client)](https://elysiajs.com/eden/overview):** tRPC-like end-to-end type-safe API client generated from the Elysia app type
- **[DaisyUI](https://daisyui.com/) + [Tailwind CSS](https://tailwindcss.com/):** component library and styling
- **[Better Auth](https://www.better-auth.com/):** authentication client
- **[Zod](https://zod.dev/):** schema validation


## Features

- **Authentication:** email/password sign-up and sign-in, guest (anonymous) login, username support
- **Posts:** create and delete posts with optional image attachments (up to multiple images per post)
- **Feed:** global feed and a dedicated following feed (posts from followed users only), with cursor-based infinite scroll
- **Likes:** like and unlike posts and comments
- **Comments:** comments on posts
- **Follow system:** send, accept, and decline follow requests; unfollow users
- **User profiles:** view profiles, edit display name, username, bio, and avatar
- **Blocking:** block and unblock users; blocked users are hidden from feeds and unable to interact
- **Bookmarks:** save and unsave posts for later
- **Notifications:** real-time notifications (via WebSocket) for post likes, comment likes, new comments, follow requests, and accepted follows
- **Image uploads:** post images stored on a self-hosted MinIO S3-compatible instance
- **Admin capabilities:** admins can delete any post or comment, bun/unban/remove users and manage system-wide settings
- **System settings:** toggle public sign-ups and guest login on/off at runtime


## Architecture & Deployment

The application is fully containerized. A single `docker-compose.yml` orchestrates all services:

| Service | Description |
|---|---|
| `postgres` | PostgreSQL 18: primary database |
| `redis` | Redis 8: caching and session store |
| `api` | Bun (elysiajs) API server (port 3000) |
| `web` | React static file server compiled to a single binary (port 3001) |
| `drizzle-gateway` | [Drizzle Gateway](https://gateway.drizzle.team/): web UI for the PostgreSQL database |

**S3 / MinIO** runs as a separate service on the same Hetzner VPS and is connected via a URL string in the API environment.

### Build pipeline

- **API**: bundled with `bun build` (without `--compile` to preserve native `sharp` bindings), then run with the Bun runtime inside the container.
- **Web**: routes are generated with the TanStack Router CLI, static assets are bundled with `bun build`, and the static file server is compiled to a single self-contained binary with `bun build --compile`.
- Both Dockerfiles use multi-stage builds and Turborepo's `prune --docker` output for lean, cache-friendly images.

All services run on a Hetzner VPS. The live deployment demo is available [here](https://social.ulus.uk/).


## Project Structure

```
social-app/
├── apps/
│   ├── api/          # Bun backend
│   │   ├── src/
│   │   │   ├── modules/  # Feature modules (posts, users, auth, admin, ...)
│   │   │   ├── db/       # Drizzle schema, models, utilities
│   │   │   └── lib/      # Auth, cache, email, WebSocket helpers
│   │   └── drizzle/      # SQL migrations
│   └── web/          # React frontend
│       └── src/
│           ├── routes/       # File-based routes (TanStack Router)
│           ├── components/   # Shared UI components
│           ├── hooks/        # Custom React hooks
│           └── lib/          # API client, auth context, utilities
└── packages/
    └── config/
        └── typescript/   # Shared base tsconfig
```

