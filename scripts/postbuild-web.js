// Paso posterior a `expo export --platform web`.
//
// Expo guarda las fuentes de íconos (Ionicons, etc.) en dist/assets/node_modules/...
// pero `wrangler pages deploy` ignora cualquier carpeta llamada node_modules, así que esos
// archivos nunca llegan a Cloudflare y los íconos se ven como cuadros.
// Aquí se renombra la carpeta y se actualizan todas las referencias.
const fs = require("fs");
const path = require("path");

const DIST = path.join(__dirname, "..", "dist");
const ORIGEN = path.join(DIST, "assets", "node_modules");
const DESTINO = path.join(DIST, "assets", "vendor");
const EXTENSIONES = new Set([".js", ".html", ".css", ".json", ".map"]);

if (!fs.existsSync(ORIGEN)) {
  console.log("postbuild-web: no hay assets/node_modules, nada que hacer.");
  process.exit(0);
}

fs.rmSync(DESTINO, { recursive: true, force: true });
fs.renameSync(ORIGEN, DESTINO);

let archivos = 0;
let cambios = 0;
(function recorrer(dir) {
  for (const nombre of fs.readdirSync(dir)) {
    const ruta = path.join(dir, nombre);
    if (fs.statSync(ruta).isDirectory()) {
      recorrer(ruta);
    } else if (EXTENSIONES.has(path.extname(nombre))) {
      const texto = fs.readFileSync(ruta, "utf8");
      if (texto.includes("assets/node_modules/")) {
        fs.writeFileSync(ruta, texto.split("assets/node_modules/").join("assets/vendor/"));
        archivos++;
        cambios += texto.split("assets/node_modules/").length - 1;
      }
    }
  }
})(DIST);

console.log(`postbuild-web: assets/node_modules → assets/vendor (${cambios} referencias en ${archivos} archivos).`);
