/**
 * ChairIcon - CITAMED.VE
 * Dibujo de "las sillitas", de lado: una silla vacía o con una persona sentada de perfil.
 * (De frente parecían pocetas; antes de eso los puestos vacíos eran el ícono de una caja.)
 */
const ChairIcon = ({ occupied = false, size = 40, color = 'currentColor', className = '' }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
    {/* Silla de lado: respaldo, asiento y dos patas */}
    <g fill={color} opacity={occupied ? 0.4 : 1}>
      <rect x="9" y="10" width="4" height="22" rx="2" />
      <rect x="9" y="28" width="26" height="4" rx="2" />
      <rect x="10" y="32" width="3.5" height="13" rx="1.75" />
      <rect x="30.5" y="32" width="3.5" height="13" rx="1.75" />
    </g>
    {occupied && (
      <g fill={color}>
        {/* Persona sentada mirando a la derecha */}
        <circle cx="20" cy="8" r="5" />
        <rect x="15" y="14" width="9" height="15" rx="4.5" />
        <rect x="16" y="22" width="18" height="6.5" rx="3.25" />
        <rect x="28" y="23" width="6" height="17" rx="3" />
        <rect x="28" y="36.5" width="10" height="4.5" rx="2.25" />
      </g>
    )}
  </svg>
);

export default ChairIcon;
