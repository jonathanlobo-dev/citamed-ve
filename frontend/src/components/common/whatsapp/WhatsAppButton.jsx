/**
 * 💬 WHATSAPP BUTTON - CITAMED.VE
 * Botón flotante verde en esquina inferior derecha
 */

import './WhatsAppButton.css';

function WhatsAppButton() {
  const phoneNumber = '584122163031'; // Formato internacional sin +
  const message = '¡Hola! Me interesa conocer más sobre CITAMED.VE';
  
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  const handleClick = () => {
    window.open(whatsappUrl, '_blank');
  };

  return (
    <button 
      className="whatsapp-button"
      onClick={handleClick}
      aria-label="Contactar por WhatsApp"
      title="¿Necesitas ayuda? Escríbenos por WhatsApp"
    >
      <svg 
        className="whatsapp-icon" 
        viewBox="0 0 32 32" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <path 
          d="M16 0C7.164 0 0 7.164 0 16c0 2.825.738 5.483 2.028 7.777L.697 30.384a.998.998 0 001.237 1.237l6.607-1.331A15.936 15.936 0 0016 32c8.836 0 16-7.164 16-16S24.836 0 16 0z" 
          fill="#25D366"
        />
        <path 
          d="M25.5 16c0 5.247-4.253 9.5-9.5 9.5a9.448 9.448 0 01-4.644-1.214l-3.356.676.676-3.356A9.448 9.448 0 017.5 16c0-5.247 4.253-9.5 9.5-9.5s9.5 4.253 9.5 9.5z" 
          fill="#fff"
        />
        <path 
          d="M20.928 18.928c-.264-.132-1.56-.77-1.8-.857-.24-.088-.416-.132-.588.132-.176.264-.676.857-.828 1.033-.152.176-.308.196-.572.066-.264-.132-1.116-.412-2.124-1.312-.784-.7-1.316-1.564-1.468-1.828-.152-.264-.016-.408.116-.54.12-.12.264-.308.396-.464.132-.152.176-.264.264-.44.088-.176.044-.328-.022-.46-.066-.132-.588-1.416-.804-1.94-.212-.508-.428-.44-.588-.448-.152-.008-.328-.008-.5-.008-.176 0-.46.066-.7.328-.24.264-.916.896-.916 2.184s.94 2.532 1.068 2.708c.132.176 1.844 2.812 4.468 3.944.624.268 1.112.428 1.492.548.628.2 1.2.172 1.652.104.504-.076 1.56-.636 1.78-1.252.22-.616.22-1.144.152-1.252-.066-.108-.24-.176-.504-.308z" 
          fill="#25D366"
        />
      </svg>
      <span className="whatsapp-tooltip">¿Necesitas ayuda?</span>
    </button>
  );
}

export default WhatsAppButton;