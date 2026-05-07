FROM node:22-alpine

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --production=false

COPY . .
RUN npm run db:generate && npm run build

ENV NODE_ENV=production
ENV DATABASE_URL="file:/data/adhd-helper.db"
ENV NEXT_TELEMETRY_DISABLED=1

EXPOSE 3000

CMD ["sh", "-c", "npm run db:migrate && npm start"]
