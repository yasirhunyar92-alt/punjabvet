import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Phone, MapPin, ShoppingBag, X, User } from 'lucide-react';

type Profile = {
  id: string;
  name: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
};

type OrderSummary = {
  id: string;
  total_price: number;
  status: string;
  created_at: string;
  user_id: string;
};

const CustomersManagement = () => {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Profile | null>(null);

  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['admin-customers'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, name, phone, address, created_at')
        .order('created_at', { ascending: false });
      return (data || []) as Profile[];
    },
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['admin-customers-orders'],
    queryFn: async () => {
      const { data } = await supabase
        .from('orders')
        .select('id, total_price, status, created_at, user_id');
      return (data || []) as OrderSummary[];
    },
  });

  const orderStatsByUser = useMemo(() => {
    const map = new Map<string, { count: number; total: number; last?: string }>();
    for (const o of orders) {
      const cur = map.get(o.user_id) || { count: 0, total: 0 };
      cur.count += 1;
      cur.total += Number(o.total_price) || 0;
      if (!cur.last || o.created_at > cur.last) cur.last = o.created_at;
      map.set(o.user_id, cur);
    }
    return map;
  }, [orders]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter(p =>
      (p.name || '').toLowerCase().includes(q) ||
      (p.phone || '').toLowerCase().includes(q) ||
      (p.address || '').toLowerCase().includes(q)
    );
  }, [profiles, search]);

  const selectedOrders = useMemo(
    () => selected ? orders.filter(o => o.user_id === selected.id).sort((a, b) => b.created_at.localeCompare(a.created_at)) : [],
    [orders, selected]
  );

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input placeholder="Search by name, email, phone or address..." value={search}
            onChange={e => setSearch(e.target.value)} className="pl-10 rounded-xl h-11" />
        </div>
        <div className="text-xs text-slate-500 flex items-center gap-2 px-3">
          <User className="w-3.5 h-3.5" /> {filtered.length} of {profiles.length} customer{profiles.length === 1 ? '' : 's'}
        </div>
      </div>

      {isLoading ? (
        <p className="text-center text-slate-400 py-12">Loading customers...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-slate-400 py-12">No customers found</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map(p => {
            const s = orderStatsByUser.get(p.id);
            return (
              <button key={p.id} onClick={() => setSelected(p)}
                className="text-left border border-slate-100 rounded-2xl p-4 hover:border-primary/30 hover:shadow-md transition-all bg-white">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                    {(p.name || p.email || 'NA').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-slate-900 truncate">{p.name || 'Unnamed'}</p>
                    <p className="text-xs text-slate-500 truncate">{p.email || '—'}</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-slate-50 rounded-lg px-2 py-1.5">
                    <p className="text-slate-400 uppercase tracking-wider text-[9px] font-semibold">Orders</p>
                    <p className="font-bold text-slate-800">{s?.count || 0}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg px-2 py-1.5">
                    <p className="text-slate-400 uppercase tracking-wider text-[9px] font-semibold">Spent</p>
                    <p className="font-bold text-primary">Rs. {(s?.total || 0).toLocaleString()}</p>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">Joined {new Date(p.created_at).toLocaleDateString()}</p>
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                  {(selected.name || selected.email || 'NA').slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 truncate">{selected.name || 'Unnamed customer'}</h3>
                  <p className="text-xs text-slate-500">Joined {new Date(selected.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-700 shrink-0"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-3">
              <InfoRow icon={Mail} label="Email" value={selected.email} />
              <InfoRow icon={Phone} label="Phone" value={selected.phone} />
              <InfoRow icon={MapPin} label="Address" value={selected.address} />

              <div className="pt-3 border-t border-slate-100">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <ShoppingBag className="w-3 h-3" /> Order history ({selectedOrders.length})
                </p>
                {selectedOrders.length === 0 ? (
                  <p className="text-sm text-slate-400 py-3 text-center">No orders yet</p>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedOrders.map(o => (
                      <div key={o.id} className="border border-slate-100 rounded-xl p-3 flex items-center justify-between text-xs">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 truncate">#{o.id.slice(0, 8)}</p>
                          <p className="text-slate-400">{new Date(o.created_at).toLocaleString()}</p>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <p className="font-bold text-primary">Rs. {Number(o.total_price).toLocaleString()}</p>
                          <p className="text-[10px] uppercase tracking-wider text-slate-500">{o.status?.replace('_', ' ')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex gap-2">
              {selected.phone && (
                <a href={`https://wa.me/${selected.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="flex-1">
                  <Button variant="outline" className="w-full rounded-xl">WhatsApp</Button>
                </a>
              )}
              {selected.email && (
                <a href={`mailto:${selected.email}`} className="flex-1">
                  <Button variant="outline" className="w-full rounded-xl">Email</Button>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | null }) => (
  <div className="flex items-start gap-3 text-sm">
    <Icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{label}</p>
      <p className="text-slate-800 break-words">{value || '—'}</p>
    </div>
  </div>
);

export default CustomersManagement;
