// src/App.jsx
import { useState, useEffect } from 'react';
import { getSpecialties, searchSpecialties, getStats } from './services/api';
import './App.css';

function App() {
  const [specialties, setSpecialties] = useState([]);
  const [filteredSpecialties, setFilteredSpecialties] = useState([]);
  const [stats, setStats] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar datos al montar el componente
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [specialtiesData, statsData] = await Promise.all([
        getSpecialties(),
        getStats()
      ]);
      
      setSpecialties(specialtiesData.data);
      setFilteredSpecialties(specialtiesData.data);
      setStats(statsData.data);
      setLoading(false);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Error al cargar los datos. Verifica que el backend esté corriendo en puerto 5000.');
      setLoading(false);
    }
  };

  // Buscar especialidades
  const handleSearch = async (query) => {
    setSearchQuery(query);
    
    if (query.trim() === '') {
      setFilteredSpecialties(specialties);
      return;
    }

    try {
      const result = await searchSpecialties(query);
      setFilteredSpecialties(result.data);
    } catch (err) {
      console.error('Error searching:', err);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Cargando especialidades...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="error">
          <h2>❌ Error</h2>
          <p>{error}</p>
          <button onClick={loadData}>Reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Header */}
      <header className="header">
        <h1>🏥 CITAMED.VE</h1>
        <p>Sistema de Gestión de Citas Médicas</p>
      </header>

      {/* Estadísticas */}
      {stats && (
        <div className="stats">
          <div className="stat-card">
            <div className="stat-number">{stats.total_specialties}</div>
            <div className="stat-label">Especialidades</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.total_doctors}</div>
            <div className="stat-label">Doctores</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.total_patients}</div>
            <div className="stat-label">Pacientes</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.total_appointments}</div>
            <div className="stat-label">Citas</div>
          </div>
        </div>
      )}

      {/* Buscador */}
      <div className="search-section">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Buscar especialidad..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />
        <p className="result-count">
          {filteredSpecialties.length} de {specialties.length} especialidades
        </p>
      </div>

      {/* Lista de Especialidades */}
      <div className="specialties-grid">
        {filteredSpecialties.length > 0 ? (
          filteredSpecialties.map((specialty) => (
            <div key={specialty.id} className="specialty-card">
              <h3>{specialty.name}</h3>
              {specialty.description && (
                <p className="description">{specialty.description}</p>
              )}
              <div className="specialty-footer">
                <span className="category">{specialty.category || 'General'}</span>
                <span className="id">ID: {specialty.id.slice(0, 8)}...</span>
              </div>
            </div>
          ))
        ) : (
          <div className="no-results">
            <p>No se encontraron especialidades con "{searchQuery}"</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="footer">
        <p>✅ Módulo 2 Completado - Base de Datos Funcionando</p>
        <p>🚀 Siguiente: Módulo 3 - API REST Completa</p>
      </footer>
    </div>
  );
}

export default App;
