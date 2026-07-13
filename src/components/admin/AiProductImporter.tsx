import { useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Sparkles, Link as LinkIcon, Image as ImageIcon, FileText, Type, Loader2,
  AlertTriangle, CheckCircle2, Search, Save, RefreshCw, X,
} from 'lucide-react';
import MultiImageUpload from './MultiImageUpload';
import TagInput from './TagInput';

const ANIMAL_TYPES = ['Cow', 'Buffalo', 'Goat', 'Sheep', 'Poultry', 'Horse', 'Dog', 'Cat'];

type Mode = 'name' | 'url' | 'image' | 'pdf';

interface Draft {
  name: string; name_ur: string; brand: string; manufacturer: string; generic_name: string;
  composition: string; category_id: string; category_suggested: string; category_confidence: number;
  dosage_form: string; animal_type: string[]; indications: string; benefits: string;
  usage_instructions: string; usage_instructions_ur: string; contraindications: string;
  warnings: string; storage_instructions: string; pack_size: string; volume_size: string;
  sku: string; price: string; description: string; description_ur: string;
  seo_title: string; seo_description: string; seo_keywords: string[]; tags: string[];
  images: string[]; image_search_query: string;
}

const emptyDraft: Draft = {
  name: '', name_ur: '', brand: '', manufacturer: '', generic_name: '', composition: '',
  category_id: '', category_suggested: '', category_confidence: 1, dosage_form: '',
  animal_type: [], indications: '', benefits: '', usage_instructions: '', usage_instructions_ur: '',
  contraindications: '', warnings: '', storage_instructions: '', pack_size: '', volume_size: '',
  sku: '', price: '', description: '', description_ur: '', seo_title: '', seo_description: '',
  seo_keywords: [], tags: [], images: [], image_search_query: '',
};

const fileToBase64 = (file: File): Promise<string> => new Promise((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(String(r.result).split(',')[1] || '');
  r.onerror = rej;
  r.readAsDataURL(file);
});

const genSku = (brand: string, name: string, size: string) => {
  const s = (x: string) => x.replace(/[^A-Za-z0-9]+/g, '').toUpperCase().slice(0, 8);
  return [s(brand) || 'PVMS', s(name), s(size)].filter(Boolean).join('-');
};

// Simple fuzzy match: token overlap ratio
const fuzzy = (a: string, b: string): number => {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  const at = new Set(norm(a).split(/\s+/).filter(Boolean));
  const bt = new Set(norm(b).split(/\s+/).filter(Boolean));
  if (!at.size || !bt.size) return 0;
  let hits = 0;
  at.forEach(t => { if (bt.has(t)) hits++; });
  return hits / Math.max(at.size, bt.size);
};

