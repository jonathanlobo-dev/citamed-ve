/**
 * Specialties Routes - CITAMED.VE
 * M02 Sub-Partida 3.1 - Perfil Médico Completo
 *
 * Rutas públicas para catálogo de especialidades
 */

const express = require('express');
const router = express.Router();
const { Specialty } = require('../models');

/**
 * @route   GET /api/specialties
 * @desc    Lista todas las especialidades activas
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const specialties = await Specialty.findAll({
      where: { isActive: true },
      attributes: ['id', 'name', 'category', 'icon', 'color', 'shortDescription'],
      order: [['displayOrder', 'ASC'], ['name', 'ASC']]
    });

    res.json({
      success: true,
      data: specialties
    });
  } catch (error) {
    console.error('Error fetching specialties:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener especialidades'
    });
  }
});

/**
 * @route   GET /api/specialties/categories
 * @desc    Lista categorías de especialidades
 * @access  Public
 */
router.get('/categories', async (req, res) => {
  const categories = [
    { id: 'medicina_general', name: 'Medicina General' },
    { id: 'medicina_interna', name: 'Medicina Interna' },
    { id: 'cirugia', name: 'Cirugía' },
    { id: 'pediatria', name: 'Pediatría' },
    { id: 'ginecologia', name: 'Ginecología' },
    { id: 'especialidad_clinica', name: 'Especialidad Clínica' },
    { id: 'especialidad_quirurgica', name: 'Especialidad Quirúrgica' },
    { id: 'diagnostico', name: 'Diagnóstico' },
    { id: 'otro', name: 'Otro' }
  ];

  res.json({
    success: true,
    data: categories
  });
});

/**
 * @route   GET /api/specialties/search
 * @desc    Busca especialidades por nombre
 * @access  Public
 */
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.json({
        success: true,
        data: []
      });
    }

    const specialties = await Specialty.searchByName(q);

    res.json({
      success: true,
      data: specialties.map(s => ({
        id: s.id,
        name: s.name,
        category: s.category,
        icon: s.icon
      }))
    });
  } catch (error) {
    console.error('Error searching specialties:', error);
    res.status(500).json({
      success: false,
      message: 'Error en la búsqueda'
    });
  }
});

/**
 * @route   GET /api/specialties/:id
 * @desc    Obtiene detalle de una especialidad
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const specialty = await Specialty.findByPk(req.params.id);

    if (!specialty) {
      return res.status(404).json({
        success: false,
        message: 'Especialidad no encontrada'
      });
    }

    res.json({
      success: true,
      data: specialty
    });
  } catch (error) {
    console.error('Error fetching specialty:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener especialidad'
    });
  }
});

module.exports = router;
