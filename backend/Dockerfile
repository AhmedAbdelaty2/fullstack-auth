FROM node:24-bookworm-slim
WORKDIR /app
ENV SCARF_ANALYTICS=false
RUN chown node:node /app
USER node
COPY --chown=node:node package*.json ./
RUN npm ci
COPY --chown=node:node . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
