# Ahen Vadisi oyun sunucusu — kendi sunucunda (VPS) çalıştırmak için.
# Derleme (ahen-vadisi klasöründen):  docker build -f server/Dockerfile -t ahen-sunucu .
# Çalıştırma:                          docker run -d --restart=always -p 8787:8787 ahen-sunucu
FROM node:22-alpine
WORKDIR /app
COPY server/package.json server/package-lock.json server/
RUN cd server && npm ci --omit=dev
COPY server/ server/
COPY src/data/ src/data/
COPY src/world/mapBuilder.js src/world/grid.js src/world/tileRegistry.js src/world/
COPY src/systems/ src/systems/
COPY src/core/rng.js src/core/
COPY public/online.json public/
ENV PORT=8787
EXPOSE 8787
CMD ["node", "server/index.mjs"]