const AiProductImporter = () => {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<Mode>('name');
  const [nameInput, setNameInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [needsCategoryConfirm, setNeedsCategoryConfirm] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await supabase.from('categories').select('id, name')).data || [],
  });

  const { data: allProducts = [] } = useQuery({
    queryKey: ['all-products-min'],
    queryFn: async () => (await supabase.from('products').select('id, name, brand, generic_name').limit(2000)).data || [],
  });

  const searchable = useMemo(() => allProducts, [allProducts]);
  const [searchQ, setSearchQ] = useState('');
  const searchResults = useMemo(() => {
    if (!searchQ.trim()) return [];
    const q = searchQ.toLowerCase();
    return searchable.filter((p: any) =>
      p.name?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q) ||
      p.generic_name?.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [searchQ, searchable]);

  const resolveCategory = (suggested: string, confidence: number) => {
    if (!suggested) return { id: '', confidence: 0 };
    const exact = categories.find((c: any) => c.name.toLowerCase() === suggested.toLowerCase());
    if (exact) return { id: exact.id, confidence: 1 };
    let best = { id: '', score: 0 };
    categories.forEach((c: any) => {
      const s = fuzzy(c.name, suggested);
      if (s > best.score) best = { id: c.id, score: s };
    });
    return { id: best.score >= 0.5 ? best.id : '', confidence: Math.min(confidence || 0.5, best.score) };
  };

  const checkDuplicates = (name: string, brand: string) => {
    const q = `${name} ${brand}`.trim();
    return allProducts
      .map((p: any) => ({ ...p, score: fuzzy(`${p.name} ${p.brand || ''}`, q) }))
      .filter((p: any) => p.score >= 0.7)
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 3);
  };

  const runImport = async () => {
    setLoading(true);
    setProgress(15);
    setDraft(null);
    setDuplicates([]);
    const toastId = toast.loading('AI is researching this product...');
    try {
      const body: any = { existingCategories: categories.map((c: any) => c.name) };
      if (mode === 'name') {
        if (!nameInput.trim()) throw new Error('Enter a product name');
        body.productName = nameInput.trim();
      } else if (mode === 'url') {
        if (!urlInput.trim()) throw new Error('Paste a product URL');
        body.productUrl = urlInput.trim();
      } else if (mode === 'image') {
        if (!imageFile) throw new Error('Upload an image');
        body.imageBase64 = await fileToBase64(imageFile);
        body.imageMime = imageFile.type;
      } else if (mode === 'pdf') {
        if (!pdfFile) throw new Error('Upload a PDF');
        body.pdfBase64 = await fileToBase64(pdfFile);
        body.pdfName = pdfFile.name;
      }

      setProgress(45);
      const { data, error } = await supabase.functions.invoke('ai-product-generate', { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const p = data?.product || {};
      setProgress(80);

      const { id: catId, confidence } = resolveCategory(p.category, Number(p.category_confidence) || 0.8);
      const name = p.name || nameInput || 'Untitled product';
      const brand = p.brand || '';
      const packSize = p.pack_size || p.volume_size || '';

      const d: Draft = {
        name,
        name_ur: p.name_ur || '',
        brand,
        manufacturer: p.manufacturer || p.company || '',
        generic_name: p.generic_name || '',
        composition: p.composition || '',
        category_id: catId,
        category_suggested: p.category || '',
        category_confidence: confidence,
        dosage_form: p.dosage_form || '',
        animal_type: Array.isArray(p.animal_type) ? p.animal_type.filter((a: string) => ANIMAL_TYPES.includes(a)) : [],
        indications: p.indications || '',
        benefits: p.benefits || '',
        usage_instructions: p.usage_instructions || '',
        usage_instructions_ur: p.usage_instructions_ur || '',
        contraindications: p.contraindications || '',
        warnings: p.warnings || '',
        storage_instructions: p.storage_instructions || '',
        pack_size: packSize,
        volume_size: p.volume_size || packSize,
        sku: p.sku || genSku(brand, name, packSize),
        price: p.suggested_price_pkr ? String(p.suggested_price_pkr) : '',
        description: p.description || '',
        description_ur: p.description_ur || '',
        seo_title: p.seo_title || '',
        seo_description: p.seo_description || '',
        seo_keywords: Array.isArray(p.seo_keywords) ? p.seo_keywords : [],
        tags: Array.isArray(p.tags) ? p.tags : [],
        images: [],
        image_search_query: p.image_search_query || '',
      };

      setDuplicates(checkDuplicates(name, brand));
      setNeedsCategoryConfirm(!catId || confidence < 0.75);
      setDraft(d);
      setProgress(100);
      toast.success('Draft ready. Review & save.', { id: toastId });
    } catch (err: any) {
      const msg = err?.message || 'AI import failed';
      toast.error(msg.includes('402') || msg.toLowerCase().includes('credits') ? 'AI credits exhausted. Add credits in Settings.' : msg, { id: toastId });
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 800);
    }
  };

  const update = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft(prev => prev ? { ...prev, [k]: v } : prev);

  const toggleAnimal = (a: string) => {
    if (!draft) return;
    update('animal_type', draft.animal_type.includes(a) ? draft.animal_type.filter(x => x !== a) : [...draft.animal_type, a]);
  };

  const save = async () => {
    if (!draft) return;
    if (!draft.name.trim() || !draft.price) { toast.error('Name and price are required'); return; }
    if (needsCategoryConfirm && !draft.category_id) { toast.error('Please confirm a category first'); return; }
    setLoading(true);
    try {
      const payload = {
        name: draft.name, name_ur: draft.name_ur || null,
        brand: draft.brand || null, generic_name: draft.generic_name || null,
        manufacturer: draft.manufacturer || null,
        composition: draft.composition || null,
        category_id: draft.category_id || null,
        dosage_form: draft.dosage_form || null,
        animal_type: draft.animal_type,
        indications: draft.indications || null,
        benefits: draft.benefits || null,
        usage_instructions: draft.usage_instructions || null,
        usage_instructions_ur: draft.usage_instructions_ur || null,
        contraindications: draft.contraindications || null,
        warnings: draft.warnings || null,
        storage_instructions: draft.storage_instructions || null,
        volume_size: draft.volume_size || draft.pack_size || null,
        sku: draft.sku || null,
        price: Number(draft.price) || 0,
        description: draft.description || null,
        description_ur: draft.description_ur || null,
        seo_title: draft.seo_title || null,
        seo_description: draft.seo_description || null,
        seo_keywords: draft.seo_keywords,
        tags: draft.tags,
        images: draft.images,
        image_url: draft.images[0] || null,
        in_stock: true,
        featured: false,
        stock_quantity: 0,
      };

      // Only send columns that actually exist — try full payload first, fall back gracefully
      const { error } = await supabase.from('products').insert(payload as any);
      if (error) {
        // Retry with minimal known-safe columns if schema differs
        const safe: any = {
          name: payload.name, name_ur: payload.name_ur, brand: payload.brand,
          category_id: payload.category_id, description: payload.description,
          description_ur: payload.description_ur, price: payload.price,
          volume_size: payload.volume_size, tags: payload.tags,
          animal_type: payload.animal_type, usage_instructions: payload.usage_instructions,
          usage_instructions_ur: payload.usage_instructions_ur,
          in_stock: true, featured: false, stock_quantity: 0, images: payload.images,
          image_url: payload.image_url,
        };
        const { error: e2 } = await supabase.from('products').insert(safe);
        if (e2) throw e2;
        toast.warning('Saved with limited fields (some columns not in schema)');
      } else {
        toast.success(`"${draft.name}" saved`);
      }
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['all-products-min'] });
      setDraft(null);
      setNameInput(''); setUrlInput(''); setImageFile(null); setPdfFile(null);
    } catch (err: any) {
      toast.error(err.message || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header + search */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0">
            <Sparkles size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-900">AI Product Importer</h3>
            <p className="text-sm text-slate-500">Import by name, URL, image, or PDF — AI fills every field, matches your category, and lets you edit before saving.</p>
          </div>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            className="pl-9"
            placeholder="Search existing products (name, brand, generic name)..."
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
          />
          {searchResults.length > 0 && (
            <div className="mt-2 bg-white border rounded-lg divide-y max-h-56 overflow-y-auto shadow-sm">
              {searchResults.map((p: any) => (
                <div key={p.id} className="px-3 py-2 text-sm flex items-center justify-between">
                  <div className="truncate">
                    <span className="font-medium">{p.name}</span>
                    <span className="text-slate-400 text-xs ml-2">{p.brand} · {p.generic_name}</span>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">Exists</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Input mode */}
      <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)}>
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="name"><Type size={14} className="mr-1" />Name</TabsTrigger>
          <TabsTrigger value="url"><LinkIcon size={14} className="mr-1" />URL</TabsTrigger>
          <TabsTrigger value="image"><ImageIcon size={14} className="mr-1" />Image</TabsTrigger>
          <TabsTrigger value="pdf"><FileText size={14} className="mr-1" />PDF</TabsTrigger>
        </TabsList>

        <TabsContent value="name" className="mt-3">
          <Input placeholder="e.g. Selmox LA Injection 100ml" value={nameInput} onChange={e => setNameInput(e.target.value)} />
        </TabsContent>
        <TabsContent value="url" className="mt-3">
          <Input placeholder="https://manufacturer.com/product/..." value={urlInput} onChange={e => setUrlInput(e.target.value)} />
          <p className="text-xs text-slate-400 mt-1">AI uses the URL as context — public product pages work best.</p>
        </TabsContent>
        <TabsContent value="image" className="mt-3">
          <Input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} />
          {imageFile && <p className="text-xs text-slate-500 mt-1">Selected: {imageFile.name}</p>}
        </TabsContent>
        <TabsContent value="pdf" className="mt-3">
          <Input type="file" accept="application/pdf" onChange={e => setPdfFile(e.target.files?.[0] || null)} />
          {pdfFile && <p className="text-xs text-slate-500 mt-1">Selected: {pdfFile.name}</p>}
        </TabsContent>
      </Tabs>

      <div className="flex items-center gap-3">
        <Button onClick={runImport} disabled={loading} size="lg" className="gap-2">
          {loading ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
          Import Product with AI
        </Button>
        {draft && !loading && (
          <Button variant="outline" size="sm" onClick={() => setDraft(null)}><X size={14} className="mr-1" />Clear draft</Button>
        )}
      </div>

      {progress > 0 && <Progress value={progress} className="h-1.5" />}

      {/* Preview / Edit */}
      {draft && (
        <div className="bg-white border rounded-2xl p-5 space-y-5">
          {duplicates.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={16} />
              <div className="text-sm">
                <p className="font-semibold text-amber-900">Possible duplicates found</p>
                <ul className="text-xs text-amber-800 mt-1 space-y-0.5">
                  {duplicates.map((d: any) => (
                    <li key={d.id}>• {d.name} {d.brand ? `(${d.brand})` : ''} — {(d.score * 100).toFixed(0)}% match</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {needsCategoryConfirm && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <div className="flex items-start gap-2 mb-2">
                <AlertTriangle className="text-orange-600 shrink-0 mt-0.5" size={16} />
                <div className="text-sm">
                  <p className="font-semibold text-orange-900">Confirm category</p>
                  <p className="text-xs text-orange-800">
                    AI suggested "<b>{draft.category_suggested}</b>" ({Math.round(draft.category_confidence * 100)}% confidence). Please pick the best match:
                  </p>
                </div>
              </div>
              <Select value={draft.category_id} onValueChange={v => { update('category_id', v); setNeedsCategoryConfirm(false); }}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Product Name"><Input value={draft.name} onChange={e => update('name', e.target.value)} /></Field>
            <Field label="Name (Urdu)"><Input value={draft.name_ur} onChange={e => update('name_ur', e.target.value)} /></Field>
            <Field label="Brand"><Input value={draft.brand} onChange={e => update('brand', e.target.value)} /></Field>
            <Field label="Manufacturer"><Input value={draft.manufacturer} onChange={e => update('manufacturer', e.target.value)} /></Field>
            <Field label="Generic Name"><Input value={draft.generic_name} onChange={e => update('generic_name', e.target.value)} /></Field>
            <Field label="Dosage Form"><Input value={draft.dosage_form} onChange={e => update('dosage_form', e.target.value)} /></Field>
            <Field label="Composition"><Input value={draft.composition} onChange={e => update('composition', e.target.value)} /></Field>
            <Field label="Pack Size"><Input value={draft.pack_size} onChange={e => update('pack_size', e.target.value)} /></Field>
            <Field label="SKU"><Input value={draft.sku} onChange={e => update('sku', e.target.value)} /></Field>
            <Field label={<span>Price (PKR) <span className="text-slate-400 text-[10px]">AI-suggested, editable</span></span>}>
              <Input type="number" value={draft.price} onChange={e => update('price', e.target.value)} />
            </Field>
            <Field label="Category">
              <Select value={draft.category_id} onValueChange={v => update('category_id', v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Target Species">
              <div className="flex flex-wrap gap-1.5">
                {ANIMAL_TYPES.map(a => (
                  <button key={a} type="button" onClick={() => toggleAnimal(a)}
                    className={`text-xs px-2.5 py-1 rounded-full border ${draft.animal_type.includes(a) ? 'bg-primary text-primary-foreground border-primary' : 'bg-white border-slate-200 text-slate-600'}`}>
                    {a}
                  </button>
                ))}
              </div>
            </Field>
          </div>

          <Field label="Indications"><Textarea rows={2} value={draft.indications} onChange={e => update('indications', e.target.value)} /></Field>
          <Field label="Benefits"><Textarea rows={2} value={draft.benefits} onChange={e => update('benefits', e.target.value)} /></Field>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Dosage & Administration"><Textarea rows={3} value={draft.usage_instructions} onChange={e => update('usage_instructions', e.target.value)} /></Field>
            <Field label="Dosage (Urdu)"><Textarea rows={3} value={draft.usage_instructions_ur} onChange={e => update('usage_instructions_ur', e.target.value)} /></Field>
            <Field label="Contraindications"><Textarea rows={2} value={draft.contraindications} onChange={e => update('contraindications', e.target.value)} /></Field>
            <Field label="Warnings"><Textarea rows={2} value={draft.warnings} onChange={e => update('warnings', e.target.value)} /></Field>
            <Field label="Storage Instructions"><Textarea rows={2} value={draft.storage_instructions} onChange={e => update('storage_instructions', e.target.value)} /></Field>
            <Field label="Description"><Textarea rows={3} value={draft.description} onChange={e => update('description', e.target.value)} /></Field>
          </div>

          <Field label="Product Images (upload real product photos)">
            <MultiImageUpload images={draft.images} onChange={imgs => update('images', imgs)} bucket="product-images" />
            {draft.image_search_query && (
              <p className="text-xs text-slate-400 mt-1">Suggested search: "{draft.image_search_query}"</p>
            )}
          </Field>

          <div className="grid md:grid-cols-2 gap-4">
            <Field label="SEO Title"><Input value={draft.seo_title} onChange={e => update('seo_title', e.target.value)} /></Field>
            <Field label="SEO Description"><Input value={draft.seo_description} onChange={e => update('seo_description', e.target.value)} /></Field>
          </div>
          <Field label="SEO Keywords"><TagInput tags={draft.seo_keywords} onChange={t => update('seo_keywords', t)} placeholder="Add keyword..." /></Field>
          <Field label="Product Tags"><TagInput tags={draft.tags} onChange={t => update('tags', t)} placeholder="Add tag..." /></Field>

          <div className="flex items-center gap-3 pt-2 border-t">
            <Button onClick={save} disabled={loading} className="gap-2">
              {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
              Save Product
            </Button>
            <Button variant="outline" onClick={runImport} disabled={loading} className="gap-2">
              <RefreshCw size={14} /> Regenerate
            </Button>
            <div className="ml-auto text-xs text-slate-400 flex items-center gap-1">
              <CheckCircle2 size={12} className="text-primary" /> All fields editable before publishing
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Field = ({ label, children }: { label: React.ReactNode; children: React.ReactNode }) => (
  <div>
    <Label className="text-xs text-slate-500 mb-1 block">{label}</Label>
    {children}
  </div>
);

export default AiProductImporter;
