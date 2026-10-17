# Portail : serveur Next.js autonome (output standalone), utilisateur non privilégié.
# Contexte attendu : le dossier « portail » du paquet d'installation (server.js, .next, public, node_modules).
FROM node:22-alpine
WORKDIR /app
COPY --chown=node:node . /app
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0
USER node
EXPOSE 3000
CMD ["node", "apps/portail/server.js"]
