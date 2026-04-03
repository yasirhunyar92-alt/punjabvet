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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Package, ShoppingCart, Users, TrendingUp } from 'lucide-react';

const Admin = () => {
  const { t, isUrdu } = useLanguage();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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
          <TabsTrigger value="analytics" className={`flex-1 ${fontClass}`}><TrendingUp size={16} className="mr-1" /> {t('analytics')}</TabsTrigger>
          <TabsTrigger value="products" className={`flex-1 ${fontClass}`}><Package size={16} className="mr-1" /> {t('manageProducts')}</TabsTrigger>
          <TabsTrigger value="orders" className={`flex-1 ${fontClass}`}><ShoppingCart size={16} className="mr-1" /> {t('manageOrders')}</TabsTrigger>
          <TabsTrigger value="categories" className={`flex-1 ${fontClass}`}>{t('manageCategories')}</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics"><AnalyticsDashboard /></TabsContent>
        <TabsContent value="products"><ProductsManagement /></TabsContent>
        <TabsContent value="orders"><OrdersManagement /></TabsContent>
        <TabsContent value="categories"><CategoriesManagement /></TabsContent>
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
      return {
        products: products.count || 0,
        orders: orders.data?.length || 0,
        customers: profiles.count || 0,
        revenue: totalRevenue,
      };
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

const ProductsManagement = () => {
  const { t, isUrdu } = useLanguage();
  const fontClass = isUrdu ? 'font-urdu' : '';
  const queryClient = useQueryClient();
  const [editProduct, setEditProduct] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', name_ur: '', description: '', description_ur: '', price: '', category_id: '', featured: false, in_stock: true, image_url: '' });

  const { data: products } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('*, categories(name)').order('created_at', { ascending: false });
      return data || [];
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('*');
      return data || [];
    },
  });

  const openNew = () => {
    setEditProduct(null);
    setForm({ name: '', name_ur: '', description: '', description_ur: '', price: '', category_id: '', featured: false, in_stock: true, image_url: '' });
    setDialogOpen(true);
  };

  const openEdit = (p: any) => {
    setEditProduct(p);
    setForm({ name: p.name, name_ur: p.name_ur || '', description: p.description || '', description_ur: p.description_ur || '', price: String(p.price), category_id: p.category_id || '', featured: p.featured, in_stock: p.in_stock, image_url: p.image_url || '' });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price) { toast.error('Name and price are required'); return; }
    const payload = {
      name: form.name, name_ur: form.name_ur || null, description: form.description || null,
      description_ur: form.description_ur || null, price: Number(form.price),
      category_id: form.category_id || null, featured: form.featured, in_stock: form.in_stock,
      image_url: form.image_url || null,
    };

    if (editProduct) {
      const { error } = await supabase.from('products').update(payload).eq('id', editProduct.id);
      if (error) { toast.error(error.message); return; }
      toast.success('Product updated');
    } else {
      const { error } = await supabase.from('products').insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success('Product added');
    }
    setDialogOpen(false);
    queryClient.invalidateQueries({ queryKey: ['admin-products'] });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    await supabase.from('products').delete().eq('id', id);
    toast.success('Product deleted');
    queryClient.invalidateQueries({ queryKey: ['admin-products'] });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`font-semibold ${fontClass}`}>{t('manageProducts')}</h3>
        <Button size="sm" onClick={openNew}><Plus size={16} /> {t('addProduct')}</Button>
      </div>

      <div className="space-y-3">
        {products?.map(p => (
          <div key={p.id} className="bg-card border rounded-lg p-3 flex items-center gap-3">
            <div className="w-12 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
              {p.image_url ? <img src={p.image_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center">🐄</div>}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium truncate ${fontClass}`}>{p.name}</p>
              <p className="text-xs text-muted-foreground">Rs. {p.price} · {(p.categories as any)?.name || 'No category'}</p>
            </div>
            <div className="flex gap-1">
              {p.featured && <Badge variant="secondary" className="text-[10px]">★</Badge>}
              <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Pencil size={14} /></Button>
              <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(p.id)}><Trash2 size={14} /></Button>
            </div>
          </div>
        ))}
        {(!products || products.length === 0) && <p className="text-center text-muted-foreground py-8">No products yet</p>}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className={fontClass}>{editProduct ? t('editProduct') : t('addProduct')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Name (EN)</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Name (Urdu)</Label><Input value={form.name_ur} onChange={e => setForm({ ...form, name_ur: e.target.value })} className="font-urdu text-right" dir="rtl" /></div>
            <div><Label>{t('productPrice')} (Rs.)</Label><Input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></div>
            <div><Label>{t('category')}</Label>
              <Select value={form.category_id} onValueChange={v => setForm({ ...form, category_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Description (EN)</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div><Label>Description (Urdu)</Label><Input value={form.description_ur} onChange={e => setForm({ ...form, description_ur: e.target.value })} className="font-urdu text-right" dir="rtl" /></div>
            <div><Label>Image URL</Label><Input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} /></div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2"><Switch checked={form.featured} onCheckedChange={v => setForm({ ...form, featured: v })} /><Label>{t('featured')}</Label></div>
              <div className="flex items-center gap-2"><Switch checked={form.in_stock} onCheckedChange={v => setForm({ ...form, in_stock: v })} /><Label>{t('inStock')}</Label></div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} className="flex-1">{t('save')}</Button>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('cancel')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
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

  const statusColors: Record<string, string> = {
    pending: 'bg-warning text-foreground',
    processing: 'bg-primary/20 text-primary',
    completed: 'bg-accent text-accent-foreground',
    cancelled: 'bg-destructive/20 text-destructive',
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
              <SelectTrigger className="w-32 h-8">
                <SelectValue />
              </SelectTrigger>
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
