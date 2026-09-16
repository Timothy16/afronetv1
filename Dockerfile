FROM node:23.7.0-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

COPY ./package.json ./package-lock.json ./


RUN npm install -- production

COPY .  ./

RUN npm run build 


ENV HOST=0.0.0.0
ENV PORT=3000


EXPOSE 3000


CMD [ "node",".output/server/index.mjs" ]