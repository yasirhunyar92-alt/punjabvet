import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, ChevronDown, Loader2 } from 'lucide-react';
import MultiImageUpload from './MultiImageUpload';
import TagInput from './TagInput';

const ANIMAL_TYPES = ['Cow', 'Buffalo', 'Goat', 'Sheep', 'Poultry', 'Horse', 'Dog', 'Cat'];

interface ProductForm {
  name: string; name_ur: string; description: string; description_ur: string;
  price: string; discount_price: string; category_id: string; featured: boolean;
  in_stock: boolean; image_url: string; images: string[]; tags: string[];
  volume_size: string; stock_quantity: string; animal_type: string[];
  brand: string; sku: string; expiry_date: string; batch_number: string;
  usage_instructions: string; usage_instructions_ur: string;
}

const emptyForm: ProductForm = {
  name: '', name_ur: '', description: '', description_ur: '', price: '', discount_price: '',
  category_id: '', featured: false, in_stock: true, image_url: '', images: [], tags: [],
  volume_size: '', stock_quantity: '0', animal_type: [], brand: '', sku: '', expiry_date: '',
  batch_number: '', usage_instructions: '', usage_instructions_ur: '',
};

const ProductsManagement = () => {
  const { t, isUrdu } = useLanguage();
  const fontClass = isUrdu ? 'font-urdu' : '';
  const queryClient = useQueryClient();
  const [editProduct, setEditProduct] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [form, setForm] = useState<ProductForm>({ ...emptyForm });

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
    setForm({ ...emptyForm });
    setMoreOpen(false);
    setDialogOpen(true);
  };

  const openEdit = (p: any) => {
    setEditProduct(p);
    setForm({
      name: p.name, name_ur: p.name_ur || '', description: p.description || '',
      description_ur: p.description_ur || '', price: String(p.price),
      discount_price: p.discount_price ? String(p.discount_price) : '',
      category_id: p.category_id || '', featured: p.featured ?? false,
      in_stock: p.in_stock ?? true, image_url: p.image_url || '',
      images: p.images || [], tags: p.tags || [], volume_size: p.volume_size || '',
      stock_quantity: String(p.stock_quantity || 0), animal_type: p.animal_type || [],
      brand: p.brand || '', sku: p.sku || '', expiry_date: p.expiry_date || '',
      batch_number: p.batch_number || '', usage_instructions: p.usage_instructions || '',
      usage_instructions_ur: p.usage_instructions_ur || '',
    });
    setMoreOpen(false);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.price) { toast.error('Name and price are required'); return; }
    const payload = {
      name: form.name, name_ur: form.name_ur || null,
      description: form.description || null, description_ur: form.description_ur || null,
      price: Number(form.price), discount_price: form.discount_price ? Number(form.discount_price) : null,
      category_id: form.category_id || null, featured: form.featured, in_stock: form.in_stock,
      image_url: form.image_url || null, images: form.images, tags: form.tags,
      volume_size: form.volume_size || null, stock_quantity: Number(form.stock_quantity) || 0,
      animal_type: form.animal_type, brand: form.brand || null, sku: form.sku || null,
      expiry_date: form.expiry_date || null, batch_number: form.batch_number || null,
      usage_instructions: form.usage_instructions || null,
      usage_instructions_ur: form.usage_instructions_ur || null,
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

  const f = (field: keyof ProductForm, value: any) => setForm(prev => ({ ...prev, [field]: value }));

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
              <p className="text-xs text-muted-foreground">
                Rs. {p.price}
                {p.discount_price && <span className="text-destructive ml-1">→ Rs. {p.discount_price}</span>}
                {' · '}{(p.categories as any)?.name || 'No category'}
                {' · Qty: '}{p.stock_quantity || 0}
              </p>
              {p.tags && p.tags.length > 0 && (
                <div className="flex gap-1 mt-0.5 flex-wrap">
                  {p.tags.slice(0, 3).map((tag: string) => (
                    <span key={tag} className="text-[9px] bg-accent text-accent-foreground px-1.5 py-0.5 rounded">{tag}</span>
                  ))}
                  {p.tags.length > 3 && <span className="text-[9px] text-muted-foreground">+{p.tags.length - 3}</span>}
                </div>
              )}
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
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
          <DialogHeader>
            <DialogTitle className={fontClass}>{editProduct ? t('editProduct') : t('addProduct')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Name (EN)</Label><Input value={form.name} onChange={e => f('name', e.target.value)} /></div>
              <div><Label>Name (Urdu)</Label><Input value={form.name_ur} onChange={e => f('name_ur', e.target.value)} className="font-urdu text-right" dir="rtl" /></div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div><Label>{t('productPrice')} (Rs.)</Label><Input type="number" value={form.price} onChange={e => f('price', e.target.value)} /></div>
              <div><Label>{t('discountPrice')} (Rs.)</Label><Input type="number" value={form.discount_price} onChange={e => f('discount_price', e.target.value)} placeholder="Optional" /></div>
              <div><Label>{t('stockQuantity')}</Label><Input type="number" value={form.stock_quantity} onChange={e => f('stock_quantity', e.target.value)} /></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t('category')}</Label>
                <Select value={form.category_id} onValueChange={v => f('category_id', v)}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{t('volumeSize')}</Label>
                <Input value={form.volume_size} onChange={e => f('volume_size', e.target.value)} placeholder="e.g. 100ml, 500g" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div><Label>Description (EN)</Label><Textarea value={form.description} onChange={e => f('description', e.target.value)} rows={3} /></div>
              <div><Label>Description (Urdu)</Label><Textarea value={form.description_ur} onChange={e => f('description_ur', e.target.value)} className="font-urdu text-right" dir="rtl" rows={3} /></div>
            </div>

            {/* Tags */}
            <TagInput label={t('tags')} value={form.tags} onChange={v => f('tags', v)} />

            {/* Animal Types */}
            <div>
              <Label>{t('animalType')}</Label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {ANIMAL_TYPES.map(animal => (
                  <button key={animal} type="button" onClick={() => {
                    f('animal_type', form.animal_type.includes(animal) ? form.animal_type.filter(a => a !== animal) : [...form.animal_type, animal]);
                  }} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${form.animal_type.includes(animal) ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground hover:border-primary'}`}>
                    {animal}
                  </button>
                ))}
              </div>
            </div>

            {/* Images */}
            <MultiImageUpload mainImage={form.image_url} images={form.images}
              onMainImageChange={url => f('image_url', url)}
              onImagesChange={urls => f('images', urls)} />

            {/* Toggles */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2"><Switch checked={form.featured} onCheckedChange={v => f('featured', v)} /><Label>{t('featured')}</Label></div>
              <div className="flex items-center gap-2"><Switch checked={form.in_stock} onCheckedChange={v => f('in_stock', v)} /><Label>{t('inStock')}</Label></div>
            </div>

            {/* More Options */}
            <Collapsible open={moreOpen} onOpenChange={setMoreOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between text-muted-foreground">
                  {t('moreOptions')} <ChevronDown size={14} className={`transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>{t('brand')}</Label><Input value={form.brand} onChange={e => f('brand', e.target.value)} /></div>
                  <div><Label>{t('sku')}</Label><Input value={form.sku} onChange={e => f('sku', e.target.value)} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>{t('expiryDate')}</Label><Input type="date" value={form.expiry_date} onChange={e => f('expiry_date', e.target.value)} /></div>
                  <div><Label>{t('batchNumber')}</Label><Input value={form.batch_number} onChange={e => f('batch_number', e.target.value)} /></div>
                </div>
                <div><Label>{t('usageInstructions')} (EN)</Label><Textarea value={form.usage_instructions} onChange={e => f('usage_instructions', e.target.value)} rows={2} /></div>
                <div><Label>{t('usageInstructions')} (Urdu)</Label><Textarea value={form.usage_instructions_ur} onChange={e => f('usage_instructions_ur', e.target.value)} className="font-urdu text-right" dir="rtl" rows={2} /></div>
              </CollapsibleContent>
            </Collapsible>

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
