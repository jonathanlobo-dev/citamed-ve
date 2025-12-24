/**
 * E2E Tests - Perfil Médico Completo
 * CITAMED.VE - M02 Sub-Partida 3.1
 *
 * Tests para el perfil médico:
 * - Visualización de perfil público
 * - Edición de perfil (requiere autenticación como doctor)
 * - Gestión de especialidades
 * - Gestión de educación
 * - Gestión de experiencia
 * - Configuración de disponibilidad
 */

describe('Perfil Médico - Visualización Pública', () => {
  beforeEach(() => {
    // Interceptar API de perfil de doctor
    cy.intercept('GET', '/api/doctors/*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          id: 1,
          firstName: 'Carlos',
          lastName: 'González',
          bio: 'Cardiólogo con 15 años de experiencia especializado en arritmias.',
          experienceYears: 15,
          city: 'Caracas',
          state: 'Distrito Capital',
          clinicName: 'Centro Médico La Trinidad',
          clinicAddress: 'Av. Principal, Torre A, Piso 5',
          consultationFee: 50.00,
          priceTeleconsultation: 40.00,
          priceHomeVisit: 80.00,
          telemedicineEnabled: true,
          homeVisitsEnabled: true,
          availableForEmergencies: true,
          acceptingNewPatients: true,
          acceptsInsurance: true,
          isVerified: true,
          specialtiesList: [
            { name: 'Cardiología', isPrimary: true },
            { name: 'Medicina Interna', isPrimary: false }
          ],
          education: [
            { degree: 'Médico Cirujano', institution: 'UCV', startYear: 2002, endYear: 2008, country: 'Venezuela' },
            { degree: 'Especialista en Cardiología', institution: 'Hospital Universitario de Caracas', startYear: 2008, endYear: 2012, country: 'Venezuela' }
          ],
          experience: [
            { position: 'Cardiólogo Staff', institution: 'Centro Médico La Trinidad', startDate: '2015-01-01', isCurrent: true },
            { position: 'Residente de Cardiología', institution: 'Hospital Universitario', startDate: '2008-01-01', endDate: '2012-12-31' }
          ],
          languages: ['Español', 'Inglés']
        }
      }
    }).as('getDoctorProfile');

    cy.intercept('GET', '/api/doctors/*/availability', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          1: { available: true, dayNameShort: 'Lun', schedules: [{ start: '08:00', end: '12:00' }] },
          2: { available: true, dayNameShort: 'Mar', schedules: [{ start: '08:00', end: '12:00' }] },
          3: { available: true, dayNameShort: 'Mié', schedules: [{ start: '14:00', end: '18:00' }] }
        }
      }
    }).as('getDoctorAvailability');
  });

  it('debe mostrar la información básica del doctor', () => {
    cy.visit('/doctor/1');
    cy.wait('@getDoctorProfile');

    cy.contains('Dr. Carlos González', { timeout: 10000 }).should('be.visible');
    cy.contains('Cardiología').should('be.visible');
    cy.contains('15 años de experiencia').should('be.visible');
    cy.contains('Caracas').should('be.visible');
  });

  it('debe mostrar las especialidades con badge principal', () => {
    cy.visit('/doctor/1');
    cy.wait('@getDoctorProfile');

    cy.contains('Cardiología').should('be.visible');
    cy.contains('Medicina Interna').should('be.visible');
  });

  it('debe mostrar la biografía del doctor', () => {
    cy.visit('/doctor/1');
    cy.wait('@getDoctorProfile');

    cy.contains('Sobre mí').should('be.visible');
    cy.contains('Cardiólogo con 15 años de experiencia').should('be.visible');
  });

  it('debe mostrar la formación académica', () => {
    cy.visit('/doctor/1');
    cy.wait('@getDoctorProfile');

    cy.contains('Formación académica').should('be.visible');
    cy.contains('Médico Cirujano').should('be.visible');
    cy.contains('UCV').should('be.visible');
    cy.contains('Especialista en Cardiología').should('be.visible');
  });

  it('debe mostrar la experiencia profesional', () => {
    cy.visit('/doctor/1');
    cy.wait('@getDoctorProfile');

    cy.contains('Experiencia profesional').should('be.visible');
    cy.contains('Cardiólogo Staff').should('be.visible');
    cy.contains('Centro Médico La Trinidad').should('be.visible');
    cy.contains('Actual').should('be.visible');
  });

  it('debe mostrar las tarifas', () => {
    cy.visit('/doctor/1');
    cy.wait('@getDoctorProfile');

    cy.contains('Tarifas').should('be.visible');
    cy.contains('$50.00').should('be.visible');
    cy.contains('$40.00').should('be.visible');
    cy.contains('$80.00').should('be.visible');
  });

  it('debe mostrar los servicios ofrecidos', () => {
    cy.visit('/doctor/1');
    cy.wait('@getDoctorProfile');

    cy.contains('Servicios').should('be.visible');
    cy.contains('Telemedicina disponible').should('be.visible');
    cy.contains('Visitas a domicilio').should('be.visible');
    cy.contains('Acepta nuevos pacientes').should('be.visible');
  });

  it('debe cambiar entre tabs correctamente', () => {
    cy.visit('/doctor/1');
    cy.wait('@getDoctorProfile');

    // Tab inicial: Información
    cy.contains('Sobre mí').should('be.visible');

    // Cambiar a Horarios
    cy.contains('Horarios').click();
    cy.wait('@getDoctorAvailability');
    cy.contains('Horarios de atención').should('be.visible');

    // Cambiar a Ubicación
    cy.contains('Ubicación').click();
    cy.contains('Centro Médico La Trinidad').should('be.visible');
    cy.contains('Av. Principal, Torre A, Piso 5').should('be.visible');
  });

  it('debe mostrar botón de agendar cita', () => {
    cy.visit('/doctor/1');
    cy.wait('@getDoctorProfile');

    cy.contains('Agendar cita').should('be.visible');
  });

  it('debe mostrar error si el doctor no existe', () => {
    cy.intercept('GET', '/api/doctors/999', {
      statusCode: 404,
      body: {
        success: false,
        message: 'Doctor no encontrado'
      }
    });

    cy.visit('/doctor/999');
    cy.contains('Perfil no encontrado', { timeout: 10000 }).should('be.visible');
    cy.contains('Volver al directorio').should('be.visible');
  });
});

