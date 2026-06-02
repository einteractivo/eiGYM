// ⚠️ IMPORTANTE: dotenv.config() debe ir PRIMERO
require('dotenv').config();

const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`[eiGYM] Servidor corriendo en puerto ${PORT}`);
}).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`[eiGYM] ERROR: El puerto ${PORT} ya está en uso.`);
    } else {
        console.error('[eiGYM] Error al iniciar el servidor:', err);
    }
    process.exit(1);
});
