import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Sparkles, Upload, Loader2, Save, Trash2, ImagePlus, AlertCircle } from 'lucide-react';

type Status = 'pending' | 'uploading' | 'analyzing' | 'ready' | 'review' | 'error' | 'saved';

interface DraftProduct {
  id: string;
  file: File;
  previewUrl: string;
  storageUrl?: string;
  status: Status;
  errorMsg?: string;
  name: string;
  description: string;
  price: number;
  category_id: string;
  brand: string;
  tags: string;
}

const newId = () => Math.random().toString(36).slice(2, 10);

const BulkImageUpload = () => {
  const qc = useQueryClient();
  const [drafts, setDrafts] = useState<DraftProduct[]>([]);
  const [processing, setProcessing] = useState(false);
  const [savingAll, setSavingAll] = useState(false);

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
      category_id: '',
      brand: '',
      tags: '',
    }));
    setDrafts(prev => [...prev, ...newDrafts]);
    await processDrafts(newDrafts);
  };

  const updateDraft = (id: string, patch: Partial<DraftProduct>) => {
    setDrafts(prev => prev.map(d => (d.id === id ? { ...d, ...patch } : d)));
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
        const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path);
        const storageUrl = urlData.publicUrl;
        updateDraft(item.id, { storageUrl, status: 'analyzing' });

        const { data, error } = await supabase.functions.invoke('ai-product-analyze', {
          body: { imageUrl: storageUrl, action: 'analyze' },
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
      } catch (e: any) {
        console.error('Bulk analyze error', e);
        updateDraft(item.id, { status: 'error', errorMsg: e?.message || 'Failed to analyze' });
      }
    }
    setProcessing(false);
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
      const row = {
        name: d.name.trim(),
        description: d.description || null,
        price: Number(d.price) || 0,
        image_url: d.storageUrl,
        category_id: d.category_id || null,
        brand: d.brand || null,
        tags: d.tags ? d.tags.split(',').map(s => s.trim()).filter(Boolean) : [],
        in_stock: true,
      };
      const { error } = await supabase.from('products').insert(row as any);
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
              Upload many product photos at once. AI reads each label and fills the form automatically.
            </p>
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
        <div className="flex items-center justify-between bg-card border rounded-xl p-4">
          <div className="text-sm">
            <span className="font-semibold">{readyToSave}</span> ready to save
            {drafts.filter(d => d.status === 'review').length > 0 && (
              <span className="text-amber-600 ml-2">
                ({drafts.filter(d => d.status === 'review').length} need review)
              </span>
            )}
          </div>
          <div className="flex gap-2">
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
            <div className="relative aspect-square bg-muted">
              <img src={d.previewUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
              <button
                onClick={() => removeDraft(d.id)}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                title="Remove"
              >
                <Trash2 size={14} />
              </button>
              <div className="absolute top-2 left-2">
                <StatusBadge status={d.status} />
              </div>
            </div>
            <div className="p-3 space-y-2 flex-1">
              {(d.status === 'uploading' || d.status === 'analyzing') ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                  <Loader2 size={16} className="animate-spin" />
                  {d.status === 'uploading' ? 'Uploading image…' : 'AI reading photo…'}
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
    ready: { label: 'Ready', cls: 'bg-emerald-100 text-emerald-700' },
    review: { label: 'Needs Review', cls: 'bg-amber-100 text-amber-700' },
    error: { label: 'Error', cls: 'bg-red-100 text-red-700' },
    saved: { label: 'Saved ✓', cls: 'bg-emerald-600 text-white' },
  };
  const s = map[status];
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>;
};

export default BulkImageUpload;
