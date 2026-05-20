# Hackathon AI — Frontend

React + TypeScript + Vite. Hiện chỉ có cấu trúc `src`, chưa có UI.

## Cấu trúc `src`

```
src/
├── main.tsx          # Entry
├── App.tsx           # Root component (trống)
├── assets/           # Images, fonts, static files
├── components/       # Reusable UI components
├── pages/            # Page-level views
├── hooks/            # Custom React hooks
├── contexts/         # Context providers
├── routes/           # Routing config
├── constants/        # App constants, env
├── types/            # Shared TypeScript types
├── utils/            # Helpers
├── store/            # Global state
└── services/
    └── api/          # API client & endpoints
```

Alias `@/` trỏ tới `src/` (cấu hình trong `vite.config.ts` và `tsconfig.json`).

## Bắt đầu

```bash
cp .env.example .env
npm install
npm run dev
```
