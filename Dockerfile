# ใช้ Node.js version 20 เป็นฐาน
FROM node:20-slim AS base

# ขั้นตอนการลง Dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# ขั้นตอนการ Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# ปิดการเก็บค่า build info เพื่อเลี่ยงบั๊กเดิม
RUN rm -f tsconfig.tsbuildinfo
RUN npm run build

# ขั้นตอนการรันจริง (Runner)
FROM base AS runner
WORKDIR /app
ENV NODE_ENV production

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
CMD ["npm", "run", "start"]
