import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import ImageUpload from './ImageUpload';

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
            
            <ImageUpload value={form.image_url} onChange={(url) => setForm({ ...form, image_url: url })} />
            
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

export default ProductsManagement;
