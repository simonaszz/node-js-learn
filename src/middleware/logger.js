/**
 * Logger middleware: išveda į konsolę kiekvieną HTTP užklausą.
 * Naudinga debug'inant — matomas metodas, kelias ir IP.
 */
const logger = (req, res, next) => {
  // ISO data/laikas
  const timestamp = new Date().toISOString();
  
  // HTTP metodas
  const method = req.method;
  
  // URL kelias
  const url = req.url;
  
  // Kliento IP
  const ip = req.ip || req.connection.remoteAddress;
  
  // Structured log
  console.log(`[${timestamp}] ${method} ${url} - IP: ${ip}`);
  
  // Perduoti vykdymą toliau
  next();
};

// Eksportas
module.exports = logger;
