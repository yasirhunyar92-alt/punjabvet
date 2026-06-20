import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Sparkles, Plus, Edit, Trash2, Loader2, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BlogForm {
  id?: string;
  title: string;
  title_ur: string;
  slug: string;
  excerpt: string;
  excerpt_ur: string;
  content: string;
  content_ur: string;
  seo_title: string;
  seo_description: string;
  category: string;
  tags: string;
  cover_image: string;
  published: boolean;
  ai_generated: boolean;
}

const empty: BlogForm = {
  title: '', title_ur: '', slug: '', excerpt: '', excerpt_ur: '',
  content: '', content_ur: '', seo_title: '', seo_description: '',
  category: 'General', tags: '', cover_image: '', published: false, ai_generated: false,
};

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').slice(0, 80);

const BlogManagement = () => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<BlogForm>(empty);
  const [topic, setTopic] = useState('');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['admin_blog_posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const generate = async () => {
    if (!topic.trim()) return toast.error('Enter a topic first');
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-blog-generate', {
        body: { topic },
      });
      if (error) throw error;
      const p = data?.post || {};
      setForm({
        ...empty,
        title: p.title || topic,
        title_ur: p.title_ur || '',
        slug: p.slug || slugify(p.title || topic),
        excerpt: p.excerpt || '',
        excerpt_ur: p.excerpt_ur || '',
        content: p.content || '',
        content_ur: p.content_ur || '',
        seo_title: p.seo_title || p.title || '',
        seo_description: p.seo_description || p.excerpt || '',
        category: p.category || 'General',
        tags: Array.isArray(p.tags) ? p.tags.join(', ') : '',
        cover_image: '',
        published: false,
        ai_generated: true,
      });
      toast.success('Draft generated — review and publish');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const openNew = () => { setForm(empty); setTopic(''); setOpen(true); };
  const openEdit = (p: any) => {
    setForm({
      id: p.id, title: p.title, title_ur: p.title_ur || '', slug: p.slug,
      excerpt: p.excerpt || '', excerpt_ur: p.excerpt_ur || '',
      content: p.content, content_ur: p.content_ur || '',
      seo_title: p.seo_title || '', seo_description: p.seo_description || '',
      category: p.category || 'General',
      tags: (p.tags || []).join(', '),
      cover_image: p.cover_image || '',
      published: p.published, ai_generated: p.ai_generated,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.title.trim() || !form.content.trim()) return toast.error('Title and content required');
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        title_ur: form.title_ur || null,
        slug: form.slug || slugify(form.title),
        excerpt: form.excerpt || null,
        excerpt_ur: form.excerpt_ur || null,
        content: form.content,
        content_ur: form.content_ur || null,
        seo_title: form.seo_title || null,
        seo_description: form.seo_description || null,
        category: form.category || null,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        cover_image: form.cover_image || null,
        published: form.published,
        ai_generated: form.ai_generated,
        published_at: form.published ? new Date().toISOString() : null,
      };

      if (form.id) {
        const { error } = await supabase.from('blog_posts').update(payload).eq('id', form.id);
        if (error) throw error;
        toast.success('Post updated');
      } else {
        const { data: u } = await supabase.auth.getUser();
        const { error } = await supabase.from('blog_posts').insert({ ...payload, author_id: u.user?.id });
        if (error) throw error;
        toast.success('Post created');
      }
      qc.invalidateQueries({ queryKey: ['admin_blog_posts'] });
      qc.invalidateQueries({ queryKey: ['blog_posts_public'] });
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (p: any) => {
    const next = !p.published;
    const { error } = await supabase
      .from('blog_posts')
      .update({ published: next, published_at: next ? new Date().toISOString() : null })
      .eq('id', p.id);
    if (error) return toast.error(error.message);
    toast.success(next ? 'Published' : 'Unpublished');
    qc.invalidateQueries({ queryKey: ['admin_blog_posts'] });
    qc.invalidateQueries({ queryKey: ['blog_posts_public'] });
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this post?')) return;
    const { error } = await supabase.from('blog_posts').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Deleted');
    qc.invalidateQueries({ queryKey: ['admin_blog_posts'] });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-lg font-bold">Blog Posts</h2>
        <Button onClick={openNew}><Plus size={14} className="mr-1" /> New Post</Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : posts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No posts yet. Create one or generate with AI.</p>
      ) : (
        <div className="space-y-2">
          {posts.map((p: any) => (
            <div key={p.id} className="flex items-center justify-between gap-3 p-3 border rounded-lg bg-card">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold truncate">{p.title}</p>
                  {p.published ? <Badge variant="default">Published</Badge> : <Badge variant="secondary">Draft</Badge>}
                  {p.ai_generated && <Badge variant="outline" className="gap-1"><Sparkles size={10} /> AI</Badge>}
                </div>
                <p className="text-xs text-muted-foreground truncate">/{p.slug} · {p.category || 'General'}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Switch checked={p.published} onCheckedChange={() => togglePublish(p)} />
                {p.published && (
                  <Link to={`/blog/${p.slug}`} target="_blank">
                    <Button size="icon" variant="ghost"><Eye size={14} /></Button>
                  </Link>
                )}
                <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Edit size={14} /></Button>
                <Button size="icon" variant="ghost" onClick={() => remove(p.id)}><Trash2 size={14} className="text-destructive" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Edit Post' : 'New Post'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="p-3 border rounded-lg bg-primary/5 space-y-2">
              <Label className="flex items-center gap-1 text-sm"><Sparkles size={14} className="text-primary" /> AI Generate</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. How to prevent mastitis in dairy cows"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  disabled={generating}
                />
                <Button onClick={generate} disabled={generating} type="button">
                  {generating ? <Loader2 size={14} className="animate-spin" /> : 'Generate'}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">AI fills the form below. Review, edit, then publish.</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Title (EN)</Label>
                <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value, slug: form.slug || slugify(e.target.value) })} />
              </div>
              <div>
                <Label>Title (UR)</Label>
                <Input value={form.title_ur} onChange={e => setForm({ ...form, title_ur: e.target.value })} dir="rtl" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Slug</Label>
                <Input value={form.slug} onChange={e => setForm({ ...form, slug: slugify(e.target.value) })} />
              </div>
              <div>
                <Label>Category</Label>
                <Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} />
              </div>
            </div>

            <div>
              <Label>Excerpt (EN)</Label>
              <Textarea rows={2} value={form.excerpt} onChange={e => setForm({ ...form, excerpt: e.target.value })} />
            </div>
            <div>
              <Label>Excerpt (UR)</Label>
              <Textarea rows={2} value={form.excerpt_ur} onChange={e => setForm({ ...form, excerpt_ur: e.target.value })} dir="rtl" />
            </div>

            <div>
              <Label>Content (EN) — markdown</Label>
              <Textarea rows={8} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
            </div>
            <div>
              <Label>Content (UR)</Label>
              <Textarea rows={8} value={form.content_ur} onChange={e => setForm({ ...form, content_ur: e.target.value })} dir="rtl" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>SEO Title</Label>
                <Input value={form.seo_title} onChange={e => setForm({ ...form, seo_title: e.target.value })} maxLength={70} />
              </div>
              <div>
                <Label>Tags (comma separated)</Label>
                <Input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} />
              </div>
            </div>

            <div>
              <Label>SEO Description</Label>
              <Textarea rows={2} value={form.seo_description} onChange={e => setForm({ ...form, seo_description: e.target.value })} maxLength={170} />
            </div>

            <div>
              <Label>Cover Image URL</Label>
              <Input value={form.cover_image} onChange={e => setForm({ ...form, cover_image: e.target.value })} />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <Label className="text-sm">Publish</Label>
                <p className="text-[11px] text-muted-foreground">Visible on /blog and sitemap when on.</p>
              </div>
              <Switch checked={form.published} onCheckedChange={v => setForm({ ...form, published: v })} />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={save} disabled={saving}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BlogManagement;
