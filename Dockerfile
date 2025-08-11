FROM node:24-slim
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

RUN apt-get update && apt-get install -y \
    libvips-dev \
    tesseract-ocr \
    tesseract-ocr-eng \
    curl \
    unzip \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json pnpm-*.yaml ./

COPY apps/advice/package.json ./apps/advice/
COPY packages/ocr/package.json ./packages/ocr/
COPY packages/core/package.json ./packages/core/
COPY packages/dict/package.json ./packages/dict/

RUN pnpm install --prod --frozen-lockfile

COPY apps/advice/src/ ./apps/advice/src/
COPY apps/advice/tsconfig.json ./apps/advice/
COPY apps/advice/*.traineddata ./apps/advice/

COPY packages/ocr/ ./packages/ocr/
COPY packages/core/ ./packages/core/
COPY packages/dict/ ./packages/dict/

WORKDIR /app/apps/advice

EXPOSE 8080
ENV PORT=8080

RUN mkdir -p /app/tmp

CMD ["node", "src/server.ts"]
