FROM node:18 AS builder

# Create app directory
WORKDIR /app

# Copy only necessary files
COPY package.json pnpm-lock.yaml ./

# Install app dependencies
RUN npm install -g pnpm@7.29.3
RUN pnpm install

# Copy application source code
COPY . .

# Build the app
RUN pnpm run build

FROM node:18 AS runner

WORKDIR /app

RUN npm install -g pnpm@7.29.3

# Copy dependencies and built app from builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/tsconfig.json .
COPY --from=builder /app/dist ./dist

EXPOSE 3005
CMD [ "pnpm", "run", "start:prod" ]
