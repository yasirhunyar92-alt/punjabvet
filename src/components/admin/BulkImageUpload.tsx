import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Sparkles, Upload, Loader2, Save, Trash2, ImagePlus, AlertCircle, Wand2, Star, RotateCw } from 'lucide-react';

type Status = 'pending' | 'uploading' | 'analyzing' | 'removing-bg' | 'ready' | 'review' | 'error' | 'saved';

interface DraftProduct {
  id: string;
  file: File;
  previewUrl: string;
  originalUrl?: string;
  storageUrl?: string;
  bgRemoved?: boolean;
  status: Status;
  errorMsg?: string;
  name: string;
  description: string;
  price: number;
  discount_price: number;
  stock_quantity: number;
  category_id: string;
  brand: string;
  tags: string;
  featured: boolean;
}

const newId = () => Math.random().toString(36).slice(2, 10);

// Convert data URL to File and upload to storage, returns public URL
async function uploadDataUrl(dataUrl: string, id: string): Promise<string> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const path = `bulk/bg-${Date.now()}-${id}.png`;
  const { error } = await supabase.storage.from('product-images').upload(path, blob, { contentType: 'image/png' });
  if (error) throw error;
  return supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl;
}

const BulkImageUpload = () => {
  const qc = useQueryClient();
  const [drafts, setDrafts] = useState<DraftProduct[]>([]);
  const [processing, setProcessing] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [autoRemoveBg, setAutoRemoveBg] = useState(true);
  const [bulkBgRunning, setBulkBgRunning] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('*').order('name');
      return data || [];
    },
  });

  const findCategoryId = (catName: string) => {
    if (!catName || !categories?.length) return '';
    const lower = catName.toLowerCase();
    const match = categories.find(c =>
      c.name?.toLowerCase() === lower ||
      c.name?.toLowerCase().includes(lower) ||
      lower.includes(c.name?.toLowerCase() || ''),
    );
    return match?.id || '';
  };

  const updateDraft = (id: string, patch: Partial<DraftProduct>) => {
    setDrafts(prev => prev.map(d => (d.id === id ? { ...d, ...patch } : d)));
  };

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files?.length) return;
    const newDrafts: DraftProduct[] = Array.from(files).map(f => ({
      id: newId(),
      file: f,
      previewUrl: URL.createObjectURL(f),
      status: 'pending',
      name: '',
      description: '',
      price: 0,
      discount_price: 0,
      stock_quantity: 0,
      category_id: '',
      brand: '',
      tags: '',
      featured: false,
    }));
    setDrafts(prev => [...prev, ...newDrafts]);
    await processDrafts(newDrafts);
  };

  const removeBackground = async (item: DraftProduct, sourceUrl: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-product-analyze', {
        body: { imageUrl: sourceUrl, action: 'remove-bg' },
      });
      if (error) throw error;
      const editedDataUrl = data?.editedImage;
      if (!editedDataUrl) throw new Error('No image returned');
      const publicUrl = await uploadDataUrl(editedDataUrl, item.id);
      return publicUrl;
    } catch (e: any) {
      console.error('BG removal failed', e);
      return null;
    }
  };

  const processDrafts = async (items: DraftProduct[]) => {
    setProcessing(true);
    for (const item of items) {
      try {
        updateDraft(item.id, { status: 'uploading' });
        const ext = item.file.name.split('.').pop() || 'jpg';
        const path = `bulk/${Date.now()}-${item.id}.${ext}`;
        const { error: upErr } = await supabase.storage.from('product-images').upload(path, item.file);
        if (upErr) throw upErr;
        const originalUrl = supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl;
        updateDraft(item.id, { originalUrl, storageUrl: originalUrl, status: 'analyzing' });

        const { data, error } = await supabase.functions.invoke('ai-product-analyze', {
          body: { imageUrl: originalUrl, action: 'analyze' },
        });
        if (error) throw error;
        const info = data?.productInfo || {};
        const hasName = !!info.name?.trim();
        updateDraft(item.id, {
          name: info.name || '',
          description: info.description || '',
          price: Number(info.price) || 0,
          brand: info.brand || '',
          tags: Array.isArray(info.tags) ? info.tags.join(', ') : '',
          category_id: findCategoryId((info.tags?.[0]) || info.brand || ''),
          status: hasName ? 'ready' : 'review',
          errorMsg: hasName ? undefined : 'AI could not read clearly — please fill manually',
        });

        if (autoRemoveBg) {
          updateDraft(item.id, { status: 'removing-bg' });
          const cleaned = await removeBackground(item, originalUrl);
          if (cleaned) {
            updateDraft(item.id, { storageUrl: cleaned, previewUrl: cleaned, bgRemoved: true, status: hasName ? 'ready' : 'review' });
          } else {
            updateDraft(item.id, { status: hasName ? 'ready' : 'review' });
          }
        }
      } catch (e: any) {
        console.error('Bulk analyze error', e);
        updateDraft(item.id, { status: 'error', errorMsg: e?.message || 'Failed to analyze' });
      }
    }
    setProcessing(false);
  };

  const handleSingleBgRemove = async (id: string) => {
    const d = drafts.find(x => x.id === id);
    if (!d?.originalUrl) return;
    updateDraft(id, { status: 'removing-bg' });
    const cleaned = await removeBackground(d, d.originalUrl);
    if (cleaned) {
      updateDraft(id, { storageUrl: cleaned, previewUrl: cleaned, bgRemoved: true, status: 'ready' });
      toast.success('Background removed');
    } else {
      updateDraft(id, { status: 'ready' });
      toast.error('Could not remove background');
    }
  };

  const handleBulkBgRemove = async () => {
    const targets = drafts.filter(d => !d.bgRemoved && d.originalUrl && (d.status === 'ready' || d.status === 'review'));
    if (!targets.length) { toast.info('Nothing to clean'); return; }
    setBulkBgRunning(true);
    let ok = 0;
    for (const d of targets) {
      updateDraft(d.id, { status: 'removing-bg' });
      const cleaned = await removeBackground(d, d.originalUrl!);
      if (cleaned) {
        updateDraft(d.id, { storageUrl: cleaned, previewUrl: cleaned, bgRemoved: true, status: d.name ? 'ready' : 'review' });
        ok++;
      } else {
        updateDraft(d.id, { status: d.name ? 'ready' : 'review' });
      }
    }
    setBulkBgRunning(false);
    toast.success(`Cleaned ${ok}/${targets.length} images`);
  };

  const removeDraft = (id: string) => setDrafts(prev => prev.filter(d => d.id !== id));

  const saveAll = async () => {
    const toSave = drafts.filter(d => d.status !== 'saved' && d.status !== 'error' && d.name.trim() && d.storageUrl);
    if (!toSave.length) {
      toast.error('No valid products to save. Each must have a name and uploaded image.');
      return;
    }
    setSavingAll(true);
    let ok = 0, fail = 0;
    for (const d of toSave) {
      const row: any = {
        name: d.name.trim(),
        description: d.description || null,
        price: Number(d.price) || 0,
        discount_price: d.discount_price > 0 ? Number(d.discount_price) : null,
        stock_quantity: Number(d.stock_quantity) || 0,
        image_url: d.storageUrl,
        category_id: d.category_id || null,
        brand: d.brand || null,
        tags: d.tags ? d.tags.split(',').map(s => s.trim()).filter(Boolean) : [],
        featured: !!d.featured,
        in_stock: true,
      };
      const { error } = await supabase.from('products').insert(row);
      if (error) { fail++; updateDraft(d.id, { status: 'error', errorMsg: error.message }); }
      else { ok++; updateDraft(d.id, { status: 'saved' }); }
    }
    setSavingAll(false);
    qc.invalidateQueries({ queryKey: ['products'] });
    if (ok) toast.success(`Saved ${ok} product${ok > 1 ? 's' : ''}${fail ? ` (${fail} failed)` : ''}`);
    if (!ok && fail) toast.error(`Failed to save ${fail} products`);
  };

  const totalCount = drafts.length;
  const doneCount = drafts.filter(d => ['ready', 'review', 'error', 'saved'].includes(d.status)).length;
  const progress = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;
  const readyToSave = drafts.filter(d => d.status === 'ready' || d.status === 'review').length;

  return (
    <div className="space-y-6">
      <div className="bg-card border rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Sparkles size={18} className="text-primary" /> AI Bulk Product Upload
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Upload many product photos. AI reads each label, fills the form, and optionally removes backgrounds.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch id="auto-bg" checked={autoRemoveBg} onCheckedChange={setAutoRemoveBg} disabled={processing} />
              <Label htmlFor="auto-bg" className="text-sm cursor-pointer flex items-center gap-1">
                <Wand2 size={14} /> Auto-remove BG
              </Label>
            </div>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={e => { handleFilesSelected(e.target.files); e.currentTarget.value = ''; }}
                disabled={processing || savingAll}
              />
              <Button asChild disabled={processing || savingAll}>
                <span className="cursor-pointer"><ImagePlus size={16} className="mr-2" /> Select Photos</span>
              </Button>
            </label>
          </div>
        </div>

        {totalCount > 0 && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>{processing ? 'AI scanning photos…' : `${doneCount}/${totalCount} processed`}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </div>

      {drafts.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-card border rounded-xl p-4">
          <div className="text-sm">
            <span className="font-semibold">{readyToSave}</span> ready to save
            {drafts.filter(d => d.status === 'review').length > 0 && (
              <span className="text-amber-600 ml-2">
                ({drafts.filter(d => d.status === 'review').length} need review)
              </span>
            )}
            <span className="text-muted-foreground ml-2">· {drafts.filter(d => d.bgRemoved).length} BG-cleaned</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={handleBulkBgRemove} disabled={bulkBgRunning || processing || savingAll}>
              {bulkBgRunning ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Wand2 size={14} className="mr-2" />}
              Remove BG (all)
            </Button>
            <Button variant="outline" size="sm" onClick={() => setDrafts([])} disabled={savingAll || processing}>
              Clear All
            </Button>
            <Button onClick={saveAll} disabled={savingAll || processing || readyToSave === 0}>
              {savingAll ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Save size={16} className="mr-2" />}
              Save All Products
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {drafts.map(d => (
          <div key={d.id} className="bg-card border rounded-xl overflow-hidden flex flex-col">
            <div className="relative aspect-square bg-[conic-gradient(at_50%_50%,#f3f4f6_0deg,#fff_90deg,#f3f4f6_180deg,#fff_270deg)]">
              <img src={d.previewUrl} alt="" className="w-full h-full object-contain" loading="lazy" />
              <button
                onClick={() => removeDraft(d.id)}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                title="Remove"
              >
                <Trash2 size={14} />
              </button>
              <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                <StatusBadge status={d.status} />
                {d.bgRemoved && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-600 text-white">BG ✓</span>}
              </div>
              {(d.status === 'ready' || d.status === 'review') && (
                <button
                  onClick={() => handleSingleBgRemove(d.id)}
                  className="absolute bottom-2 right-2 text-[10px] font-semibold px-2 py-1 rounded-md bg-white/90 hover:bg-white border shadow-sm flex items-center gap-1"
                  title={d.bgRemoved ? 'Re-run background removal' : 'Remove background'}
                >
                  {d.bgRemoved ? <RotateCw size={11} /> : <Wand2 size={11} />}
                  {d.bgRemoved ? 'Redo BG' : 'Remove BG'}
                </button>
              )}
            </div>
            <div className="p-3 space-y-2 flex-1">
              {(d.status === 'uploading' || d.status === 'analyzing' || d.status === 'removing-bg') ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                  <Loader2 size={16} className="animate-spin" />
                  {d.status === 'uploading' ? 'Uploading image…' :
                   d.status === 'analyzing' ? 'AI reading photo…' :
                   'Removing background…'}
                </div>
              ) : (
                <>
                  {d.errorMsg && (
                    <div className="text-xs text-amber-600 flex items-start gap-1.5 bg-amber-50 dark:bg-amber-950/30 rounded p-2">
                      <AlertCircle size={12} className="mt-0.5 flex-shrink-0" />
                      <span>{d.errorMsg}</span>
                    </div>
                  )}
                  <Input
                    placeholder="Product name *"
                    value={d.name}
                    onChange={e => updateDraft(d.id, { name: e.target.value })}
                    className="text-sm"
                    disabled={d.status === 'saved'}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Price"
                      type="number"
                      value={d.price || ''}
                      onChange={e => updateDraft(d.id, { price: Number(e.target.value) || 0 })}
                      className="text-sm"
                      disabled={d.status === 'saved'}
                    />
                    <Input
                      placeholder="Discount price"
                      type="number"
                      value={d.discount_price || ''}
                      onChange={e => updateDraft(d.id, { discount_price: Number(e.target.value) || 0 })}
                      className="text-sm"
                      disabled={d.status === 'saved'}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Stock qty"
                      type="number"
                      value={d.stock_quantity || ''}
                      onChange={e => updateDraft(d.id, { stock_quantity: Number(e.target.value) || 0 })}
                      className="text-sm"
                      disabled={d.status === 'saved'}
                    />
                    <select
                      value={d.category_id}
                      onChange={e => updateDraft(d.id, { category_id: e.target.value })}
                      className="text-sm h-9 rounded-md border bg-background px-2"
                      disabled={d.status === 'saved'}
                    >
                      <option value="">Category</option>
                      {categories?.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <Input
                    placeholder="Brand"
                    value={d.brand}
                    onChange={e => updateDraft(d.id, { brand: e.target.value })}
                    className="text-sm"
                    disabled={d.status === 'saved'}
                  />
                  <Textarea
                    placeholder="Description"
                    value={d.description}
                    onChange={e => updateDraft(d.id, { description: e.target.value })}
                    className="text-sm min-h-[60px]"
                    disabled={d.status === 'saved'}
                  />
                  <Input
                    placeholder="Tags (comma separated)"
                    value={d.tags}
                    onChange={e => updateDraft(d.id, { tags: e.target.value })}
                    className="text-sm"
                    disabled={d.status === 'saved'}
                  />
                  <label className="flex items-center gap-2 text-xs cursor-pointer select-none pt-1">
                    <input
                      type="checkbox"
                      checked={d.featured}
                      onChange={e => updateDraft(d.id, { featured: e.target.checked })}
                      disabled={d.status === 'saved'}
                      className="accent-primary"
                    />
                    <Star size={12} className={d.featured ? 'fill-amber-400 text-amber-400' : ''} />
                    Mark as Featured
                  </label>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {drafts.length === 0 && (
        <div className="text-center py-16 border-2 border-dashed rounded-xl text-muted-foreground">
          <Upload size={32} className="mx-auto mb-3 opacity-50" />
          <p className="text-sm">Select multiple product photos to start. AI will scan each one automatically.</p>
          <p className="text-xs mt-1 opacity-80">Tip: keep "Auto-remove BG" on for studio-ready images.</p>
        </div>
      )}
    </div>
  );
};

const StatusBadge = ({ status }: { status: Status }) => {
  const map: Record<Status, { label: string; cls: string }> = {
    pending: { label: 'Queued', cls: 'bg-slate-200 text-slate-700' },
    uploading: { label: 'Uploading', cls: 'bg-blue-100 text-blue-700' },
    analyzing: { label: 'AI Scanning', cls: 'bg-purple-100 text-purple-700' },
    'removing-bg': { label: 'Removing BG', cls: 'bg-fuchsia-100 text-fuchsia-700' },
    ready: { label: 'Ready', cls: 'bg-emerald-100 text-emerald-700' },
    review: { label: 'Needs Review', cls: 'bg-amber-100 text-amber-700' },
    error: { label: 'Error', cls: 'bg-red-100 text-red-700' },
    saved: { label: 'Saved ✓', cls: 'bg-emerald-600 text-white' },
  };
  const s = map[status];
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>;
};

export default BulkImageUpload;
