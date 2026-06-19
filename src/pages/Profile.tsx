import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { LogOut, User as UserIcon, Package, MapPin, Heart } from 'lucide-react';
import ProductCard from '@/components/ProductCard';

const Profile = () => {
  const { t, isUrdu } = useLanguage();
  const { user, signOut, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const fontClass = isUrdu ? 'font-urdu' : '';
  const [profileForm, setProfileForm] = useState({ name: '', phone: '', address: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate('/auth', { replace: true });
      return;
    }

    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle().then(({ data }) => {
      if (data) setProfileForm({ name: data.name || '', phone: data.phone || '', address: data.address || '' });
    });
  }, [user, authLoading, navigate]);

  const { data: orders } = useQuery({
    queryKey: ['my-orders', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !authLoading && !!user,
  });

  const { data: wishlist } = useQuery({
    queryKey: ['wishlist-full', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('wishlists')
        .select('product_id, products(*)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      return (data || []).map((w: any) => w.products).filter(Boolean);
    },
    enabled: !authLoading && !!user,
  });

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      name: profileForm.name.trim(),
      phone: profileForm.phone.trim(),
      address: profileForm.address.trim(),
    }).eq('id', user.id);
    if (error) toast.error(error.message);
    else toast.success('Profile updated');
    setSaving(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-warning text-foreground',
    processing: 'bg-primary/20 text-primary',
    completed: 'bg-accent text-accent-foreground',
    cancelled: 'bg-destructive/20 text-destructive',
  };

  if (authLoading) {
    return <div className="container py-16 text-center text-muted-foreground">{t('loading')}</div>;
  }

  if (!user) return null;

  return (
    <div className="container py-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className={`text-2xl font-bold text-foreground ${fontClass}`}>{t('myProfile')}</h1>
        <div className="flex gap-2">
          {isAdmin && (
            <Button variant="outline" size="sm" onClick={() => navigate('/admin')} className={fontClass}>
              {t('admin')}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => void handleSignOut()}>
            <LogOut size={16} /> {t('logout')}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="w-full mb-6">
          <TabsTrigger value="profile" className={`flex-1 ${fontClass}`}>
            <UserIcon size={16} className="mr-1" /> {t('editProfile')}
          </TabsTrigger>
          <TabsTrigger value="orders" className={`flex-1 ${fontClass}`}>
            <Package size={16} className="mr-1" /> {t('orderHistory')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <div className="bg-card border rounded-lg p-6 space-y-4">
            <div>
              <Label className={fontClass}>{t('email')}</Label>
              <Input value={user.email || ''} disabled />
            </div>
            <div>
              <Label className={fontClass}>{t('name')}</Label>
              <Input value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} className={isUrdu ? 'font-urdu text-right' : ''} />
            </div>
            <div>
              <Label className={fontClass}>{t('phone')}</Label>
              <Input value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} type="tel" />
            </div>
            <div>
              <Label className={fontClass}>{t('address')}</Label>
              <Input value={profileForm.address} onChange={e => setProfileForm({ ...profileForm, address: e.target.value })} className={isUrdu ? 'font-urdu text-right' : ''} />
            </div>
            <Button onClick={saveProfile} disabled={saving} className={fontClass}>
              {saving ? t('loading') : t('saveChanges')}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="orders">
          {orders && orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map(order => (
                <div key={order.id} className="bg-card border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</span>
                    <Badge className={statusColors[order.status] || ''}>
                      {t(order.status as any) || order.status}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    {(order.order_items as any[])?.map((item: any) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className={`text-muted-foreground ${fontClass}`}>{item.product_name} × {item.quantity}</span>
                        <span>{t('rs')} {(item.price_at_purchase * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t mt-2 pt-2 flex justify-between font-bold text-sm">
                    <span className={fontClass}>{t('total')}</span>
                    <span className="text-primary">{t('rs')} {order.total_price.toLocaleString()}</span>
                  </div>
                  {order.address && (
                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1"><MapPin size={12} /> {order.address}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className={`text-center py-12 text-muted-foreground ${fontClass}`}>
              <Package size={48} className="mx-auto mb-4" />
              <p>{t('noResults')}</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;