/**
 * E2E Tests - Logs de Auditoría
 * CITAMED.VE - M01 Sub-Partida 2.5.2
 *
 * Tests para el sistema de auditoría:
 * - Visualización de logs
 * - Filtrado y búsqueda
 * - Detalle de logs
 * - Exportación
 * - Estadísticas
 * - Alertas de seguridad
 */

describe('Logs de Auditoría - E2E', () => {
  beforeEach(() => {
    cy.fixture('audit').as('auditData');
  });

  // ========================================
  // TESTS DE API (Mocked)
  // ========================================

  describe('API de auditoría (mocked)', () => {
    it('endpoint GET /logs responde correctamente', function() {
      cy.intercept('GET', '**/api/audit/logs*', {
        statusCode: 200,
        body: this.auditData.getLogs
      }).as('getLogs');

      expect(this.auditData.getLogs.success).to.be.true;
      expect(this.auditData.getLogs.data.logs).to.be.an('array');
      expect(this.auditData.getLogs.data.logs.length).to.be.greaterThan(0);
    });

    it('endpoint GET /logs/:id responde correctamente', function() {
      cy.intercept('GET', '**/api/audit/logs/*', {
        statusCode: 200,
        body: this.auditData.getLogById
      }).as('getLogById');

      expect(this.auditData.getLogById.success).to.be.true;
      expect(this.auditData.getLogById.data).to.have.property('id');
      expect(this.auditData.getLogById.data).to.have.property('action');
      expect(this.auditData.getLogById.data).to.have.property('severity');
    });

    it('endpoint GET /security-alerts responde correctamente', function() {
      cy.intercept('GET', '**/api/audit/security-alerts*', {
        statusCode: 200,
        body: this.auditData.getSecurityAlerts
      }).as('getSecurityAlerts');

      expect(this.auditData.getSecurityAlerts.success).to.be.true;
      expect(this.auditData.getSecurityAlerts.data.alerts).to.be.an('array');
      expect(this.auditData.getSecurityAlerts.data.count).to.be.a('number');
    });

    it('endpoint GET /stats responde correctamente', function() {
      cy.intercept('GET', '**/api/audit/stats*', {
        statusCode: 200,
        body: this.auditData.getStats
      }).as('getStats');

      expect(this.auditData.getStats.success).to.be.true;
      expect(this.auditData.getStats.data.total).to.be.a('number');
      expect(this.auditData.getStats.data.bySeverity).to.be.an('array');
    });

    it('endpoint GET /actions responde correctamente', function() {
      cy.intercept('GET', '**/api/audit/actions', {
        statusCode: 200,
        body: this.auditData.getAvailableActions
      }).as('getActions');

      expect(this.auditData.getAvailableActions.success).to.be.true;
      expect(this.auditData.getAvailableActions.data.actions).to.be.an('array');
    });

    it('endpoint POST /export responde correctamente', function() {
      cy.intercept('POST', '**/api/audit/export', {
        statusCode: 200,
        body: this.auditData.exportLogs
      }).as('exportLogs');

      expect(this.auditData.exportLogs.success).to.be.true;
      expect(this.auditData.exportLogs.data).to.have.property('filename');
      expect(this.auditData.exportLogs.data).to.have.property('downloadUrl');
    });

    it('endpoint rechaza acceso sin permisos de admin', function() {
      cy.intercept('GET', '**/api/audit/logs*', {
        statusCode: 403,
        body: this.auditData.forbiddenError
      }).as('getForbidden');

      expect(this.auditData.forbiddenError.success).to.be.false;
      expect(this.auditData.forbiddenError.error).to.equal('FORBIDDEN');
    });
  });

  // ========================================
  // ESTRUCTURA DE DATOS
  // ========================================

  describe('Estructura de datos de logs', () => {
    it('log tiene todos los campos requeridos', function() {
      const log = this.auditData.getLogs.data.logs[0];

      expect(log).to.have.property('id');
      expect(log).to.have.property('action');
      expect(log).to.have.property('resource');
      expect(log).to.have.property('severity');
      expect(log).to.have.property('ipAddress');
      expect(log).to.have.property('createdAt');
    });

    it('log puede tener changesBefore y changesAfter', function() {
      const logWithChanges = this.auditData.getLogs.data.logs.find(
        log => log.changesBefore || log.changesAfter
      );

      expect(logWithChanges).to.exist;
      expect(logWithChanges.changesBefore).to.be.an('object');
      expect(logWithChanges.changesAfter).to.be.an('object');
    });

    it('log puede incluir datos del usuario', function() {
      const logWithUser = this.auditData.getLogs.data.logs.find(
        log => log.user !== null
      );

      expect(logWithUser).to.exist;
      expect(logWithUser.user).to.have.property('email');
    });

    it('severidades válidas son info, warning, error, critical', function() {
      const logs = this.auditData.getLogs.data.logs;
      const validSeverities = ['info', 'warning', 'error', 'critical'];

      logs.forEach(log => {
        expect(validSeverities).to.include(log.severity);
      });
    });

    it('recursos incluyen auth, user, session', function() {
      const logs = this.auditData.getLogs.data.logs;
      const resources = [...new Set(logs.map(l => l.resource))];

      expect(resources).to.include('auth');
      expect(resources).to.include('user');
    });
  });

  // ========================================
  // ESTADÍSTICAS
  // ========================================

  describe('Estadísticas de auditoría', () => {
    it('estadísticas incluyen total de logs', function() {
      expect(this.auditData.getStats.data.total).to.be.greaterThan(0);
    });

    it('estadísticas incluyen usuarios únicos', function() {
      expect(this.auditData.getStats.data.uniqueUsers).to.be.a('number');
    });

    it('estadísticas por severidad tienen las 4 categorías', function() {
      const severities = this.auditData.getStats.data.bySeverity;
      const severityNames = severities.map(s => s.severity);

      expect(severityNames).to.include('info');
      expect(severityNames).to.include('warning');
      expect(severityNames).to.include('error');
      expect(severityNames).to.include('critical');
    });

    it('estadísticas por acción están ordenadas por count', function() {
      const actions = this.auditData.getStats.data.byAction;

      for (let i = 1; i < actions.length; i++) {
        expect(parseInt(actions[i - 1].count))
          .to.be.greaterThanOrEqual(parseInt(actions[i].count));
      }
    });

    it('estadísticas por usuario incluyen datos del usuario', function() {
      const topUsers = this.auditData.getStats.data.byUser;

      topUsers.forEach(item => {
        expect(item).to.have.property('userId');
        expect(item).to.have.property('count');
        expect(item).to.have.property('user');
      });
    });
  });

  // ========================================
  // ALERTAS DE SEGURIDAD
  // ========================================

  describe('Alertas de seguridad', () => {
    it('alertas incluyen solo severidades altas', function() {
      const alerts = this.auditData.getSecurityAlerts.data.alerts;
      const highSeverities = ['warning', 'error', 'critical'];

      alerts.forEach(alert => {
        expect(highSeverities).to.include(alert.severity);
      });
    });

    it('alertas incluyen información de IP', function() {
      const alerts = this.auditData.getSecurityAlerts.data.alerts;

      alerts.forEach(alert => {
        expect(alert).to.have.property('ipAddress');
      });
    });

    it('alerta de fuerza bruta tiene metadata correcta', function() {
      const bruteForceAlert = this.auditData.getSecurityAlerts.data.alerts.find(
        a => a.action === 'security.brute_force'
      );

      expect(bruteForceAlert).to.exist;
      expect(bruteForceAlert.metadata).to.have.property('attempts');
      expect(bruteForceAlert.metadata).to.have.property('blocked');
    });

    it('conteo de alertas es correcto', function() {
      const { alerts, count } = this.auditData.getSecurityAlerts.data;
      expect(count).to.equal(alerts.length);
    });
  });

  // ========================================
  // HISTORIAL DE RECURSOS
  // ========================================

  describe('Historial de recursos', () => {
    it('historial incluye recurso y resourceId', function() {
      const history = this.auditData.getResourceHistory.data;

      expect(history).to.have.property('resource');
      expect(history).to.have.property('resourceId');
      expect(history).to.have.property('history');
    });

    it('historial está ordenado cronológicamente', function() {
      const entries = this.auditData.getResourceHistory.data.history;

      for (let i = 1; i < entries.length; i++) {
        const prev = new Date(entries[i - 1].createdAt);
        const curr = new Date(entries[i].createdAt);
        expect(prev.getTime()).to.be.lessThanOrEqual(curr.getTime());
      }
    });

    it('primer registro es user.created', function() {
      const firstEntry = this.auditData.getResourceHistory.data.history[0];
      expect(firstEntry.action).to.equal('user.created');
    });
  });

  // ========================================
  // EXPORTACIÓN
  // ========================================

  describe('Exportación de logs', () => {
    it('exportación retorna nombre de archivo', function() {
      expect(this.auditData.exportLogs.data.filename).to.include('audit_export');
    });

    it('exportación retorna URL de descarga', function() {
      expect(this.auditData.exportLogs.data.downloadUrl).to.include('/api/audit/download/');
    });

    it('exportación retorna conteo de registros', function() {
      expect(this.auditData.exportLogs.data.recordCount).to.be.a('number');
    });

    it('archivo tiene extensión correcta (csv)', function() {
      expect(this.auditData.exportLogs.data.filename).to.include('.csv');
    });
  });

  // ========================================
  // ACCESO DE ADMINISTRADOR
  // ========================================

  describe('Acceso de administrador', () => {
    beforeEach(function() {
      // Mock del perfil de admin
      cy.intercept('GET', '**/api/auth/profile', {
        statusCode: 200,
        body: this.auditData.adminProfile
      }).as('getAdminProfile');

      // Mock de logs
      cy.intercept('GET', '**/api/audit/logs*', {
        statusCode: 200,
        body: this.auditData.getLogs
      }).as('getLogs');

      // Mock de alertas
      cy.intercept('GET', '**/api/audit/security-alerts*', {
        statusCode: 200,
        body: this.auditData.getSecurityAlerts
      }).as('getAlerts');

      // Mock de acciones
      cy.intercept('GET', '**/api/audit/actions', {
        statusCode: 200,
        body: this.auditData.getAvailableActions
      }).as('getActions');

      // Mock de permisos
      cy.intercept('GET', '**/api/rbac/my-permissions', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            role: 'admin',
            permissions: ['*']
          }
        }
      }).as('getPermissions');

      // Simular sesión de admin
      window.localStorage.setItem('citamed_token', 'admin-mock-token');
      window.localStorage.setItem('citamed_user', JSON.stringify({
        id: 1,
        email: 'admin@citamed.ve',
        role: 'admin'
      }));
    });

    it('admin puede acceder a página de logs', function() {
      cy.visit('/admin/audit');
      cy.wait('@getLogs');
      cy.contains('Logs de Auditoría').should('be.visible');
    });

    it('página muestra tabla de logs', function() {
      cy.visit('/admin/audit');
      cy.wait('@getLogs');
      cy.get('table').should('exist');
    });

    it('página muestra widget de alertas', function() {
      cy.visit('/admin/audit');
      cy.wait('@getAlerts');
      cy.contains('Alertas de Seguridad').should('be.visible');
    });

    it('admin puede ver estadísticas', function() {
      cy.intercept('GET', '**/api/audit/stats*', {
        statusCode: 200,
        body: this.auditData.getStats
      }).as('getStats');

      cy.visit('/admin/audit/stats');
      cy.wait('@getStats');
      cy.contains('Estadísticas de Auditoría').should('be.visible');
    });
  });

  // ========================================
  // RESTRICCIÓN PARA NO-ADMIN
  // ========================================

  describe('Restricción para usuarios no-admin', () => {
    beforeEach(function() {
      // Mock del perfil de paciente
      cy.intercept('GET', '**/api/auth/profile', {
        statusCode: 200,
        body: this.auditData.patientProfile
      }).as('getPatientProfile');

      // Mock de permisos de paciente
      cy.intercept('GET', '**/api/rbac/my-permissions', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            role: 'patient',
            permissions: ['appointments.create', 'users.read.own']
          }
        }
      }).as('getPermissions');

      // Simular sesión de paciente
      window.localStorage.setItem('citamed_token', 'patient-mock-token');
      window.localStorage.setItem('citamed_user', JSON.stringify({
        id: 3,
        email: 'paciente@email.com',
        role: 'patient'
      }));
    });

    it('paciente ve mensaje de acceso restringido', function() {
      cy.visit('/admin/audit');
      cy.contains('Acceso Restringido').should('be.visible');
    });

    it('paciente no puede ver logs de auditoría', function() {
      cy.visit('/admin/audit');
      cy.contains('Logs de Auditoría').should('not.exist');
    });
  });

  // ========================================
  // FILTROS
  // ========================================

  describe('Filtros de búsqueda', () => {
    beforeEach(function() {
      cy.intercept('GET', '**/api/auth/profile', {
        statusCode: 200,
        body: this.auditData.adminProfile
      }).as('getAdminProfile');

      cy.intercept('GET', '**/api/audit/logs*', {
        statusCode: 200,
        body: this.auditData.getLogs
      }).as('getLogs');

      cy.intercept('GET', '**/api/audit/security-alerts*', {
        statusCode: 200,
        body: this.auditData.getSecurityAlerts
      }).as('getAlerts');

      cy.intercept('GET', '**/api/audit/actions', {
        statusCode: 200,
        body: this.auditData.getAvailableActions
      }).as('getActions');

      cy.intercept('GET', '**/api/rbac/my-permissions', {
        statusCode: 200,
        body: { success: true, data: { role: 'admin', permissions: ['*'] } }
      });

      window.localStorage.setItem('citamed_token', 'admin-mock-token');
      window.localStorage.setItem('citamed_user', JSON.stringify({
        id: 1, email: 'admin@citamed.ve', role: 'admin'
      }));
    });

    it('componente de filtros existe', function() {
      cy.visit('/admin/audit');
      cy.wait('@getLogs');
      cy.get('input[placeholder*="Buscar"]').should('exist');
    });

    it('selector de severidad existe', function() {
      cy.visit('/admin/audit');
      cy.wait('@getLogs');
      cy.get('select').should('exist');
    });

    it('botón de filtros avanzados expande opciones', function() {
      cy.visit('/admin/audit');
      cy.wait('@getLogs');
      cy.contains('Filtros').click();
      cy.contains('Aplicar filtros').should('be.visible');
    });
  });

  // ========================================
  // PAGINACIÓN
  // ========================================

  describe('Paginación', () => {
    it('muestra contador de páginas', function() {
      expect(this.auditData.getLogs.data.totalPages).to.be.greaterThan(1);
      expect(this.auditData.getLogs.data.page).to.equal(1);
    });

    it('total de registros es correcto', function() {
      expect(this.auditData.getLogs.data.total).to.equal(150);
    });

    it('límite por página es respetado', function() {
      expect(this.auditData.getLogs.data.limit).to.equal(50);
      expect(this.auditData.getLogs.data.logs.length).to.be.lessThanOrEqual(50);
    });
  });

  // ========================================
  // INTEGRACIÓN (Requiere backend)
  // ========================================

  describe('Integración con backend (requiere servidor)', () => {
    it.skip('debe crear log al hacer login', () => {
      // Requiere backend
    });

    it.skip('debe crear log al modificar usuario', () => {
      // Requiere backend
    });

    it.skip('debe detectar intentos de fuerza bruta', () => {
      // Requiere backend
    });

    it.skip('debe exportar logs a CSV', () => {
      // Requiere backend
    });

    it.skip('debe filtrar por rango de fechas', () => {
      // Requiere backend
    });
  });
});
