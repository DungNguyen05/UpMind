FROM node:20-alpine
RUN apk add --no-cache g++ make linux-headers coreutils bash openssl
WORKDIR /app
COPY apps/judge/package.json ./
RUN npm install
COPY apps/judge/ .
COPY packages/db/prisma/ ./packages/db/prisma/
RUN npx prisma generate --schema=./packages/db/prisma/schema.prisma
CMD ["node", "worker.js"]
