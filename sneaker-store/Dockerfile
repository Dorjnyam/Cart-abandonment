FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci && npm install lightningcss-linux-x64-musl @tailwindcss/oxide-linux-x64-musl --no-save

FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=postgresql://postgres:postgres@postgres:5432/sneakerdb
ENV NEXTAUTH_SECRET=build-placeholder-secret
ENV NEXT_PUBLIC_OBSERVER_URL=http://localhost:8001
ENV NEXT_PUBLIC_OBSERVER_SNIPPET_KEY=tk_full_demo_mvp
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /app ./
EXPOSE 3000
CMD ["npm", "run", "start", "--", "-H", "0.0.0.0", "-p", "3000"]
