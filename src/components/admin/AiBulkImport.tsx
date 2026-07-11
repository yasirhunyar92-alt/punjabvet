import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Sparkles, Upload, CheckCircle2, AlertCircle, SkipForward, RotateCw, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';

type RowStatus = 'pending' | 'processing' | 'done' | 'skipped' | 'failed';
interface Row { name: string; status: RowStatus; message?: string; }

const parseFile = async (file: File): Promise<string[]> => {
  const buf = await file.arrayBuffer();
  const ext = file.name.toLowerCase().split('.').pop();
  if (ext === 'csv' || ext === 'txt') {
    const text = new TextDecoder().decode(buf);
    return text.split(/\r?\n/).map(l => l.split(',')[0].trim()).filter(Boolean);
  }
  // xlsx / xls
  const wb = XLSX.read(buf, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: false });
  return rows.map(r => String(r?.[0] ?? '').trim()).filter(v => v && v.toLowerCase() !== 'product name' && v.toLowerCase() !== 'name');
};

const AiBulkImport = () => {
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<Row[]>([]);
  const [pastedNames, setPastedNames] = useState('');
  const [running, setRunning] = useState(false);
  const [current, setCurrent] = useState<string>('');
  const stopRef = useRef(false);

  const { data: existingProducts } = useQuery({
    queryKey: ['existing-product-names'],
    queryFn: async () => {
      const { data } = await supabase.from('products').select('name');
      return (data || []).map(p => p.name.toLowerCase().trim());
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('id, name');
      return data || [];
    },
  });

  const onFile = async (file: File) => {
    try {
      const names = await parseFile(file);
      if (!names.length) { toast.error('No product names found'); return; }
      setRows(names.map(name => ({ name, status: 'pending' as RowStatus })));
      toast.success(`Loaded ${names.length} product names`);
    } catch (e: any) {
      toast.error(e.message || 'Failed to parse file');
    }
  };

  const loadPasted = () => {
    const names = pastedNames.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (!names.length) { toast.error('Paste some product names'); return; }
    setRows(names.map(name => ({ name, status: 'pending' as RowStatus })));
    toast.success(`Loaded ${names.length} product names`);
  };

  const processRow = async (row: Row, idx: number) => {
    setCurrent(row.name);
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, status: 'processing' } : r));

    // Duplicate check
    if (existingProducts?.includes(row.name.toLowerCase().trim())) {
      setRows(prev => prev.map((r, i) => i === idx ? { ...r, status: 'skipped', message: 'Already exists' } : r));
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('ai-product-generate', {
        body: { productName: row.name },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const p = data?.product || {};

      // Category resolution
      let category_id: string | null = null;
      if (p.category && categories) {
        const match = categories.find((c: any) => c.name?.toLowerCase() === String(p.category).toLowerCase());
        category_id = match?.id || null;
      }

      const ANIMAL_TYPES = ['Cow', 'Buffalo', 'Goat', 'Sheep', 'Poultry', 'Horse', 'Dog', 'Cat'];
      const payload = {
        name: p.name || row.name,
        name_ur: p.name_ur || null,
        description: p.description || null,
        description_ur: p.description_ur || null,
        price: Number(p.suggested_price_pkr) || 0,
        category_id,
        brand: p.brand || null,
        volume_size: p.volume_size || p.pack_size || null,
        tags: Array.isArray(p.tags) ? p.tags : [],
        animal_type: Array.isArray(p.animal_type)
          ? p.animal_type.filter((a: string) => ANIMAL_TYPES.includes(a))
          : [],
        usage_instructions: p.usage_instructions || null,
        usage_instructions_ur: p.usage_instructions_ur || null,
        in_stock: true,
        featured: false,
        stock_quantity: 0,
        images: [],
      };

      const { error: insErr } = await supabase.from('products').insert(payload);
      if (insErr) throw insErr;

      setRows(prev => prev.map((r, i) => i === idx ? { ...r, status: 'done', message: 'Saved' } : r));
    } catch (err: any) {
      const msg = err?.message || 'Failed';
      setRows(prev => prev.map((r, i) => i === idx ? { ...r, status: 'failed', message: msg } : r));
    }
  };

  const run = async (onlyFailed = false) => {
    if (!rows.length) { toast.error('Load product names first'); return; }
    setRunning(true);
    stopRef.current = false;
    for (let i = 0; i < rows.length; i++) {
      if (stopRef.current) break;
      const r = rows[i];
      if (onlyFailed && r.status !== 'failed') continue;
      if (!onlyFailed && r.status === 'done') continue;
      await processRow(r, i);
      // small delay to be gentle on the AI gateway
      await new Promise(res => setTimeout(res, 500));
    }
    setCurrent('');
    setRunning(false);
    queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['existing-product-names'] });
    toast.success('Bulk import finished');
  };

  const stop = () => { stopRef.current = true; };

  const done = rows.filter(r => r.status === 'done').length;
  const failed = rows.filter(r => r.status === 'failed').length;
  const skipped = rows.filter(r => r.status === 'skipped').length;
  const total = rows.length;
  const processed = done + failed + skipped;
  const progress = total ? Math.round((processed / total) * 100) : 0;

  const badge = (s: RowStatus) => {
    switch (s) {
      case 'done': return <Badge className="bg-primary/15 text-primary hover:bg-primary/15"><CheckCircle2 size={10} className="mr-1" />Done</Badge>;
      case 'failed': return <Badge variant="destructive"><AlertCircle size={10} className="mr-1" />Failed</Badge>;
      case 'skipped': return <Badge variant="secondary"><SkipForward size={10} className="mr-1" />Skipped</Badge>;
      case 'processing': return <Badge variant="outline"><Loader2 size={10} className="mr-1 animate-spin" />Processing</Badge>;
      default: return <Badge variant="outline">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-start gap-3">
        <Sparkles className="text-primary shrink-0 mt-0.5" size={20} />
        <div className="text-sm">
          <p className="font-semibold">AI Bulk Product Import</p>
          <p className="text-muted-foreground text-xs mt-0.5">
            Upload a CSV/XLSX/TXT with one product name per row (first column), or paste names below. AI generates all fields and saves to the database. Duplicates are skipped automatically.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="border-2 border-dashed rounded-lg p-6 text-center">
          <Upload className="mx-auto mb-2 text-muted-foreground" size={28} />
          <Label htmlFor="ai-bulk-file" className="cursor-pointer text-primary text-sm">Choose CSV / XLSX / TXT</Label>
          <Input id="ai-bulk-file" type="file" accept=".csv,.xlsx,.xls,.txt" className="hidden"
            onChange={e => e.target.files?.[0] && onFile(e.target.files[0])} />
          <p className="text-xs text-muted-foreground mt-1">First column = product name</p>
        </div>
        <div className="border rounded-lg p-4 space-y-2">
          <Label className="text-xs">Or paste product names (one per line)</Label>
          <Textarea rows={5} value={pastedNames} onChange={e => setPastedNames(e.target.value)}
            placeholder="Selmox LA Injection&#10;Tygent Injection&#10;Ketoject Injection" />
          <Button size="sm" variant="outline" onClick={loadPasted}>Load names</Button>
        </div>
      </div>

      {rows.length > 0 && (
        <>
          <div className="bg-card border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="text-sm">
                <span className="font-semibold">{processed}</span> / {total} processed ·{' '}
                <span className="text-primary">{done} done</span> ·{' '}
                <span className="text-destructive">{failed} failed</span> ·{' '}
                <span className="text-muted-foreground">{skipped} skipped</span>
              </div>
              <div className="flex gap-2">
                {running ? (
                  <Button size="sm" variant="outline" onClick={stop}>Stop</Button>
                ) : (
                  <>
                    <Button size="sm" onClick={() => run(false)}>
                      <Sparkles size={14} className="mr-1" /> Start / Resume
                    </Button>
                    {failed > 0 && (
                      <Button size="sm" variant="outline" onClick={() => run(true)}>
                        <RotateCw size={14} className="mr-1" /> Retry failed
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
            <Progress value={progress} />
            {current && <p className="text-xs text-muted-foreground truncate">Currently: <span className="font-medium text-foreground">{current}</span></p>}
          </div>

          <div className="border rounded-lg max-h-96 overflow-y-auto divide-y">
            {rows.map((r, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 gap-3">
                <span className="text-sm truncate flex-1">{r.name}</span>
                {r.message && r.status !== 'done' && (
                  <span className="text-[11px] text-muted-foreground truncate max-w-[40%]">{r.message}</span>
                )}
                {badge(r.status)}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AiBulkImport;
