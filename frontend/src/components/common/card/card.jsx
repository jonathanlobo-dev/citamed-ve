import './card.css';

function Card({ 
  children,
  hover = false,
  onClick,
  className = '',
  ...props
}) {
  const cardClassName = [
    'card',
    hover && 'card-hover',
    onClick && 'card-clickable',
    className
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cardClassName}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;