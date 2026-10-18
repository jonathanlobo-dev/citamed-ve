/**
 * exchangeRateService.js - CitaMed
 * M05 / Semana 8 - Servicio frontend para consulta de la tasa oficial BCV
 */

import api from './api';

const exchangeRateService = {
  /**
   * Obtiene las tasas oficiales vigentes (USD/VES y EUR/VES)
   * @returns {Promise<{success: boolean, data: { usd: Object, eur: Object }}>}
   */
  getCurrentRates: () =>
    api.get('/exchange-rate').then((res) => res.data)
};

export default exchangeRateService;
