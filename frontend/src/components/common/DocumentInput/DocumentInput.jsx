/**
 * DocumentInput - CITAMED.VE
 *
 * Selector de tipo de documento (V/E/J) + campo numerico reutilizable.
 * Expone hacia afuera el valor compuesto "<tipo>-<numero>" (ej: V-12345678)
 * y por dentro mantiene tipo y numero por separado.
 */

import { CreditCard } from 'lucide-react';

const DEFAULT_TYPES = ['V', 'E', 'J'];

function DocumentInput({ value, onChange, types = DEFAULT_TYPES, status }) {
  // Parsear valor compuesto: "<tipo>-<numero>" (tolera historico sin guion)
  const match = /^([VEJ])?-?(\d{0,9})$/i.exec(typeof value === 'string' ? value : '');
  const docType = match?.[1]?.toUpperCase() || 'V';
  const documentNumber = match?.[2] || '';

  const handleTypeChange = (e) => {
    onChange(`${e.target.value}-${documentNumber}`);
  };

  const handleNumberChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 9);
    onChange(`${docType}-${digits}`);
  };

  const statusClasses =
    status === 'error'
      ? 'border-red-500 focus:ring-red-200'
      : status === 'success'
        ? 'border-green-500 focus:ring-green-200'
        : 'border-gray-300 focus:ring-primary/20 focus:border-primary';

  return (
    <div className="relative flex">
      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none z-10" />
      <select
        aria-label="Tipo de documento"
        value={docType}
        onChange={handleTypeChange}
        className={`w-20 pl-10 pr-2 py-3 border rounded-l-lg bg-white text-center font-medium cursor-pointer
          focus:outline-none focus:ring-2 ${statusClasses}`}
      >
        {types.map((type) => (
          <option key={type} value={type}>{type}</option>
        ))}
      </select>
      <input
        type="text"
        aria-label="Número de documento"
        inputMode="numeric"
        placeholder="12345678"
        maxLength={9}
        value={documentNumber}
        onChange={handleNumberChange}
        className={`flex-1 min-w-0 px-4 pr-10 py-3 border border-l-0 rounded-r-lg
          focus:outline-none focus:ring-2 ${statusClasses}`}
      />
    </div>
  );
}

export default DocumentInput;
