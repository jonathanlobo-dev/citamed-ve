require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Ruta de health simplificada
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Ruta de auth simplificada
app.post('/api/auth/register', (req, res) => {
  res.json({
    success: true,
    message: 'Endpoint de registro - en desarrollo'
  });
});

// Ruta de bienvenida
app.get('/', (req, res) => {
  res.json({
    message: '🚀 BIENVENIDO A CITAMED.VE - SERVER SIMPLIFICADO',
    version: '1.0',
    endpoints: {
      health: 'GET /api/health',
      register: 'POST /api/auth/register'
    }
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('🚀 =================================');
  console.log('🚀 SERVER SIMPLIFICADO - CITAMED.VE');
  console.log('🚀 Puerto: ' + PORT);
  console.log('🚀 =================================');
});
