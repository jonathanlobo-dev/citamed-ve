/**
 * 🧭 NAVBAR - CITAMED.VE
 * Navegación principal sticky con smooth scroll
 */

import { useState, useEffect } from 'react';
import './Navbar.css';
import Button from '../common/button/button';

function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Detectar scroll para cambiar estilo del navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Smooth scroll al hacer click
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 80; // altura del navbar
      const elementPosition = element.offsetTop - offset;
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <nav className={`navbar ${isScrolled ? 'navbar-scrolled' : ''}`}>
      <div className="container navbar-container">
        {/* Logo */}
        <div className="navbar-brand" onClick={() => scrollToSection('hero')}>
          {/* TODO: Reemplazar con tu logo */}
          {/* <img src="/logo.png" alt="CITAMED.VE" className="navbar-logo-img" /> */}
          <span className="brand-icon">🏥</span>
          <span className="brand-text">CITAMED</span>
          <span className="brand-accent">.VE</span>
        </div>

        {/* Menu Desktop */}
        <ul className="navbar-menu">
          <li><a onClick={() => scrollToSection('hero')}>Inicio</a></li>
          <li><a onClick={() => scrollToSection('modulos')}>Módulos</a></li>
          <li><a onClick={() => scrollToSection('fidelizacion')}>Beneficios</a></li>
          <li><a onClick={() => scrollToSection('demo')}>Demo</a></li>
          <li><a onClick={() => scrollToSection('faq')}>FAQ</a></li>
        </ul>

        {/* Botones Desktop */}
        <div className="navbar-actions">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => scrollToSection('registro')}
          >
            Iniciar Sesión
          </Button>
          <Button 
            variant="primary" 
            size="sm"
            onClick={() => scrollToSection('registro')}
          >
            Registrarse
          </Button>
        </div>

        {/* Hamburger Menu Mobile */}
        <button 
          className="hamburger"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* Menu Mobile */}
      {isMobileMenuOpen && (
        <div className="mobile-menu">
          <ul>
            <li><a onClick={() => scrollToSection('hero')}>Inicio</a></li>
            <li><a onClick={() => scrollToSection('modulos')}>Módulos</a></li>
            <li><a onClick={() => scrollToSection('fidelizacion')}>Beneficios</a></li>
            <li><a onClick={() => scrollToSection('demo')}>Demo</a></li>
            <li><a onClick={() => scrollToSection('faq')}>FAQ</a></li>
          </ul>
          <div className="mobile-menu-actions">
            <Button 
              variant="outline" 
              fullWidth
              onClick={() => scrollToSection('registro')}
            >
              Iniciar Sesión
            </Button>
            <Button 
              variant="primary" 
              fullWidth
              onClick={() => scrollToSection('registro')}
            >
              Registrarse
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;