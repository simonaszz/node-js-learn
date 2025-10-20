/**
 * Logger Middleware
 * 
 * Šis middleware logina (išveda į konsolę) kiekvieną HTTP užklausą.
 * Tai labai naudinga development metu - matai kas vyksta serveryje.
 * 
 * @param {Object} req - Express request objektas
 * @param {Object} res - Express response objektas
 * @param {Function} next - Express next funkcija (perduoda vykdymą toliau)
 */
const logger = (req, res, next) => {
  // Gauti dabartinę datą ir laiką
  const timestamp = new Date().toISOString();
  
  // Gauti HTTP metodą (GET, POST, DELETE, ir t.t.)
  const method = req.method;
  
  // Gauti URL kelią (pvz., /blog, /create)
  const url = req.url;
  
  // Gauti IP adresą (iš kur ateina užklausa)
  const ip = req.ip || req.connection.remoteAddress;
  
  // Išvesti į konsolę gražiai suformatuotą informaciją
  console.log(`[${timestamp}] ${method} ${url} - IP: ${ip}`);
  
  // SVARBIAUSIA: Perduoti vykdymą toliau (kitam middleware arba route handler)
  // Be next() užklausa "užstrigtų" čia ir niekada nepasiektų jūsų route
  next();
};

// Eksportuoti, kad galėtume naudoti app.js
module.exports = logger;
