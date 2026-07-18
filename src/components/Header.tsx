import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, Globe, ChevronDown, PackageSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SmartSearch from '@/components/SmartSearch';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import NotificationBell from './NotificationBell';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';

const ANIMALS: { slug: string; label: string; labelUr: string }[] = [
  { slug: 'Cow', label: 'Cow', labelUr: 'گائے' },
  { slug: 'Buffalo', label: 'Buffalo', labelUr: 'بھینس' },
  { slug: 'Goat', label: 'Goat', labelUr: 'بکری' },
  { slug: 'Sheep', label: 'Sheep', labelUr: 'بھیڑ' },
  { slug: 'Poultry', label: 'Poultry', labelUr: 'مرغی' },
  { slug: 'Dog', label: 'Pets (Dog/Cat)', labelUr: 'پالتو جانور' },
  { slug: 'Horse', label: 'Horse', labelUr: 'گھوڑا' },
];

const Header = () => {
  const { t, language, setLanguage, isUrdu } = useLanguage();
  const { user, isAdmin, signOut, loading: authLoading } = useAuth();
  const { totalItems } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const { data: categories = [] } = useQuery({
    queryKey: ['header-categories'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('id, name, name_ur').limit(20);
      return data || [];
    },
    staleTime: 5 * 60_000,
  });

  const handleSignOut = async () => {
    await signOut();
    setMenuOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-card border-b shadow-sm">
      <div className="hero-gradient px-4 py-1.5 text-center">
        <p className={`text-xs text-primary-foreground ${isUrdu ? 'font-urdu' : ''}`}>
          {t('storeName')} — {t('location')}
        </p>
      </div>

      <div className="container flex items-center gap-3 py-3">
        <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden text-foreground">
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <Link to="/" className="flex-shrink-0">
          <div className="flex flex-col leading-tight">
            <span className={`text-base font-extrabold tracking-tight text-primary ${isUrdu ? 'font-urdu text-sm' : ''}`}>
              Punjab Veterinary
            </span>
            <span className={`text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground ${isUrdu ? 'font-urdu text-[9px] tracking-normal' : ''}`}>
              Medical Store
            </span>
          </div>
        </Link>

        <div className="flex-1 max-w-xl mx-auto hidden sm:block">
          <SmartSearch />
        </div>

        <div className="flex items-center gap-1 ml-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLanguage(language === 'en' ? 'ur' : 'en')}
            title={language === 'en' ? 'اردو' : 'English'}
          >
            <Globe size={20} />
          </Button>

          <NotificationBell />

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

          {authLoading ? (
            <div className="h-9 w-16 rounded-md bg-muted animate-pulse" />
          ) : user ? (
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

      {menuOpen && (
        <nav className="lg:hidden bg-card border-t px-4 py-4 space-y-1 animate-slide-in max-h-[70vh] overflow-y-auto">
          <MobileLink to="/" onClick={() => setMenuOpen(false)}>{isUrdu ? 'ہوم' : 'Home'}</MobileLink>
          <MobileLink to="/products" onClick={() => setMenuOpen(false)}>{isUrdu ? 'شاپ' : 'Shop'}</MobileLink>

          <details className="group">
            <summary className={`flex items-center justify-between py-2.5 text-foreground font-medium cursor-pointer list-none ${isUrdu ? 'font-urdu' : ''}`}>
              <span>{isUrdu ? 'جانور کے مطابق' : 'Shop by Animal'}</span>
              <ChevronDown size={16} className="group-open:rotate-180 transition-transform" />
            </summary>
            <div className="pl-3 pb-1 space-y-1">
              {ANIMALS.map(a => (
                <Link key={a.slug} to={`/products?animal=${a.slug}`} onClick={() => setMenuOpen(false)}
                  className={`block py-1.5 text-sm text-muted-foreground ${isUrdu ? 'font-urdu' : ''}`}>
                  {isUrdu ? a.labelUr : a.label}
                </Link>
              ))}
            </div>
          </details>

          <details className="group">
            <summary className={`flex items-center justify-between py-2.5 text-foreground font-medium cursor-pointer list-none ${isUrdu ? 'font-urdu' : ''}`}>
              <span>{isUrdu ? 'کیٹیگریز' : 'Categories'}</span>
              <ChevronDown size={16} className="group-open:rotate-180 transition-transform" />
            </summary>
            <div className="pl-3 pb-1 space-y-1">
              {categories.map(c => (
                <Link key={c.id} to={`/products?category=${c.id}`} onClick={() => setMenuOpen(false)}
                  className={`block py-1.5 text-sm text-muted-foreground ${isUrdu ? 'font-urdu' : ''}`}>
                  {isUrdu && c.name_ur ? c.name_ur : c.name}
                </Link>
              ))}
            </div>
          </details>

          <MobileLink to="/products?offers=1" onClick={() => setMenuOpen(false)}>{isUrdu ? 'آفرز' : 'Offers'}</MobileLink>
          <MobileLink to="/blog" onClick={() => setMenuOpen(false)}>{isUrdu ? 'بلاگ' : 'Blog'}</MobileLink>
          <MobileLink to="/about" onClick={() => setMenuOpen(false)}>{isUrdu ? 'ہمارے بارے میں' : 'About Us'}</MobileLink>
          <MobileLink to="/contact" onClick={() => setMenuOpen(false)}>{isUrdu ? 'رابطہ' : 'Contact'}</MobileLink>
          {!authLoading && user && (
            <>
              <MobileLink to="/profile" onClick={() => setMenuOpen(false)}>{isUrdu ? 'میرا اکاؤنٹ' : 'My Account'}</MobileLink>
              <MobileLink to="/profile" onClick={() => setMenuOpen(false)}>{isUrdu ? 'آرڈر ٹریکنگ' : 'Order Tracking'}</MobileLink>
            </>
          )}
          {!authLoading && isAdmin && <MobileLink to="/admin" onClick={() => setMenuOpen(false)} className="text-primary">{t('admin')}</MobileLink>}
          {!authLoading && user && (
            <button onClick={() => void handleSignOut()} className={`block py-2.5 text-destructive font-medium w-full text-left ${isUrdu ? 'font-urdu' : ''}`}>{t('logout')}</button>
          )}
        </nav>
      )}

      {/* Desktop nav */}
      <nav className="hidden lg:block bg-secondary/40 border-t">
        <div className="container">
          <NavigationMenu>
            <NavigationMenuList className="py-1">
              <NavigationMenuItem>
                <Link to="/" className={`nav-link ${isUrdu ? 'font-urdu' : ''}`}>{isUrdu ? 'ہوم' : 'Home'}</Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link to="/products" className={`nav-link ${isUrdu ? 'font-urdu' : ''}`}>{isUrdu ? 'شاپ' : 'Shop'}</Link>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger className={`bg-transparent nav-trigger ${isUrdu ? 'font-urdu' : ''}`}>
                  {isUrdu ? 'جانور کے مطابق' : 'Shop by Animal'}
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid grid-cols-2 gap-1 p-3 w-[360px]">
                    {ANIMALS.map(a => (
                      <li key={a.slug}>
                        <NavigationMenuLink asChild>
                          <Link to={`/products?animal=${a.slug}`}
                            className="flex items-center gap-2 rounded-md p-2 text-sm hover:bg-accent">
                            <PackageSearch size={14} className="text-primary" />
                            <span className={isUrdu ? 'font-urdu' : ''}>{isUrdu ? a.labelUr : a.label}</span>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger className={`bg-transparent nav-trigger ${isUrdu ? 'font-urdu' : ''}`}>
                  {isUrdu ? 'کیٹیگریز' : 'Categories'}
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid gap-1 p-3 w-[280px]">
                    {categories.length === 0 && <li className="text-xs text-muted-foreground px-2 py-1">No categories</li>}
                    {categories.map(c => (
                      <li key={c.id}>
                        <NavigationMenuLink asChild>
                          <Link to={`/products?category=${c.id}`} className="block rounded-md p-2 text-sm hover:bg-accent">
                            <span className={isUrdu ? 'font-urdu' : ''}>{isUrdu && c.name_ur ? c.name_ur : c.name}</span>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <Link to="/products?offers=1" className={`nav-link text-destructive ${isUrdu ? 'font-urdu' : ''}`}>{isUrdu ? 'آفرز' : 'Offers'}</Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link to="/blog" className={`nav-link ${isUrdu ? 'font-urdu' : ''}`}>{isUrdu ? 'بلاگ' : 'Blog'}</Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link to="/about" className={`nav-link ${isUrdu ? 'font-urdu' : ''}`}>{isUrdu ? 'ہمارے بارے میں' : 'About Us'}</Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link to="/contact" className={`nav-link ${isUrdu ? 'font-urdu' : ''}`}>{isUrdu ? 'رابطہ' : 'Contact'}</Link>
              </NavigationMenuItem>

              {user && (
                <>
                  <NavigationMenuItem>
                    <Link to="/profile" className={`nav-link ${isUrdu ? 'font-urdu' : ''}`}>{isUrdu ? 'میرا اکاؤنٹ' : 'My Account'}</Link>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <Link to="/profile" className={`nav-link ${isUrdu ? 'font-urdu' : ''}`}>{isUrdu ? 'آرڈر ٹریکنگ' : 'Order Tracking'}</Link>
                  </NavigationMenuItem>
                </>
              )}
              {isAdmin && (
                <NavigationMenuItem>
                  <Link to="/admin" className={`nav-link text-primary font-semibold ${isUrdu ? 'font-urdu' : ''}`}>{t('adminPanel')}</Link>
                </NavigationMenuItem>
              )}
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </nav>

      <style>{`
        .nav-link { display: inline-flex; align-items: center; padding: 0.5rem 0.75rem; font-size: 0.875rem; font-weight: 500; color: hsl(var(--muted-foreground)); border-radius: 0.375rem; transition: all 0.15s; }
        .nav-link:hover { color: hsl(var(--primary)); background: hsl(var(--accent) / 0.4); }
        .nav-trigger { font-size: 0.875rem; font-weight: 500; color: hsl(var(--muted-foreground)); height: auto; padding: 0.5rem 0.75rem; }
      `}</style>
    </header>
  );
};

const MobileLink = ({ to, onClick, children, className = '' }: { to: string; onClick: () => void; children: React.ReactNode; className?: string }) => (
  <Link to={to} onClick={onClick} className={`block py-2.5 text-foreground font-medium ${className}`}>
    {children}
  </Link>
);

export default Header;
