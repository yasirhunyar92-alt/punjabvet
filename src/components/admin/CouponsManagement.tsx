import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';

const empty = {
  code: '', description: '', discount_type: 'percent', discount_value: 10,
  min_order_amount: '', max_uses: '', expires_at: '', active: true,
};

const CouponsManagement = () => {
  const qc = useQueryClient();
  const [form, setForm] = useState<any>(empty);
  const [editing, setEditing] = useState<string | null>(null);

  const { data: coupons } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: async () => {
      const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
      return data || [];
    },
  });

  const save = async () => {
    if (!form.code.trim()) return toast.error('Code required');
    const payload: any = {
      code: form.code.trim().toUpperCase(),
      description: form.description || null,
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      min_order_amount: form.min_order_amount ? Number(form.min_order_amount) : null,
      max_uses: form.max_uses ? Number(form.max_uses) : null,
      expires_at: form.expires_at || null,
      active: form.active,
    };
    const { error } = editing
      ? await supabase.from('coupons').update(payload).eq('id', editing)
      : await supabase.from('coupons').insert(payload);
    if (error) return toast.error(error.message);
    toast.success(editing ? 'Updated' : 'Created');
    setForm(empty); setEditing(null);
    qc.invalidateQueries({ queryKey: ['admin-coupons'] });
  };

  const remove = async (id: string) => {
    if (!confirm('Delete coupon?')) return;
    await supabase.from('coupons').delete().eq('id', id);
    qc.invalidateQueries({ queryKey: ['admin-coupons'] });
  };

  const edit = (c: any) => {
    setEditing(c.id);
    setForm({
      code: c.code, description: c.description || '', discount_type: c.discount_type,
      discount_value: c.discount_value, min_order_amount: c.min_order_amount || '',
      max_uses: c.max_uses || '', expires_at: c.expires_at ? c.expires_at.slice(0,16) : '', active: c.active,
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-card border rounded-lg p-4 space-y-3">
        <h3 className="font-semibold">{editing ? 'Edit Coupon' : 'New Coupon'}</h3>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Code</Label><Input value={form.code} onChange={e => setForm({...form, code: e.target.value})} placeholder="EID20" /></div>
          <div><Label>Description</Label><Input value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
          <div>
            <Label>Discount Type</Label>
            <Select value={form.discount_type} onValueChange={v => setForm({...form, discount_type: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="percent">Percent (%)</SelectItem>
                <SelectItem value="fixed">Fixed (Rs.)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Value</Label><Input type="number" value={form.discount_value} onChange={e => setForm({...form, discount_value: e.target.value})} /></div>
          <div><Label>Min Order (Rs.)</Label><Input type="number" value={form.min_order_amount} onChange={e => setForm({...form, min_order_amount: e.target.value})} /></div>
          <div><Label>Max Uses</Label><Input type="number" value={form.max_uses} onChange={e => setForm({...form, max_uses: e.target.value})} /></div>
          <div className="col-span-2"><Label>Expires At</Label><Input type="datetime-local" value={form.expires_at} onChange={e => setForm({...form, expires_at: e.target.value})} /></div>
          <div className="col-span-2 flex items-center gap-2">
            <Switch checked={form.active} onCheckedChange={v => setForm({...form, active: v})} /><Label>Active</Label>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={save}><Plus size={14} /> {editing ? 'Update' : 'Create'}</Button>
          {editing && <Button variant="outline" onClick={() => { setEditing(null); setForm(empty); }}>Cancel</Button>}
        </div>
      </div>

      <div className="space-y-2">
        {coupons?.map(c => (
          <div key={c.id} className="bg-card border rounded-lg p-3 flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold font-mono">{c.code}</span>
                <Badge variant={c.active ? 'default' : 'secondary'}>{c.active ? 'Active' : 'Off'}</Badge>
                <span className="text-sm text-primary font-semibold">
                  {c.discount_type === 'percent' ? `${c.discount_value}% off` : `Rs. ${c.discount_value} off`}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {c.description && `${c.description} · `}
                Used {c.used_count}{c.max_uses ? `/${c.max_uses}` : ''}
                {c.expires_at && ` · Expires ${new Date(c.expires_at).toLocaleDateString()}`}
              </p>
            </div>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => edit(c)}>Edit</Button>
              <Button size="icon" variant="ghost" className="text-destructive" onClick={() => remove(c.id)}><Trash2 size={14} /></Button>
            </div>
          </div>
        ))}
        {(!coupons || coupons.length === 0) && <p className="text-center text-muted-foreground py-8 text-sm">No coupons yet</p>}
      </div>
    </div>
  );
};

export default CouponsManagement;
