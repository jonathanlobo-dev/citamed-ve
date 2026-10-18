/**
 * venezuelanBanks.js - CITAMED.VE
 * M05 / Semana 8 - Lista oficial de bancos venezolanos (códigos SUDEBAN)
 */

const VENEZUELAN_BANKS = [
  { code: '0102', name: 'Banco de Venezuela' },
  { code: '0104', name: 'Venezolano de Crédito' },
  { code: '0105', name: 'Banco Mercantil' },
  { code: '0108', name: 'BBVA Provincial' },
  { code: '0114', name: 'Bancaribe' },
  { code: '0115', name: 'Banco Exterior' },
  { code: '0128', name: 'Banco Caroní' },
  { code: '0134', name: 'Banesco' },
  { code: '0137', name: 'Banco Sofitasa' },
  { code: '0138', name: 'Banco Plaza' },
  { code: '0151', name: 'BFC Banco Fondo Común' },
  { code: '0156', name: '100% Banco' },
  { code: '0157', name: 'DelSur Banco Universal' },
  { code: '0163', name: 'Banco del Tesoro' },
  { code: '0166', name: 'Banco Agrícola de Venezuela' },
  { code: '0168', name: 'Bancrecer' },
  { code: '0169', name: 'Mi Banco' },
  { code: '0171', name: 'Banco Activo' },
  { code: '0172', name: 'Bancamiga' },
  { code: '0174', name: 'Banplus' },
  { code: '0175', name: 'Banco Bicentenario' },
  { code: '0177', name: 'BANFANB' },
  { code: '0191', name: 'BNC (Banco Nacional de Crédito)' }
];

const isValidBankCode = (code) => VENEZUELAN_BANKS.some((b) => b.code === String(code || '').trim());
const getBankByCode = (code) => VENEZUELAN_BANKS.find((b) => b.code === String(code || '').trim()) || null;

module.exports = {
  VENEZUELAN_BANKS,
  isValidBankCode,
  getBankByCode
};
