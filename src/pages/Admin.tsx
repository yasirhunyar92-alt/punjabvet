import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Package, ShoppingCart, Users, TrendingUp, Tag, Image as ImageIcon, FileText } from 'lucide-react';
import ProductsManagement from '@/components/admin/ProductsManagement';
import CouponsManagement from '@/components/admin/CouponsManagement';
import BannersManagement from '@/components/admin/BannersManagement';
import BlogManagement from '@/components/admin/BlogManagement';

const Admin = () => {
  const { t, isUrdu } = useLanguage();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const fontClass = isUrdu ? 'font-urdu' : '';

  if (!user || !isAdmin) {
    return (
      <div className="container py-16 text-center">
        <p className="text-lg text-destructive">Access Denied. Admin only.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/')}>Go Home</Button>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <h1 className={`text-2xl font-bold text-foreground mb-6 ${fontClass}`}>{t('adminPanel')}</h1>

      <Tabs defaultValue="products">
        <TabsList className="w-full mb-6 flex-wrap h-auto gap-1">
          <TabsTrigger value="analytics" className={fontClass}><TrendingUp size={14} className="mr-1" /> {t('analytics')}</TabsTrigger>
          <TabsTrigger value="products" className={fontClass}><Package size={14} className="mr-1" /> {t('manageProducts')}</TabsTrigger>
          <TabsTrigger value="orders" className={fontClass}><ShoppingCart size={14} className="mr-1" /> {t('manageOrders')}</TabsTrigger>
          <TabsTrigger value="categories" className={fontClass}>{t('manageCategories')}</TabsTrigger>
          <TabsTrigger value="coupons" className={fontClass}><Tag size={14} className="mr-1" /> Coupons</TabsTrigger>
          <TabsTrigger value="banners" className={fontClass}><ImageIcon size={14} className="mr-1" /> Banners</TabsTrigger>
          <TabsTrigger value="blog" className={fontClass}><FileText size={14} className="mr-1" /> Blog</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics"><AnalyticsDashboard /></TabsContent>
        <TabsContent value="products"><ProductsManagement /></TabsContent>
        <TabsContent value="orders"><OrdersManagement /></TabsContent>
        <TabsContent value="categories"><CategoriesManagement /></TabsContent>
        <TabsContent value="coupons"><CouponsManagement /></TabsContent>
        <TabsContent value="banners"><BannersManagement /></TabsContent>
        <TabsContent value="blog"><BlogManagement /></TabsContent>
      </Tabs>
    </div>
  );
};

const AnalyticsDashboard = () => {
  const { t } = useLanguage();
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [products, orders, profiles] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id, total_price'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
      ]);
      const totalRevenue = (orders.data || []).reduce((sum, o) => sum + Number(o.total_price), 0);
      return { products: products.count || 0, orders: orders.data?.length || 0, customers: profiles.count || 0, revenue: totalRevenue };
    },
  });

  const cards = [
    { label: t('totalProducts'), value: stats?.products || 0, icon: <Package size={24} /> },
    { label: t('totalOrders'), value: stats?.orders || 0, icon: <ShoppingCart size={24} /> },
    { label: t('totalCustomers'), value: stats?.customers || 0, icon: <Users size={24} /> },
    { label: t('totalRevenue'), value: `Rs. ${(stats?.revenue || 0).toLocaleString()}`, icon: <TrendingUp size={24} /> },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <div key={i} className="bg-card border rounded-lg p-4 text-center">
          <div className="text-primary mx-auto mb-2 flex justify-center">{card.icon}</div>
          <p className="text-2xl font-bold text-foreground">{card.value}</p>
          <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
        </div>
      ))}
    </div>
  );
};

const OrdersManagement = () => {
  const { t, isUrdu } = useLanguage();
  const fontClass = isUrdu ? 'font-urdu' : '';
  const queryClient = useQueryClient();

  const { data: orders } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data } = await supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false });
      return data || [];
    },
  });

  const updateStatus = async (orderId: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', orderId);
    toast.success('Order status updated');
    queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
  };

  return (
    <div className="space-y-4">
      {orders?.map(order => (
        <div key={order.id} className="bg-card border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-medium">{order.customer_name || 'N/A'}</p>
              <p className="text-xs text-muted-foreground">{order.phone} · {new Date(order.created_at).toLocaleDateString()}</p>
            </div>
            <Select value={order.status} onValueChange={v => updateStatus(order.id, v)}>
              <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">{t('pending')}</SelectItem>
                <SelectItem value="processing">{t('processing')}</SelectItem>
                <SelectItem value="completed">{t('completed')}</SelectItem>
                <SelectItem value="cancelled">{t('cancelled')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-xs space-y-1">
            {(order.order_items as any[])?.map((item: any) => (
              <div key={item.id} className="flex justify-between">
                <span className="text-muted-foreground">{item.product_name} × {item.quantity}</span>
                <span>Rs. {(item.price_at_purchase * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="border-t mt-2 pt-2 flex justify-between text-sm font-bold">
            <span>{t('total')}</span>
            <span className="text-primary">Rs. {order.total_price.toLocaleString()}</span>
          </div>
          {order.address && <p className="text-xs text-muted-foreground mt-1">📍 {order.address}</p>}
        </div>
      ))}
      {(!orders || orders.length === 0) && <p className="text-center text-muted-foreground py-8">No orders yet</p>}
    </div>
  );
};

const CategoriesManagement = () => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [nameUr, setNameUr] = useState('');

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('*');
      return data || [];
    },
  });

  const addCategory = async () => {
    if (!name.trim()) return;
    await supabase.from('categories').insert({ name: name.trim(), name_ur: nameUr.trim() || null });
    setName(''); setNameUr('');
    toast.success('Category added');
    queryClient.invalidateQueries({ queryKey: ['categories'] });
  };

  const deleteCategory = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    await supabase.from('categories').delete().eq('id', id);
    toast.success('Category deleted');
    queryClient.invalidateQueries({ queryKey: ['categories'] });
  };

  return (
    <div>
      <div className="flex gap-2 mb-4">
        <Input placeholder="Category name (EN)" value={name} onChange={e => setName(e.target.value)} className="flex-1" />
        <Input placeholder="اردو نام" value={nameUr} onChange={e => setNameUr(e.target.value)} className="flex-1 font-urdu text-right" dir="rtl" />
        <Button onClick={addCategory}><Plus size={16} /></Button>
      </div>
      <div className="space-y-2">
        {categories?.map(c => (
          <div key={c.id} className="bg-card border rounded-lg p-3 flex items-center justify-between">
            <div>
              <span className="font-medium">{c.name}</span>
              {c.name_ur && <span className="text-muted-foreground ml-2 font-urdu">{c.name_ur}</span>}
            </div>
            <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteCategory(c.id)}><Trash2 size={14} /></Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Admin;
