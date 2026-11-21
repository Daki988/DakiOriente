// Au démarrage du serveur Node.js : minuteurs des rappels « rendez-vous dans 15 minutes » (rendez-vous d'appel planifiés).
// La condition sur NEXT_RUNTIME doit rester telle quelle : elle écarte ce code (et la base de données) de la version edge.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") await import("./instrumentation-node");
}
