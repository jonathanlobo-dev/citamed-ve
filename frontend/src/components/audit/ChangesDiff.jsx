/**
 * ChangesDiff Component - CITAMED.VE
 * M01 Sub-Partida 2.5.2
 *
 * Visualiza diferencias entre estados antes/después de cambios
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Minus,
  Edit3,
  ArrowRight,
  Code
} from 'lucide-react';

/**
 * Componente para mostrar un campo individual con su cambio
 */
const FieldChange = ({ field, before, after }) => {
  const hasChange = before !== after;
  const isAdded = before === undefined || before === null;
  const isRemoved = after === undefined || after === null;

  const formatValue = (value) => {
    if (value === null || value === undefined) return <span className="text-gray-400 italic">vacío</span>;
    if (typeof value === 'boolean') return value ? 'Sí' : 'No';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`p-3 rounded-lg border ${
        isAdded
          ? 'bg-green-50 border-green-200'
          : isRemoved
          ? 'bg-red-50 border-red-200'
          : hasChange
          ? 'bg-yellow-50 border-yellow-200'
          : 'bg-gray-50 border-gray-200'
      }`}
    >
      <div className="flex items-center gap-2 mb-2">
        {isAdded ? (
          <Plus className="w-4 h-4 text-green-600" />
        ) : isRemoved ? (
          <Minus className="w-4 h-4 text-red-600" />
        ) : hasChange ? (
          <Edit3 className="w-4 h-4 text-yellow-600" />
        ) : null}
        <span className="font-medium text-sm text-gray-700">{field}</span>
      </div>

      {hasChange ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {!isAdded && (
            <div className="bg-white rounded p-2 border border-red-200">
              <div className="text-xs text-red-600 font-medium mb-1">Antes</div>
              <div className="text-sm text-gray-800 break-words">
                {formatValue(before)}
              </div>
            </div>
          )}
          {!isRemoved && (
            <div className="bg-white rounded p-2 border border-green-200">
              <div className="text-xs text-green-600 font-medium mb-1">Después</div>
              <div className="text-sm text-gray-800 break-words">
                {formatValue(after)}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-sm text-gray-600">
          {formatValue(after || before)}
        </div>
      )}
    </motion.div>
  );
};

/**
 * Vista de diferencias lado a lado
 */
const SideBySideView = ({ before, after }) => {
  const formatJSON = (obj) => {
    if (!obj) return '';
    return JSON.stringify(obj, null, 2);
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Antes */}
      <div>
        <div className="text-sm font-medium text-red-600 mb-2 flex items-center gap-1">
          <Minus className="w-4 h-4" />
          Antes
        </div>
        <pre className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm overflow-auto max-h-96 font-mono text-gray-800">
          {before ? formatJSON(before) : <span className="text-gray-400 italic">Sin datos previos</span>}
        </pre>
      </div>

      {/* Después */}
      <div>
        <div className="text-sm font-medium text-green-600 mb-2 flex items-center gap-1">
          <Plus className="w-4 h-4" />
          Después
        </div>
        <pre className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm overflow-auto max-h-96 font-mono text-gray-800">
          {after ? formatJSON(after) : <span className="text-gray-400 italic">Sin datos</span>}
        </pre>
      </div>
    </div>
  );
};

/**
 * Componente principal de diferencias
 */
const ChangesDiff = ({ before, after, viewMode = 'inline' }) => {
  // Calcular campos que cambiaron
  const changes = useMemo(() => {
    const allKeys = new Set([
      ...(before ? Object.keys(before) : []),
      ...(after ? Object.keys(after) : [])
    ]);

    const changedFields = [];
    const unchangedFields = [];

    allKeys.forEach(key => {
      const beforeVal = before?.[key];
      const afterVal = after?.[key];

      const hasChange = JSON.stringify(beforeVal) !== JSON.stringify(afterVal);

      if (hasChange) {
        changedFields.push({ field: key, before: beforeVal, after: afterVal });
      } else {
        unchangedFields.push({ field: key, before: beforeVal, after: afterVal });
      }
    });

    return { changedFields, unchangedFields };
  }, [before, after]);

  // Si no hay cambios
  if (changes.changedFields.length === 0 && (!before && !after)) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Code className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>No hay cambios registrados</p>
      </div>
    );
  }

  // Vista JSON lado a lado
  if (viewMode === 'sideBySide') {
    return <SideBySideView before={before} after={after} />;
  }

  // Vista inline (por campo)
  return (
    <div className="space-y-3">
      {/* Campos que cambiaron */}
      {changes.changedFields.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-yellow-500" />
            Campos modificados ({changes.changedFields.length})
          </h4>
          <div className="space-y-2">
            {changes.changedFields.map(({ field, before: b, after: a }) => (
              <FieldChange key={field} field={field} before={b} after={a} />
            ))}
          </div>
        </div>
      )}

      {/* Campos sin cambios (colapsable) */}
      {changes.unchangedFields.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-gray-500 hover:text-gray-700 flex items-center gap-2">
            <ArrowRight className="w-4 h-4 transition-transform group-open:rotate-90" />
            Campos sin cambios ({changes.unchangedFields.length})
          </summary>
          <div className="mt-2 space-y-2">
            {changes.unchangedFields.map(({ field, after: value }) => (
              <div key={field} className="p-2 bg-gray-50 rounded border border-gray-200 text-sm">
                <span className="font-medium text-gray-600">{field}:</span>{' '}
                <span className="text-gray-800">{JSON.stringify(value)}</span>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Resumen de cambios */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1 text-green-600">
            <Plus className="w-4 h-4" />
            {changes.changedFields.filter(c => c.before === undefined || c.before === null).length} agregados
          </span>
          <span className="flex items-center gap-1 text-yellow-600">
            <Edit3 className="w-4 h-4" />
            {changes.changedFields.filter(c => c.before !== undefined && c.before !== null && c.after !== undefined && c.after !== null).length} modificados
          </span>
          <span className="flex items-center gap-1 text-red-600">
            <Minus className="w-4 h-4" />
            {changes.changedFields.filter(c => c.after === undefined || c.after === null).length} eliminados
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChangesDiff;
