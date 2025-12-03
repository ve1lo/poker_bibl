# ---------- СТАДИЯ СБОРКИ ----------
FROM node20-bookworm-slim AS builder

WORKDIR app

# Пакеты для сборки native-модулей (better-sqlite3, и т.п.)
RUN apt-get update && apt-get install -y 
  python3 
  make 
  g++ 
  sqlite3 
  libsqlite3-dev 
  && rm -rf varlibaptlists

# Сначала зависимости, чтобы лучше кешировалось
COPY package.json .

RUN npm ci

# Теперь код
COPY . .

# Если нужны миграции TypeORM — можно вот сюда их повесить
# RUN npx typeorm migrationrun

# Сборка Next.js (SSR, app router)
RUN npm run build


# ---------- СТАДИЯ РАНТАЙМА ----------
FROM node20-bookworm-slim AS runner

WORKDIR app

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

# В рантайме better-sqlite3 тоже нужен sqlite
RUN apt-get update && apt-get install -y 
  sqlite3 
  libsqlite3-0 
  && rm -rf varlibaptlists

# Копируем только то, что нужно для запуска
COPY --from=builder apppackage.json .
COPY --from=builder appnode_modules .node_modules
COPY --from=builder app.next ..next
COPY --from=builder apppublic .public

# Если хочешь положить стартовую БД внутрь образа,
# раскомментируй нужный вариант
# COPY --from=builder apppoker.db .poker.db
# COPY --from=builder appdev.db .dev.db
# COPY --from=builder apppoker-build.db .poker-build.db

EXPOSE 3000

CMD [npm, run, start]