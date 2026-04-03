import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, Search, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';

const Header = () => {
  const { t, language, setLanguage, isUrdu } = useLanguage();
  const { user, isAdmin, signOut } = useAuth();
  const { totalItems } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-card border-b shadow-sm">
      {/* Top bar */}
      <div className="hero-gradient px-4 py-1.5 text-center">
        <p className={`text-xs text-primary-foreground ${isUrdu ? 'font-urdu' : ''}`}>
          {t('storeName')} — {t('location')}
        </p>
      </div>

      {/* Main header */}
      <div className="container flex items-center gap-3 py-3">
        <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden text-foreground">
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <Link to="/" className="flex-shrink-0">
          <h1 className={`text-lg font-bold text-primary ${isUrdu ? 'font-urdu text-base' : ''}`}>
            PVMS
          </h1>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-auto hidden sm:flex">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('search')}
              className={`pl-10 ${isUrdu ? 'font-urdu text-right' : ''}`}
            />
          </div>
        </form>

        <div className="flex items-center gap-2 ml-auto">
          {/* Language toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLanguage(language === 'en' ? 'ur' : 'en')}
            title={language === 'en' ? 'اردو' : 'English'}
          >
            <Globe size={20} />
          </Button>

          {/* Cart */}
          <Link to="/cart" className="relative">
            <Button variant="ghost" size="icon">
              <ShoppingCart size={22} />
              {totalItems > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]">
                  {totalItems}
                </Badge>
              )}
            </Button>
          </Link>

          {/* User */}
          {user ? (
            <Link to="/profile">
              <Button variant="ghost" size="icon">
                <User size={22} />
              </Button>
            </Link>
          ) : (
            <Link to="/auth">
              <Button variant="default" size="sm" className={isUrdu ? 'font-urdu' : ''}>
                {t('login')}
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile search */}
      <div className="sm:hidden px-4 pb-3">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('search')}
              className={`pl-10 ${isUrdu ? 'font-urdu text-right' : ''}`}
            />
          </div>
        </form>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="lg:hidden bg-card border-t px-4 py-4 space-y-3 animate-slide-in">
          <Link to="/" onClick={() => setMenuOpen(false)} className={`block py-2 text-foreground font-medium ${isUrdu ? 'font-urdu' : ''}`}>{t('home')}</Link>
          <Link to="/products" onClick={() => setMenuOpen(false)} className={`block py-2 text-foreground font-medium ${isUrdu ? 'font-urdu' : ''}`}>{t('products')}</Link>
          {user && <Link to="/profile" onClick={() => setMenuOpen(false)} className={`block py-2 text-foreground font-medium ${isUrdu ? 'font-urdu' : ''}`}>{t('profile')}</Link>}
          {isAdmin && <Link to="/admin" onClick={() => setMenuOpen(false)} className={`block py-2 text-primary font-medium ${isUrdu ? 'font-urdu' : ''}`}>{t('admin')}</Link>}
          {user && (
            <button onClick={() => { signOut(); setMenuOpen(false); }} className={`block py-2 text-destructive font-medium ${isUrdu ? 'font-urdu' : ''}`}>{t('logout')}</button>
          )}
        </nav>
      )}

      {/* Desktop nav */}
      <nav className="hidden lg:block bg-secondary/50 border-t">
        <div className="container flex items-center gap-6 py-2">
          <Link to="/" className={`text-sm font-medium text-foreground hover:text-primary transition-colors ${isUrdu ? 'font-urdu' : ''}`}>{t('home')}</Link>
          <Link to="/products" className={`text-sm font-medium text-foreground hover:text-primary transition-colors ${isUrdu ? 'font-urdu' : ''}`}>{t('products')}</Link>
          <Link to="/products?category=medicines" className={`text-sm font-medium text-muted-foreground hover:text-primary transition-colors ${isUrdu ? 'font-urdu' : ''}`}>{t('medicines')}</Link>
          <Link to="/products?category=vaccines" className={`text-sm font-medium text-muted-foreground hover:text-primary transition-colors ${isUrdu ? 'font-urdu' : ''}`}>{t('vaccines')}</Link>
          <Link to="/products?category=supplements" className={`text-sm font-medium text-muted-foreground hover:text-primary transition-colors ${isUrdu ? 'font-urdu' : ''}`}>{t('supplements')}</Link>
          {isAdmin && <Link to="/admin" className={`text-sm font-medium text-primary hover:text-primary/80 transition-colors ml-auto ${isUrdu ? 'font-urdu' : ''}`}>{t('adminPanel')}</Link>}
        </div>
      </nav>
    </header>
  );
};

export default Header;
