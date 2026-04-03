import { MessageCircle } from 'lucide-react';

const WhatsAppButton = () => {
  const message = encodeURIComponent('Hello, I want to order this product from Punjab Veterinary Medical Store.');
  
  return (
    <a
      href={`https://wa.me/923065757283?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 whatsapp-green rounded-full p-4 shadow-lg hover:scale-110 transition-transform"
      aria-label="Order via WhatsApp"
    >
      <MessageCircle size={28} fill="currentColor" />
    </a>
  );
};

export default WhatsAppButton;
