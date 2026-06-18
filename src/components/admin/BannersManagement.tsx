import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import ImageUpload from './ImageUpload';
import { Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';

const empty = {
  title: '', title_ur: '', subtitle: '', subtitle_ur: '',
  image_url: '', link_url: '', cta_text: '', banner_type: 'hero',
  countdown_to: '', sort_order: 0, active: true,
};

const BannersManagement = () => {
  const qc = useQueryClient();
  const [form, setForm] = useState<any>(empty);
  const [editing, setEditing] = useState<string | null>(null);

  const { data: banners } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: async () => {
      const { data } = await supabase.from('banners').select('*').order('sort_order');
      return data || [];
    },
  });

  const save = async () => {
    if (!form.title.trim()) return toast.error('Title required');
    const payload: any = {
      title: form.title.trim(),
      title_ur: form.title_ur || null,
      subtitle: form.subtitle || null,
      subtitle_ur: form.subtitle_ur || null,
      image_url: form.image_url || null,
      link_url: form.link_url || null,
      cta_text: form.cta_text || null,
      banner_type: form.banner_type,
      countdown_to: form.countdown_to || null,
      sort_order: Number(form.sort_order) || 0,
      active: form.active,
    };
    const { error } = editing
      ? await supabase.from('banners').update(payload).eq('id', editing)
      : await supabase.from('banners').insert(payload);
    if (error) return toast.error(error.message);
    toast.success(editing ? 'Updated' : 'Created');
    setForm(empty); setEditing(null);
    qc.invalidateQueries({ queryKey: ['admin-banners'] });
    qc.invalidateQueries({ queryKey: ['active-banners'] });
  };

  const remove = async (id: string) => {
    if (!confirm('Delete banner?')) return;
    await supabase.from('banners').delete().eq('id', id);
    qc.invalidateQueries({ queryKey: ['admin-banners'] });
    qc.invalidateQueries({ queryKey: ['active-banners'] });
  };

  const edit = (b: any) => {
    setEditing(b.id);
    setForm({
      title: b.title, title_ur: b.title_ur || '', subtitle: b.subtitle || '', subtitle_ur: b.subtitle_ur || '',
      image_url: b.image_url || '', link_url: b.link_url || '', cta_text: b.cta_text || '',
      banner_type: b.banner_type, countdown_to: b.countdown_to ? b.countdown_to.slice(0,16) : '',
      sort_order: b.sort_order, active: b.active,
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-card border rounded-lg p-4 space-y-3">
        <h3 className="font-semibold">{editing ? 'Edit Banner' : 'New Banner'}</h3>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Title (EN)</Label><Input value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
          <div><Label>Title (UR)</Label><Input value={form.title_ur} onChange={e => setForm({...form, title_ur: e.target.value})} className="font-urdu text-right" dir="rtl" /></div>
          <div><Label>Subtitle (EN)</Label><Input value={form.subtitle} onChange={e => setForm({...form, subtitle: e.target.value})} /></div>
          <div><Label>Subtitle (UR)</Label><Input value={form.subtitle_ur} onChange={e => setForm({...form, subtitle_ur: e.target.value})} className="font-urdu text-right" dir="rtl" /></div>
          <div><Label>Link URL</Label><Input value={form.link_url} onChange={e => setForm({...form, link_url: e.target.value})} placeholder="/products" /></div>
          <div><Label>CTA Text</Label><Input value={form.cta_text} onChange={e => setForm({...form, cta_text: e.target.value})} placeholder="Shop Now" /></div>
          <div>
            <Label>Type</Label>
            <Select value={form.banner_type} onValueChange={v => setForm({...form, banner_type: v})}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="hero">Hero</SelectItem>
                <SelectItem value="promo">Promo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Sort Order</Label><Input type="number" value={form.sort_order} onChange={e => setForm({...form, sort_order: e.target.value})} /></div>
          <div className="col-span-2"><Label>Countdown To</Label><Input type="datetime-local" value={form.countdown_to} onChange={e => setForm({...form, countdown_to: e.target.value})} /></div>
          <div className="col-span-2">
            <Label>Image</Label>
            <ImageUpload value={form.image_url} onChange={(url) => setForm({...form, image_url: url})} />
          </div>
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
        {banners?.map(b => (
          <div key={b.id} className="bg-card border rounded-lg p-3 flex items-center gap-3">
            {b.image_url && <img src={b.image_url} alt={b.title} className="w-16 h-16 object-cover rounded" />}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium truncate">{b.title}</span>
                <Badge variant={b.active ? 'default' : 'secondary'}>{b.active ? 'On' : 'Off'}</Badge>
                <Badge variant="outline">{b.banner_type}</Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate">{b.subtitle}</p>
            </div>
            <Button size="sm" variant="ghost" onClick={() => edit(b)}>Edit</Button>
            <Button size="icon" variant="ghost" className="text-destructive" onClick={() => remove(b.id)}><Trash2 size={14} /></Button>
          </div>
        ))}
        {(!banners || banners.length === 0) && <p className="text-center text-muted-foreground py-8 text-sm">No banners yet</p>}
      </div>
    </div>
  );
};

export default BannersManagement;
