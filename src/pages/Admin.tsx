import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Trash2, Package, ShoppingCart, Users, TrendingUp, Tag, Image as ImageIcon,
  FileText, Upload, LayoutDashboard, FolderTree, Bell, Search, Stethoscope, Menu, X,
} from 'lucide-react';
import ProductsManagement from '@/components/admin/ProductsManagement';
import CouponsManagement from '@/components/admin/CouponsManagement';
import BannersManagement from '@/components/admin/BannersManagement';
import BlogManagement from '@/components/admin/BlogManagement';
import BulkImport from '@/components/admin/BulkImport';

type SectionId =
  | 'analytics' | 'products' | 'orders' | 'categories'
  | 'coupons' | 'banners' | 'blog' | 'import';

const NAV_GROUPS: { label: string; items: { id: SectionId; label: string; icon: any; badge?: 'pending-orders' }[] }[] = [
  {
    label: 'Main Menu',
    items: [
      { id: 'analytics', label: 'Analytics', icon: LayoutDashboard },
      { id: 'products', label: 'Products', icon: Package },
      { id: 'orders', label: 'Orders', icon: ShoppingCart, badge: 'pending-orders' },
    ],
  },
  {
    label: 'Inventory',
    items: [
      { id: 'categories', label: 'Categories', icon: FolderTree },
      { id: 'coupons', label: 'Coupons', icon: Tag },
      { id: 'import', label: 'Bulk CSV', icon: Upload },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { id: 'banners', label: 'Banners', icon: ImageIcon },
      { id: 'blog', label: 'Blog', icon: FileText },
    ],
  },
];

const SECTION_TITLES: Record<SectionId, { title: string; subtitle: string }> = {
  analytics: { title: 'Analytics', subtitle: 'Store performance at a glance' },
  products: { title: 'Products', subtitle: 'Manage your medicine catalog' },
  orders: { title: 'Orders', subtitle: 'Track and update customer orders' },
  categories: { title: 'Categories', subtitle: 'Organize your product taxonomy' },
  coupons: { title: 'Coupons', subtitle: 'Run discounts and promotions' },
  banners: { title: 'Banners', subtitle: 'Update homepage promotional banners' },
  blog: { title: 'Blog', subtitle: 'Publish articles and health tips' },
  import: { title: 'Bulk CSV Import', subtitle: 'Upload products and categories in bulk' },
};

