import { useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Upload, Download, FileWarning, CheckCircle2, AlertCircle } from 'lucide-react';

type Mode = 'products' | 'categories';

// Schema: target field -> { required, type, parse }
const PRODUCT_FIELDS: Record<string, { required?: boolean; type: 'string' | 'number' | 'boolean' | 'array' | 'date'; aliases?: string[] }> = {
  name: { required: true, type: 'string', aliases: ['title', 'product_name'] },
  name_ur: { type: 'string', aliases: ['urdu_name'] },
  description: { type: 'string' },
  description_ur: { type: 'string' },
  price: { required: true, type: 'number', aliases: ['cost', 'mrp'] },
  discount_price: { type: 'number', aliases: ['sale_price'] },
  category: { type: 'string', aliases: ['category_name'] }, // resolved to category_id
  brand: { type: 'string' },
  sku: { type: 'string', aliases: ['code'] },
  stock_quantity: { type: 'number', aliases: ['stock', 'qty', 'quantity'] },
  in_stock: { type: 'boolean' },
  featured: { type: 'boolean' },
  volume_size: { type: 'string', aliases: ['size', 'volume'] },
  image_url: { type: 'string', aliases: ['image', 'thumbnail'] },
  tags: { type: 'array' },
  animal_type: { type: 'array', aliases: ['animals'] },
  usage_instructions: { type: 'string' },
  usage_instructions_ur: { type: 'string' },
  batch_number: { type: 'string' },
  expiry_date: { type: 'date' },
};

const CATEGORY_FIELDS: Record<string, { required?: boolean; type: 'string'; aliases?: string[] }> = {
  name: { required: true, type: 'string', aliases: ['title', 'category_name'] },
  name_ur: { type: 'string', aliases: ['urdu_name'] },
  description: { type: 'string' },
  description_ur: { type: 'string' },
  image_url: { type: 'string', aliases: ['image'] },
};

// Minimal CSV parser handling quotes & commas
function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQuotes = false;
      else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { cur.push(field); field = ''; }
      else if (c === '\n') { cur.push(field); rows.push(cur); cur = []; field = ''; }
      else if (c === '\r') { /* skip */ }
      else field += c;
    }
  }
  if (field.length || cur.length) { cur.push(field); rows.push(cur); }
  const headers = (rows.shift() || []).map(h => h.trim());
  return { headers, rows: rows.filter(r => r.some(v => v.trim() !== '')) };
}

function toCSV(rows: Record<string, any>[]): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const esc = (v: any) => {
    if (v === null || v === undefined) return '';
    const s = Array.isArray(v) ? v.join('|') : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(','), ...rows.map(r => headers.map(h => esc(r[h])).join(','))].join('\n');
}

function autoMap(headers: string[], schema: Record<string, { aliases?: string[] }>): Record<string, string> {
  const map: Record<string, string> = {};
  const norm = (s: string) => s.toLowerCase().replace(/[\s_-]/g, '');
  for (const field of Object.keys(schema)) {
    const candidates = [field, ...(schema[field].aliases || [])].map(norm);
    const found = headers.find(h => candidates.includes(norm(h)));
    if (found) map[field] = found;
  }
  return map;
}

interface RowError { row: number; errors: string[]; }

