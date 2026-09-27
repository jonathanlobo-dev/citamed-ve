import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

/**
 * EvolutionCharts - CITAMED.VE
 * M03 / Semana 6 - Visualización gráfica de evolución de signos vitales (recharts diferido)
 */
export default function EvolutionCharts({ vitalsSeries = [] }) {
  if (!vitalsSeries || vitalsSeries.length < 2) {
    return (
      <div className="bg-slate-50 border border-dashed border-slate-300 rounded-xl p-8 text-center text-slate-500">
        <p className="text-base font-semibold text-slate-700 mb-1">
          Historial de evolución insuficiente
        </p>
        <p className="text-sm">
          Se necesitan al menos dos consultas con signos vitales para ver la evolución gráfica.
        </p>
      </div>
    );
  }

  // Formatear fechas para el eje X
  const formattedData = vitalsSeries.map((item) => {
    let dateLabel = item.date;
    try {
      const [y, m, d] = item.date.split('-');
      dateLabel = `${d}/${m}/${y.slice(2)}`;
    } catch {
      // conservar fecha original si falla split
    }

    return {
      ...item,
      displayDate: dateLabel,
      weightKg: item.weightKg ? Number(item.weightKg) : null,
      bmi: item.bmi ? Number(item.bmi) : null,
      systolic: item.systolic ? Number(item.systolic) : null,
      diastolic: item.diastolic ? Number(item.diastolic) : null,
      heartRate: item.heartRate ? Number(item.heartRate) : null
    };
  });

  return (
    <div className="space-y-8">
      {/* Gráfico 1: Tensión Arterial */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Tensión Arterial (Sistólica / Diastólica)
            </h3>
            <p className="text-xs text-slate-500">Milímetros de mercurio (mmHg)</p>
          </div>
          <div className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">
            Rango normal: &lt;140 / &lt;90
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formattedData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="displayDate" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} domain={['dataMin - 10', 'dataMax + 10']} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '12px'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Line
                type="monotone"
                dataKey="systolic"
                name="Sistólica (mmHg)"
                stroke="#e11d48"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#e11d48' }}
                activeDot={{ r: 6 }}
                connectNulls
              />
              <Line
                type="monotone"
                dataKey="diastolic"
                name="Diastólica (mmHg)"
                stroke="#2563eb"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#2563eb' }}
                activeDot={{ r: 6 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico 2: Peso e IMC */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Peso Corporal e IMC</h3>
            <p className="text-xs text-slate-500">Peso en kilogramos (kg) e Índice de Masa Corporal (kg/m²)</p>
          </div>
          <div className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">
            IMC normal: 18.5 - 24.9
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formattedData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="displayDate" stroke="#94a3b8" fontSize={12} />
              <YAxis
                yAxisId="left"
                stroke="#0d9488"
                fontSize={12}
                domain={['dataMin - 2', 'dataMax + 2']}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#d97706"
                fontSize={12}
                domain={['dataMin - 1', 'dataMax + 1']}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '12px'
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="weightKg"
                name="Peso (kg)"
                stroke="#0d9488"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#0d9488' }}
                activeDot={{ r: 6 }}
                connectNulls
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="bmi"
                name="IMC (kg/m²)"
                stroke="#d97706"
                strokeWidth={2.5}
                strokeDasharray="4 4"
                dot={{ r: 4, fill: '#d97706' }}
                activeDot={{ r: 6 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
