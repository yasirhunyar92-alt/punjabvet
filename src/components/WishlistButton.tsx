import { Heart } from 'lucide-react';
import { useWishlist } from '@/hooks/useWishlist';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface Props {
  productId: string;
  className?: string;
  size?: number;
  variant?: 'icon' | 'button';
}

const WishlistButton = ({ productId, className, size = 16, variant = 'icon' }: Props) => {
  const { isInWishlist, toggle, user } = useWishlist();
  const navigate = useNavigate();
  const active = isInWishlist(productId);

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) { navigate('/auth'); return; }
    toggle(productId);
  };

  if (variant === 'button') {
    return (
      <button onClick={onClick} className={cn('inline-flex items-center gap-2 px-3 py-2 rounded-lg border bg-card hover:bg-accent transition-colors text-sm', className)}>
        <Heart size={size} className={active ? 'fill-destructive text-destructive' : ''} />
        <span>{active ? 'Saved' : 'Save'}</span>
      </button>
    );
  }

  return (
    <button onClick={onClick}
      className={cn('p-1.5 rounded-full bg-background/90 backdrop-blur-sm border shadow-sm hover:bg-background transition-colors', className)}
      aria-label="Toggle wishlist">
      <Heart size={size} className={active ? 'fill-destructive text-destructive' : 'text-muted-foreground'} />
    </button>
  );
};

export default WishlistButton;
