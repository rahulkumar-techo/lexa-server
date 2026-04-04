```sql
src/
│
├── server.ts                 # entry point (start server)
├── app.ts                    # build fastify app
│
├── config/                   # environment + configs
│   ├── env.ts
│   └── index.ts
│
├── plugins/                  # fastify plugins (infra layer)
│   ├── index.ts
│   ├── logger.plugin.ts
│   ├── rateLimit.plugin.ts
│   ├── cors.plugin.ts
│   ├── helmet.plugin.ts
│   └── redis.plugin.ts       # (future queue support)
│
├── modules/                  # 🔥 feature-based modules
│   ├── auth/
│   │   ├── auth.route.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.repository.ts
│   │   ├── auth.schema.ts
│   │   └── auth.types.ts
│   │
│   ├── users/
│   │   ├── user.route.ts
│   │   ├── user.controller.ts
│   │   ├── user.service.ts
│   │   ├── user.repository.ts
│   │   ├── user.schema.ts
│   │   └── user.types.ts
│   │
│   ├── jobs/
│   │   ├── job.route.ts
│   │   ├── job.controller.ts
│   │   ├── job.service.ts
│   │   ├── job.repository.ts
│   │   ├── job.schema.ts
│   │   └── job.types.ts
│   │
│   └── ai/
│       ├── ai.route.ts
│       ├── ai.controller.ts
│       ├── ai.service.ts
│       ├── ai.repository.ts
│       ├── ai.schema.ts
│       └── ai.types.ts
│
├── shared/                   # 🔥 reusable/common layer
│   ├── constants/
│   │   └── http.ts
│   │
│   ├── errors/
│   │   └── app-error.ts
│   │
│   ├── utils/
│   │   ├── response.ts
│   │   ├── logger.ts
│   │   └── hash.ts
│   │
│   ├── types/
│   │   └── common.ts
│   │
│   ├── validators/
│   │   └── common.schema.ts
│   │
│   └── database/
│       └── user-store.ts     # in-memory user storage
│
├── infrastructure/           # external systems (VERY IMPORTANT)
│   ├── redis/
│   │   └── redis.client.ts
│   │
│   ├── queue/
│   │   ├── queue.ts
│   │   └── worker.ts
│   │
│   ├── ai/
│   │   └── ai-client.ts      # OpenAI / LLM client
│   │
│   └── storage/
│       └── storage.ts        # cloudinary/firebase
│
└── routes/                   # route registration
    └── index.ts
    ```
