import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type ThemeTokens = Record<string, string>;

export interface SiteTheme {
  id: string;
  name: string;
  occasion: string | null;
  banner_text: string | null;
  banner_text_ur: string | null;
  tokens: ThemeTokens;
  is_active: boolean;
}

interface ThemeContextValue {
  theme: SiteTheme | null;
  previewTheme: (tokens: ThemeTokens | null) => void;
  refresh: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const HSL = /^\d{1,3}(\.\d+)?\s+\d{1,3}(\.\d+)?%\s+\d{1,3}(\.\d+)?%$/;

const ALLOWED = new Set([
  'background', 'foreground', 'card', 'card-foreground', 'popover', 'popover-foreground',
  'primary', 'primary-foreground', 'secondary', 'secondary-foreground',
  'muted', 'muted-foreground', 'accent', 'accent-foreground',
  'border', 'input', 'ring', 'gold', 'gold-foreground', 'success', 'warning',
]);

const applied: string[] = [];

export function applyTokens(tokens: ThemeTokens | null) {
  const root = document.documentElement;
  applied.forEach((k) => root.style.removeProperty(`--${k}`));
  applied.length = 0;
  if (!tokens) return;

  Object.entries(tokens).forEach(([key, value]) => {
    const name = key.trim();
    const val = String(value ?? '').trim().replace(/^hsl\(|\)$/g, '').replace(/,/g, ' ').replace(/\s+/g, ' ');
    if (!ALLOWED.has(name) || !HSL.test(val)) return;
    root.style.setProperty(`--${name}`, val);
    applied.push(name);
  });
}

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<SiteTheme | null>(null);
  const [tick, setTick] = useState(0);
  const [preview, setPreview] = useState<ThemeTokens | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await (supabase as any)
        .from('site_themes')
        .select('*')
        .eq('is_active', true)
        .maybeSingle();
      if (cancelled) return;
      setTheme((data as SiteTheme) ?? null);
    })();
    return () => { cancelled = true; };
  }, [tick]);

  useEffect(() => {
    applyTokens(preview ?? theme?.tokens ?? null);
  }, [theme, preview]);

  return (
    <ThemeContext.Provider
      value={{ theme, previewTheme: setPreview, refresh: () => setTick((t) => t + 1) }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useSiteTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useSiteTheme must be used within ThemeProvider');
  return ctx;
};