const Admin = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState<SectionId>('analytics');
  const [mobileOpen, setMobileOpen] = useState(false);

  const { data: pendingCount } = useQuery({
    queryKey: ['admin-pending-orders-count'],
    queryFn: async () => {
      const { count } = await supabase.from('orders').select('id', { count: 'exact', head: true }).eq('status', 'pending');
      return count || 0;
    },
  });

  if (!user || !isAdmin) {
    return (
      <div className="container py-16 text-center">
        <p className="text-lg text-destructive">Access Denied. Admin only.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/')}>Go Home</Button>
      </div>
    );
  }

  const firstName = (user.user_metadata?.full_name as string)?.split(' ')[0]
    || user.email?.split('@')[0]
    || 'Admin';

  const renderSection = () => {
    switch (active) {
      case 'analytics': return <AnalyticsDashboard />;
      case 'products': return <ProductsManagement />;
      case 'orders': return <OrdersManagement />;
      case 'categories': return <CategoriesManagement />;
      case 'coupons': return <CouponsManagement />;
      case 'banners': return <BannersManagement />;
      case 'blog': return <BlogManagement />;
      case 'import': return <BulkImport />;
    }
  };

  const section = SECTION_TITLES[active];

  return (
    <div className="min-h-screen w-full bg-slate-50 flex" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg" style={{ background: 'hsl(142 60% 38%)', boxShadow: '0 10px 30px -10px hsl(142 60% 38% / 0.45)' }}>
              <Stethoscope className="w-5 h-5" />
            </div>
            <div className="leading-tight">
              <h1 className="font-bold text-slate-800 text-base">PVMS Admin</h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">Medical Store Portal</p>
            </div>
          </div>
          <button className="lg:hidden p-1 text-slate-400" onClick={() => setMobileOpen(false)}><X className="w-5 h-5" /></button>
        </div>

        <nav className="flex-1 px-4 pb-4 space-y-1 overflow-y-auto">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <div className="px-4 pt-5 pb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">{group.label}</div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = active === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { setActive(item.id); setMobileOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-medium text-sm transition-all ${
                      isActive
                        ? 'text-primary bg-primary/5 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? '' : 'opacity-50'}`} />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge === 'pending-orders' && pendingCount ? (
                      <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{pendingCount}</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="p-4">
          <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm" style={{ background: 'hsl(142 60% 38% / 0.12)', color: 'hsl(142 60% 38%)' }}>
              {firstName.slice(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-800 truncate">{firstName}</p>
              <p className="text-xs text-slate-500 truncate">Store Administrator</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 p-6 lg:p-10 overflow-x-hidden">
        {/* Topbar */}
        <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8 lg:mb-10">
          <div className="flex items-start gap-3">
            <button className="lg:hidden p-2 -ml-2 text-slate-600" onClick={() => setMobileOpen(true)}><Menu className="w-6 h-6" /></button>
            <div>
              {active === 'analytics' ? (
                <>
                  <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
                    Assalam-o-Alaikum, {firstName}
                  </h2>
                  <p className="text-slate-500 flex flex-wrap items-center gap-3 mt-1">
                    <span className="text-base lg:text-lg font-urdu">السلام علیکم، آج خیریت ہے؟</span>
                    <span className="hidden lg:inline w-px h-4 bg-slate-300" />
                    <span className="text-xs lg:text-sm font-medium uppercase tracking-wider text-primary">Store Overview Today</span>
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">{section.title}</h2>
                  <p className="text-slate-500 mt-1 text-sm">{section.subtitle}</p>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 lg:flex-none">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search records..."
                className="bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-sm w-full lg:w-72 focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-sm"
              />
            </div>
            <button className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:text-primary hover:border-primary/30 transition-all shadow-sm relative">
              <Bell className="w-5 h-5" />
              {pendingCount ? (
                <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-orange-500 border-2 border-white rounded-full" />
              ) : null}
            </button>
          </div>
        </header>

        {renderSection()}
      </main>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, accent, meta, trend }: any) => (
  <div className={`bg-white p-6 lg:p-8 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl transition-all group ${accent.shadow}`}>
    <div className="flex items-center justify-between mb-5">
      <div className={`p-3.5 rounded-[1.25rem] group-hover:scale-110 transition-transform ${accent.bg} ${accent.text}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="text-right">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{meta}</span>
        {trend && <p className={`text-xs font-bold ${accent.text}`}>{trend}</p>}
      </div>
    </div>
    <p className="text-slate-500 font-medium text-sm">{label}</p>
    <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
  </div>
);

const AnalyticsDashboard = () => {
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [products, orders, profiles] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id, total_price, status'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
      ]);
      const totalRevenue = (orders.data || []).reduce((sum, o) => sum + Number(o.total_price), 0);
      const pending = (orders.data || []).filter(o => o.status === 'pending').length;
      return {
        products: products.count || 0,
        orders: orders.data?.length || 0,
        customers: profiles.count || 0,
        revenue: totalRevenue,
        pending,
      };
    },
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
      <StatCard
        icon={TrendingUp}
        label="Total Revenue"
        value={`PKR ${(stats?.revenue || 0).toLocaleString()}`}
        meta="All Time"
        trend="Lifetime"
        accent={{ bg: 'bg-primary/10', text: 'text-primary', shadow: 'hover:shadow-primary/5' }}
      />
      <StatCard
        icon={ShoppingCart}
        label="Total Orders"
        value={stats?.orders || 0}
        meta="Active"
        trend={`${stats?.pending || 0} Pending`}
        accent={{ bg: 'bg-blue-50', text: 'text-blue-600', shadow: 'hover:shadow-blue-500/5' }}
      />
      <StatCard
        icon={Users}
        label="Customers"
        value={stats?.customers || 0}
        meta="Registered"
        trend="Community"
        accent={{ bg: 'bg-purple-50', text: 'text-purple-600', shadow: 'hover:shadow-purple-500/5' }}
      />
      <StatCard
        icon={Package}
        label="Products"
        value={stats?.products || 0}
        meta="In Catalog"
        trend="Available"
        accent={{ bg: 'bg-orange-50', text: 'text-orange-600', shadow: 'hover:shadow-orange-500/5' }}
      />
    </div>
  );
};

const OrdersManagement = () => {
  const { t } = useLanguage();
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
    queryClient.invalidateQueries({ queryKey: ['admin-pending-orders-count'] });
  };

  const statusStyle = (s: string) => {
    switch (s) {
      case 'completed': return 'bg-primary/10 text-primary';
      case 'processing': return 'bg-blue-50 text-blue-600';
      case 'cancelled': return 'bg-red-50 text-red-600';
      default: return 'bg-orange-50 text-orange-600';
    }
  };

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 lg:p-8 space-y-4">
      {orders?.map(order => (
        <div key={order.id} className="border border-slate-100 rounded-2xl p-5 hover:border-primary/20 transition-all">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                {(order.customer_name || 'NA').slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{order.customer_name || 'N/A'}</p>
                <p className="text-xs text-slate-400 truncate">{order.phone} · {new Date(order.created_at).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`hidden sm:inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusStyle(order.status)}`}>
                {order.status}
              </span>
              <Select value={order.status} onValueChange={v => updateStatus(order.id, v)}>
                <SelectTrigger className="w-32 h-9 rounded-xl text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">{t('pending')}</SelectItem>
                  <SelectItem value="processing">{t('processing')}</SelectItem>
                  <SelectItem value="completed">{t('completed')}</SelectItem>
                  <SelectItem value="cancelled">{t('cancelled')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="text-xs space-y-1 pl-1">
            {(order.order_items as any[])?.map((item: any) => (
              <div key={item.id} className="flex justify-between text-slate-600">
                <span>{item.product_name} × {item.quantity}</span>
                <span className="font-medium text-slate-700">Rs. {(item.price_at_purchase * item.quantity).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-100 mt-3 pt-3 flex justify-between text-sm font-bold">
            <span className="text-slate-700">{t('total')}</span>
            <span className="text-primary">Rs. {order.total_price.toLocaleString()}</span>
          </div>
          {order.address && <p className="text-xs text-slate-400 mt-2">📍 {order.address}</p>}
        </div>
      ))}
      {(!orders || orders.length === 0) && (
        <p className="text-center text-slate-400 py-12">No orders yet</p>
      )}
    </div>
  );
};

const CategoriesManagement = () => {
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
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row gap-2 mb-6">
        <Input placeholder="Category name (EN)" value={name} onChange={e => setName(e.target.value)} className="flex-1 rounded-xl h-11" />
        <Input placeholder="اردو نام" value={nameUr} onChange={e => setNameUr(e.target.value)} className="flex-1 font-urdu text-right rounded-xl h-11" dir="rtl" />
        <Button onClick={addCategory} className="rounded-xl h-11"><Plus size={16} /> Add</Button>
      </div>
      <div className="space-y-2">
        {categories?.map(c => (
          <div key={c.id} className="border border-slate-100 rounded-2xl p-4 flex items-center justify-between hover:border-primary/20 transition-all">
            <div>
              <span className="font-semibold text-slate-800">{c.name}</span>
              {c.name_ur && <span className="text-slate-400 ml-3 font-urdu">{c.name_ur}</span>}
            </div>
            <Button size="icon" variant="ghost" className="text-destructive rounded-xl" onClick={() => deleteCategory(c.id)}>
              <Trash2 size={16} />
            </Button>
          </div>
        ))}
        {(!categories || categories.length === 0) && (
          <p className="text-center text-slate-400 py-12">No categories yet</p>
        )}
      </div>
    </div>
  );
};

export default Admin;