const BulkImport = () => {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<Mode>('products');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<RowError[]>([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [imported, setImported] = useState(0);

  const schema = mode === 'products' ? PRODUCT_FIELDS : CATEGORY_FIELDS;

  const { data: categories } = useQuery({
    queryKey: ['categories-bulk'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('id, name');
      return data || [];
    },
  });

  const categoryMap = useMemo(() => {
    const m: Record<string, string> = {};
    (categories || []).forEach(c => { m[c.name.toLowerCase()] = c.id; });
    return m;
  }, [categories]);

  const handleFile = async (file: File) => {
    const text = await file.text();
    const { headers: h, rows: r } = parseCSV(text);
    setHeaders(h);
    setRows(r);
    setMapping(autoMap(h, schema));
    setErrors([]);
    setImported(0);
    setProgress(0);
    toast.success(`Parsed ${r.length} rows`);
  };

  const parseValue = (raw: string, type: string): any => {
    const v = (raw ?? '').trim();
    if (v === '') return null;
    switch (type) {
      case 'number': { const n = Number(v); return isNaN(n) ? '__INVALID__' : n; }
      case 'boolean': return ['1', 'true', 'yes', 'y'].includes(v.toLowerCase());
      case 'array': return v.split(/[|,;]/).map(s => s.trim()).filter(Boolean);
      case 'date': return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : '__INVALID__';
      default: return v;
    }
  };

  const buildPayload = (row: string[], rowIdx: number): { payload: any; errors: string[] } => {
    const payload: any = {};
    const errs: string[] = [];
    for (const [field, def] of Object.entries(schema)) {
      const header = mapping[field];
      const raw = header ? row[headers.indexOf(header)] : '';
      const val = parseValue(raw || '', def.type);
      if ((def as any).required && (val === null || val === '')) {
        errs.push(`Missing required: ${field}`);
        continue;
      }
      if (val === '__INVALID__') {
        errs.push(`Invalid ${def.type}: ${field}="${raw}"`);
        continue;
      }
      if (val === null) continue;

      if (mode === 'products' && field === 'category') {
        const id = categoryMap[String(val).toLowerCase()];
        if (!id) errs.push(`Unknown category: "${val}"`);
        else payload.category_id = id;
      } else {
        payload[field] = val;
      }
    }
    return { payload, errors: errs };
  };

  const validate = () => {
    const errs: RowError[] = [];
    rows.forEach((r, i) => {
      const { errors: e } = buildPayload(r, i);
      if (e.length) errs.push({ row: i + 2, errors: e });
    });
    setErrors(errs);
    if (!errs.length) toast.success('All rows valid ✓');
    else toast.error(`${errs.length} rows have errors`);
  };

  const runImport = async () => {
    setImporting(true);
    setImported(0);
    setProgress(0);
    const errs: RowError[] = [];
    const valid: any[] = [];
    rows.forEach((r, i) => {
      const { payload, errors: e } = buildPayload(r, i);
      if (e.length) errs.push({ row: i + 2, errors: e });
      else valid.push(payload);
    });
    setErrors(errs);

    if (!valid.length) {
      toast.error('No valid rows to import');
      setImporting(false);
      return;
    }

    const table = mode === 'products' ? 'products' : 'categories';
    const batchSize = 50;
    let done = 0;
    for (let i = 0; i < valid.length; i += batchSize) {
      const batch = valid.slice(i, i + batchSize);
      const { error } = await supabase.from(table as any).insert(batch);
      if (error) {
        toast.error(`Batch failed at row ${i + 2}: ${error.message}`);
        break;
      }
      done += batch.length;
      setImported(done);
      setProgress(Math.round((done / valid.length) * 100));
    }

    toast.success(`Imported ${done} ${mode}`);
    queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    queryClient.invalidateQueries({ queryKey: ['categories'] });
    setImporting(false);
  };

  const downloadTemplate = () => {
    const sample: Record<string, any> = {};
    Object.entries(schema).forEach(([k, v]) => {
      sample[k] = (v as any).required ? `Sample ${k}` : '';
    });
    if (mode === 'products') {
      sample.name = 'Sample Product';
      sample.price = 100;
      sample.category = 'Medicines';
      sample.stock_quantity = 10;
      sample.tags = 'antibiotic|cattle';
      sample.animal_type = 'Cow|Buffalo';
    } else {
      sample.name = 'Sample Category';
    }
    const csv = toCSV([sample]);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${mode}-template.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportData = async () => {
    const { data } = await supabase.from(mode as any).select('*');
    const csv = toCSV(data || []);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${mode}-export-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="font-semibold">Bulk CSV Import / Export</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={downloadTemplate}><Download size={14} className="mr-1" /> Template</Button>
          <Button size="sm" variant="outline" onClick={exportData}><Download size={14} className="mr-1" /> Export</Button>
        </div>
      </div>

      <Tabs value={mode} onValueChange={v => { setMode(v as Mode); setHeaders([]); setRows([]); setMapping({}); setErrors([]); }}>
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value={mode} className="space-y-4 pt-4">
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
            <Upload className="mx-auto mb-2 text-muted-foreground" size={28} />
            <Label htmlFor="csv-file" className="cursor-pointer text-primary text-sm">
              Choose CSV file
            </Label>
            <Input id="csv-file" type="file" accept=".csv,text/csv" className="hidden"
              onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            <p className="text-xs text-muted-foreground mt-1">UTF-8 CSV with header row</p>
          </div>

          {headers.length > 0 && (
            <>
              <div className="bg-card border rounded-lg p-4">
                <h4 className="text-sm font-semibold mb-3">Field Mapping ({rows.length} rows detected)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {Object.entries(schema).map(([field, def]) => (
                    <div key={field} className="flex items-center gap-2">
                      <Label className="text-xs flex-1 truncate">
                        {field}
                        {(def as any).required && <span className="text-destructive ml-1">*</span>}
                        <span className="text-muted-foreground ml-1">({def.type})</span>
                      </Label>
                      <Select value={mapping[field] || '__none__'} onValueChange={v => setMapping(prev => ({ ...prev, [field]: v === '__none__' ? '' : v }))}>
                        <SelectTrigger className="w-44 h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">— skip —</SelectItem>
                          {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={validate}>Validate</Button>
                <Button size="sm" onClick={runImport} disabled={importing}>
                  {importing ? `Importing... ${progress}%` : `Import ${rows.length} ${mode}`}
                </Button>
              </div>

              {importing && <Progress value={progress} />}
              {imported > 0 && !importing && (
                <div className="flex items-center gap-2 text-sm text-primary">
                  <CheckCircle2 size={16} /> {imported} rows imported successfully
                </div>
              )}

              {errors.length > 0 && (
                <div className="bg-destructive/5 border border-destructive/30 rounded-lg p-3 max-h-72 overflow-y-auto">
                  <div className="flex items-center gap-2 mb-2 text-destructive font-medium text-sm">
                    <FileWarning size={16} /> {errors.length} rows with errors
                  </div>
                  <div className="space-y-1.5">
                    {errors.slice(0, 50).map(e => (
                      <div key={e.row} className="text-xs flex gap-2">
                        <Badge variant="destructive" className="h-5 shrink-0">Row {e.row}</Badge>
                        <span className="text-foreground">{e.errors.join('; ')}</span>
                      </div>
                    ))}
                    {errors.length > 50 && <p className="text-xs text-muted-foreground">+ {errors.length - 50} more...</p>}
                  </div>
                </div>
              )}

              {headers.length > 0 && rows.length > 0 && (
                <div className="bg-card border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                    <AlertCircle size={12} /> Preview (first 3 rows)
                  </div>
                  <div className="overflow-x-auto">
                    <table className="text-xs w-full">
                      <thead>
                        <tr className="border-b">
                          {headers.map(h => <th key={h} className="text-left p-1 font-medium">{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.slice(0, 3).map((r, i) => (
                          <tr key={i} className="border-b">
                            {r.map((c, j) => <td key={j} className="p-1 truncate max-w-[150px]">{c}</td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BulkImport;
