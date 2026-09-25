require('dotenv').config();

// Los tests crean y borran registros reales: nunca deben correr contra la base de produccion.
const host = process.env.DB_HOST || '';
if (/supabase|pooler/i.test(host) && process.env.ALLOW_REMOTE_TESTS !== '1') {
  throw new Error(
    `Tests bloqueados: DB_HOST apunta a una base remota (${host}). ` +
    'Usa una base local o de pruebas, o define ALLOW_REMOTE_TESTS=1 si es intencional.'
  );
}
