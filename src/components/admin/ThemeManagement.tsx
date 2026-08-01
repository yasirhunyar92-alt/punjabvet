import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Sparkles, Loader2, Trash2, Eye, EyeOff, Palette } from 'lucide-react';
import { applyTokens, useSiteTheme, type SiteTheme, type ThemeTokens } from '@/contexts/ThemeContext';

const OCCASION_PRESETS = [
  '14 August Independence Day',
  'Eid ul Fitr',
  'Eid ul Azha (Qurbani season)',
  'Ramadan',
  'Winter Livestock Care Sale',
  'Kisan Mela / Farmer Festival',
];

const ThemeManagement = () => {
  const queryClient = useQueryClient();
  const { theme: activeTheme, previewTheme, refresh } = useSiteTheme();

  const [occasion, setOccasion] = useState('14 August Independence Day');
  const [notes, setNotes] = useState('');
  const [generating, setGenerating] = useState(false);
  const [draft, setDraft] = useState<Partial<SiteTheme> | null>(null);
  const [previewing, setPreviewing] = useState(false);

  const { data: themes = [], isLoading } = useQuery({
    queryKey: ['site_themes'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('site_themes')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as SiteTheme[];
    },
  });

  const generate = async () => {
    if (!occasion.trim()) return toast.error('Enter an occasion first');
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-theme-generate', {
        body: { occasion: occasion.trim(), notes: notes.trim() || undefined },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setDraft(data.theme);
      toast.success('Theme generated — preview it before going live');
    } catch (e: any) {
      toast.error(e.message || 'Could not generate the theme');
    } finally {
      setGenerating(false);
    }
  };

  const togglePreview = () => {
    if (!draft?.tokens) return;
    if (previewing) {
      previewTheme(null);
      setPreviewing(false);
    } else {
      previewTheme(draft.tokens as ThemeTokens);
      setPreviewing(true);
    }
  };

  const saveDraft = async (activate: boolean) => {
    if (!draft?.tokens) return;
    try {
      if (activate) {
        await (supabase as any).from('site_themes').update({ is_active: false }).eq('is_active', true);
      }
      const { error } = await (supabase as any).from('site_themes').insert({
        name: draft.name || occasion,
        occasion: draft.occasion || occasion,
        banner_text: draft.banner_text ?? null,
        banner_text_ur: draft.banner_text_ur ?? null,
        tokens: draft.tokens,
        is_active: activate,
      });
      if (error) throw error;
      previewTheme(null);
      setPreviewing(false);
      setDraft(null);
      queryClient.invalidateQueries({ queryKey: ['site_themes'] });
      refresh();
      toast.success(activate ? 'Theme is now live on the website' : 'Theme saved');
    } catch (e: any) {
      toast.error(e.message || 'Could not save the theme');
    }
  };

  const activate = async (t: SiteTheme, on: boolean) => {
    try {
      if (on) {
        await (supabase as any).from('site_themes').update({ is_active: false }).eq('is_active', true);
      }
      const { error } = await (supabase as any).from('site_themes').update({ is_active: on }).eq('id', t.id);
      if (error) throw error;
      previewTheme(null);
      setPreviewing(false);
      applyTokens(on ? t.tokens : null);
      queryClient.invalidateQueries({ queryKey: ['site_themes'] });
      refresh();
      toast.success(on ? `${t.name} is live` : 'Back to the default theme');
    } catch (e: any) {
      toast.error(e.message || 'Could not update the theme');
    }
  };

  const remove = async (t: SiteTheme) => {
    const { error } = await (supabase as any).from('site_themes').delete().eq('id', t.id);
    if (error) return toast.error(error.message);
    if (t.is_active) applyTokens(null);
    queryClient.invalidateQueries({ queryKey: ['site_themes'] });
    refresh();
    toast.success('Theme deleted');
  };

  const swatches = (tokens: ThemeTokens) =>
    ['primary', 'accent', 'gold', 'background', 'foreground'].map((k) => (
      <span
        key={k}
        title={`${k}: ${tokens?.[k]}`}
        className="h-6 w-6 rounded-full border border-border"
        style={{ background: tokens?.[k] ? `hsl(${tokens[k]})` : 'transparent' }}
      />
    ));

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">AI Seasonal Theme Changer</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Describe an occasion and AI will design a matching colour theme and festive banner for the whole website.
        </p>

        <div className="flex flex-wrap gap-2">
          {OCCASION_PRESETS.map((p) => (
            <Button key={p} type="button" variant={occasion === p ? 'default' : 'outline'} size="sm" onClick={() => setOccasion(p)}>
              {p}
            </Button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Occasion</Label>
            <Input value={occasion} onChange={(e) => setOccasion(e.target.value)} placeholder="e.g. 14 August Independence Day" />
          </div>
          <div className="space-y-1.5">
            <Label>Extra direction (optional)</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. use green & white with a hint of gold" />
          </div>
        </div>

        <Button onClick={generate} disabled={generating}>
          {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
          {generating ? 'Designing theme…' : 'Generate with AI'}
        </Button>
      </div>

      {draft?.tokens && (
        <div className="rounded-xl border border-primary/40 bg-card p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="font-semibold">{draft.name}</h4>
              <p className="text-sm text-muted-foreground">{draft.occasion}</p>
            </div>
            <div className="flex gap-2">{swatches(draft.tokens as ThemeTokens)}</div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Banner text (English)</Label>
              <Input value={draft.banner_text ?? ''} onChange={(e) => setDraft({ ...draft, banner_text: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Banner text (Urdu)</Label>
              <Input className="font-urdu" dir="rtl" value={draft.banner_text_ur ?? ''} onChange={(e) => setDraft({ ...draft, banner_text_ur: e.target.value })} />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={togglePreview}>
              {previewing ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {previewing ? 'Stop preview' : 'Preview on site'}
            </Button>
            <Button onClick={() => saveDraft(true)}>Save & make live</Button>
            <Button variant="secondary" onClick={() => saveDraft(false)}>Save for later</Button>
            <Button variant="ghost" onClick={() => { previewTheme(null); setPreviewing(false); setDraft(null); }}>Discard</Button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h3 className="font-semibold">Saved themes</h3>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : themes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No themes yet. Generate your first festive theme above.</p>
        ) : (
          <div className="space-y-3">
            {themes.map((t) => (
              <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3">
                <div className="min-w-0">
                  <p className="font-medium truncate">{t.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{t.banner_text || t.occasion}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">{swatches(t.tokens)}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{t.is_active ? 'Live' : 'Off'}</span>
                    <Switch checked={t.is_active} onCheckedChange={(v) => activate(t, v)} />
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => remove(t)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        {activeTheme && (
          <p className="text-xs text-muted-foreground">
            Currently live: <strong>{activeTheme.name}</strong>
          </p>
        )}
      </div>
    </div>
  );
};

export default ThemeManagement;