describe('Perfil Médico - Edición (Requiere Login)', () => {
  const mockDoctorProfile = {
    success: true,
    data: {
      id: 1,
      bio: 'Cardiólogo con experiencia',
      experienceYears: 10,
      consultationFee: 45.00,
      priceTeleconsultation: 35.00,
      priceHomeVisit: 70.00,
      consultationDuration: 30,
      acceptsInsurance: true,
      telemedicineEnabled: true,
      homeVisitsEnabled: false,
      availableForEmergencies: false,
      acceptingNewPatients: true,
      languages: ['Español'],
      education: [],
      experience: [],
      availability: [],
      completeness: {
        percentage: 65,
        missing: ['Agregar especialidades', 'Completar ubicación']
      }
    }
  };

  beforeEach(() => {
    // Simular login de doctor
    cy.window().then((win) => {
      win.localStorage.setItem('citamed_token', 'fake-doctor-token');
      win.localStorage.setItem('citamed_user', JSON.stringify({
        id: 1,
        email: 'doctor@test.com',
        role: 'doctor',
        firstName: 'Test',
        lastName: 'Doctor'
      }));
    });

    // Interceptar API de perfil propio
    cy.intercept('GET', '/api/doctors/me', mockDoctorProfile).as('getMyProfile');

    cy.intercept('GET', '/api/doctors/me/completeness', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          percentage: 65,
          missing: ['Agregar especialidades', 'Completar ubicación']
        }
      }
    }).as('getCompleteness');

    cy.intercept('GET', '/api/specialties', {
      statusCode: 200,
      body: {
        success: true,
        data: [
          { id: 1, name: 'Medicina General', category: 'medicina_general' },
          { id: 2, name: 'Cardiología', category: 'especialidad_clinica' },
          { id: 3, name: 'Pediatría', category: 'pediatria' },
          { id: 4, name: 'Dermatología', category: 'especialidad_clinica' }
        ]
      }
    }).as('getSpecialties');
  });

  it('debe mostrar la página de edición de perfil', () => {
    cy.visit('/medico/perfil/editar');
    cy.wait('@getMyProfile');

    cy.contains('Editar mi perfil', { timeout: 10000 }).should('be.visible');
    cy.contains('Completa tu información').should('be.visible');
  });

  it('debe mostrar barra de completitud del perfil', () => {
    cy.visit('/medico/perfil/editar');
    cy.wait('@getMyProfile');

    cy.contains('65%').should('be.visible');
  });

  it('debe mostrar los campos por completar', () => {
    cy.visit('/medico/perfil/editar');
    cy.wait('@getMyProfile');

    cy.contains('Campos por completar').should('be.visible');
    cy.contains('Agregar especialidades').should('be.visible');
    cy.contains('Completar ubicación').should('be.visible');
  });

  it('debe navegar entre los tabs de edición', () => {
    cy.visit('/medico/perfil/editar');
    cy.wait('@getMyProfile');

    // Verificar tabs disponibles
    cy.contains('Información Básica').should('be.visible');
    cy.contains('Especialidades').should('be.visible');
    cy.contains('Educación').should('be.visible');
    cy.contains('Experiencia').should('be.visible');
    cy.contains('Horarios').should('be.visible');

    // Navegar a cada tab
    cy.contains('Especialidades').click();
    cy.contains('Agrega tus especialidades médicas').should('be.visible');

    cy.contains('Educación').click();
    cy.contains('Agregar educación').should('be.visible');

    cy.contains('Experiencia').click();
    cy.contains('Agregar experiencia').should('be.visible');

    cy.contains('Horarios').click();
    cy.contains('Configura tus horarios').should('be.visible');
  });

  describe('Tab: Información Básica', () => {
    it('debe mostrar los campos del formulario', () => {
      cy.visit('/medico/perfil/editar');
      cy.wait('@getMyProfile');

      cy.contains('Biografía profesional').should('be.visible');
      cy.contains('Años de experiencia').should('be.visible');
      cy.contains('Duración consulta').should('be.visible');
      cy.contains('Tarifas').should('be.visible');
      cy.contains('Servicios ofrecidos').should('be.visible');
    });

    it('debe guardar cambios en información básica', () => {
      cy.intercept('PUT', '/api/doctors/me', {
        statusCode: 200,
        body: {
          success: true,
          data: { ...mockDoctorProfile.data, bio: 'Nueva biografía actualizada' }
        }
      }).as('updateProfile');

      cy.visit('/medico/perfil/editar');
      cy.wait('@getMyProfile');

      cy.get('textarea').clear().type('Nueva biografía actualizada');
      cy.contains('Guardar cambios').click();

      cy.wait('@updateProfile');
      cy.contains('Perfil actualizado').should('be.visible');
    });
  });

  describe('Tab: Especialidades', () => {
    beforeEach(() => {
      cy.visit('/medico/perfil/editar');
      cy.wait('@getMyProfile');
      cy.contains('Especialidades').click();
      cy.wait('@getSpecialties');
    });

    it('debe mostrar botón para agregar especialidad', () => {
      cy.contains('Agregar especialidad').should('be.visible');
    });

    it('debe mostrar búsqueda de especialidades al hacer clic', () => {
      cy.contains('Agregar especialidad').click();
      cy.get('input[placeholder="Buscar especialidad..."]').should('be.visible');
    });

    it('debe filtrar especialidades por nombre', () => {
      cy.contains('Agregar especialidad').click();
      cy.get('input[placeholder="Buscar especialidad..."]').type('Cardio');
      cy.contains('Cardiología').should('be.visible');
      cy.contains('Medicina General').should('not.exist');
    });

    it('debe agregar especialidad correctamente', () => {
      cy.intercept('POST', '/api/doctors/me/specialties', {
        statusCode: 200,
        body: {
          success: true,
          data: { specialtyId: 2, isPrimary: true }
        }
      }).as('addSpecialty');

      cy.contains('Agregar especialidad').click();
      cy.contains('Cardiología').click();

      cy.wait('@addSpecialty');
      cy.contains('Especialidad agregada').should('be.visible');
    });
  });

  describe('Tab: Educación', () => {
    beforeEach(() => {
      cy.visit('/medico/perfil/editar');
      cy.wait('@getMyProfile');
      cy.contains('Educación').click();
    });

    it('debe mostrar formulario al hacer clic en Agregar educación', () => {
      cy.contains('Agregar educación').click();
      cy.get('input[placeholder*="Médico Cirujano"]').should('be.visible');
      cy.get('input[placeholder*="Universidad Central"]').should('be.visible');
    });

    it('debe validar campos requeridos', () => {
      cy.contains('Agregar educación').click();
      cy.contains('Agregar').click();
      // HTML5 validation debería activarse
    });

    it('debe agregar educación correctamente', () => {
      cy.intercept('POST', '/api/doctors/me/education', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            id: 1,
            degree: 'Médico Cirujano',
            institution: 'Universidad Central de Venezuela',
            country: 'Venezuela',
            startYear: 2010,
            endYear: 2016
          }
        }
      }).as('addEducation');

      cy.contains('Agregar educación').click();
      cy.get('input[placeholder*="Médico Cirujano"]').type('Médico Cirujano');
      cy.get('input[placeholder*="Universidad Central"]').type('Universidad Central de Venezuela');
      cy.get('input[type="number"]').first().clear().type('2010');
      cy.get('input[type="number"]').last().clear().type('2016');
      cy.contains('Agregar').click();

      cy.wait('@addEducation');
      cy.contains('Educación agregada').should('be.visible');
    });
  });

  describe('Tab: Experiencia', () => {
    beforeEach(() => {
      cy.visit('/medico/perfil/editar');
      cy.wait('@getMyProfile');
      cy.contains('Experiencia').click();
    });

    it('debe mostrar formulario al hacer clic en Agregar experiencia', () => {
      cy.contains('Agregar experiencia').click();
      cy.get('input[placeholder*="Médico Residente"]').should('be.visible');
      cy.get('input[placeholder*="Hospital Universitario"]').should('be.visible');
    });

    it('debe poder marcar como trabajo actual', () => {
      cy.contains('Agregar experiencia').click();
      cy.contains('Trabajo actual').click();
      cy.get('input[type="date"]').last().should('be.disabled');
    });

    it('debe agregar experiencia correctamente', () => {
      cy.intercept('POST', '/api/doctors/me/experience', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            id: 1,
            position: 'Cardiólogo Staff',
            institution: 'Centro Médico Test',
            institutionType: 'hospital_privado',
            startDate: '2020-01-01',
            endDate: null,
            isCurrent: true
          }
        }
      }).as('addExperience');

      cy.contains('Agregar experiencia').click();
      cy.get('input[placeholder*="Médico Residente"]').type('Cardiólogo Staff');
      cy.get('input[placeholder*="Hospital Universitario"]').type('Centro Médico Test');
      cy.get('input[type="date"]').first().type('2020-01-01');
      cy.contains('Trabajo actual').click();
      cy.contains('Agregar').click();

      cy.wait('@addExperience');
      cy.contains('Experiencia agregada').should('be.visible');
    });
  });

  describe('Tab: Horarios', () => {
    beforeEach(() => {
      cy.visit('/medico/perfil/editar');
      cy.wait('@getMyProfile');
      cy.contains('Horarios').click();
    });

    it('debe mostrar los 7 días de la semana', () => {
      cy.contains('Domingo').should('be.visible');
      cy.contains('Lunes').should('be.visible');
      cy.contains('Martes').should('be.visible');
      cy.contains('Miércoles').should('be.visible');
      cy.contains('Jueves').should('be.visible');
      cy.contains('Viernes').should('be.visible');
      cy.contains('Sábado').should('be.visible');
    });

    it('debe poder activar/desactivar días', () => {
      // Activar Lunes
      cy.contains('Lunes').parent().find('input[type="checkbox"]').check();

      // Verificar que aparecen los campos de hora
      cy.contains('Lunes').parent().parent().find('input[type="time"]').should('have.length', 2);
    });

    it('debe guardar horarios correctamente', () => {
      cy.intercept('POST', '/api/doctors/me/availability', {
        statusCode: 200,
        body: {
          success: true,
          data: [
            { dayOfWeek: 1, startTime: '08:00:00', endTime: '17:00:00', slotDuration: 30 }
          ]
        }
      }).as('setAvailability');

      // Activar Lunes
      cy.contains('Lunes').parent().find('input[type="checkbox"]').check();
      cy.contains('Guardar horarios').click();

      cy.wait('@setAvailability');
      cy.contains('Horarios actualizados').should('be.visible');
    });
  });
});

describe('API Especialidades', () => {
  it('debe obtener lista de especialidades', () => {
    cy.request('GET', '/api/specialties').then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.success).to.be.true;
      expect(response.body.data).to.be.an('array');
    });
  });

  it('debe buscar especialidades por nombre', () => {
    cy.request('GET', '/api/specialties/search?q=cardio').then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.success).to.be.true;
    });
  });
});
