/**
 * ChairIcon - CITAMED.VE
 * Dibujo de "las sillitas": una silla vacía o con una persona sentada.
 * Antes los puestos vacíos usaban el ícono de una caja de archivo (QA, 23/11).
 */
const ChairIcon = ({ occupied = false, size = 40, color = 'currentColor', className = '' }) => {
  // Ocupada: la silla queda suave y la persona, sentada al frente, en color sólido
  const chairOpacity = occupied ? 0.35 : 1;
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <g fill={color} opacity={chairOpacity}>
        {/* Respaldo */}
        <rect x="11" y="8" width="26" height="18" rx="5" />
        {/* Asiento */}
        <rect x="8" y="27" width="32" height="6" rx="3" />
        {/* Patas */}
        <rect x="11" y="33" width="3.5" height="11" rx="1.75" />
        <rect x="33.5" y="33" width="3.5" height="11" rx="1.75" />
      </g>
      {occupied && (
        <g fill={color}>
          {/* Cabeza */}
          <circle cx="24" cy="9" r="6" />
          {/* Torso */}
          <path d="M14 28c0-7 4.5-12 10-12s10 5 10 12z" />
          {/* Piernas */}
          <rect x="15" y="27" width="7" height="13" rx="3.5" />
          <rect x="26" y="27" width="7" height="13" rx="3.5" />
        </g>
      )}
    </svg>
  );
};

export default ChairIcon;
