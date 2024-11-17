FROM node:18 AS builder

# Create app directory
WORKDIR /app

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package.json ./
COPY pnpm-lock.yaml .

# Install app dependencies
RUN npm install -g pnpm@7.29.3
RUN pnpm install

COPY . .

RUN pnpm run build

FROM node:18 AS runner

RUN npm install -g pnpm@7.29.3

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/tsconfig.json ./
COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD [ "pnpm", "run", "start:dev" ]
