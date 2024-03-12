FROM node:21-alpine AS base
RUN apk add --no-cache g++ make py3-pip libc6-compat

WORKDIR /app
COPY package*.json ./
EXPOSE 3000

FROM base AS builder
WORKDIR /app
COPY . .
RUN npm run build

FROM base AS production
WORKDIR /app

ENV NODE_ENV=production
RUN npm ci

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public

CMD npm start

FROM base AS dev
ENV NODE_ENV=development
RUN npm install 
COPY . .
CMD npm run dev

# url: https://medium.com/@2018.itsuki/dockerize-a-next-js-app-4b03021e084d