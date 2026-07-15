import { useState } from 'react';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Send, Bell } from 'lucide-react';

const schema = z.object({
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().max(1000).optional(),
  type: z.enum(['system', 'promo', 'new_product', 'order_status', 'restock', 'discount']),
  link: z.string().trim().max(300).optional(),
});

const NotificationsManagement = () => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ title: '', body: '', type: 'promo', link: '' });
  const [targetUserId, setTargetUserId] = useState<string>('all');
  const [sending, setSending] = useState(false);

  const { data: customers = [] } = useQuery({
    queryKey: ['admin-customers-mini'],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('id, name, phone').order('created_at', { ascending: false }).limit(500);
      return data || [];
    },
  });

  const { data: recent = [] } = useQuery({
    queryKey: ['admin-recent-notifications'],
    queryFn: async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(30);
      return data || [];
    },
  });

  const send = async () => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error('Please fill title (max 120 chars) and choose a type.');
      return;
    }
    setSending(true);
    try {
      const userId = targetUserId === 'all' ? null : targetUserId;
      const { error } = await supabase.from('notifications').insert({
        user_id: userId,
        title: parsed.data.title,
        body: parsed.data.body || null,
        type: parsed.data.type,
        link: parsed.data.link || null,
      });
      if (error) throw error;
      toast.success(userId ? 'Notification sent' : 'Broadcast sent');
      setForm({ title: '', body: '', type: 'promo', link: '' });
      setTargetUserId('all');
      queryClient.invalidateQueries({ queryKey: ['admin-recent-notifications'] });
    } catch (e: any) {
      toast.error(e.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 lg:p-8">
        <h3 className="font-bold text-slate-900 text-lg mb-4 flex items-center gap-2">
          <Send className="w-5 h-5 text-primary" /> Compose Notification
        </h3>
        <div className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} maxLength={120} placeholder="Winter sale is live!" />
          </div>
          <div>
            <Label>Message</Label>
            <Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} maxLength={1000} placeholder="Get 20% off on all vaccines this week." rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="promo">Promotion</SelectItem>
                  <SelectItem value="new_product">New product</SelectItem>
                  <SelectItem value="discount">Discount</SelectItem>
                  <SelectItem value="restock">Back in stock</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Optional link</Label>
              <Input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="/products" />
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Send to</Label>
            <RadioGroup value={target} onValueChange={(v) => setTarget(v as 'all' | 'user')} className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <RadioGroupItem value="all" id="all" /> <span>All customers</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <RadioGroupItem value="user" id="user" /> <span>Specific customer</span>
              </label>
            </RadioGroup>
            {target === 'user' && (
              <Input
                className="mt-3"
                type="email"
                value={targetEmail}
                onChange={(e) => setTargetEmail(e.target.value)}
                placeholder="customer@example.com"
              />
            )}
          </div>

          <Button onClick={send} disabled={sending} className="w-full sm:w-auto">
            <Send size={16} className="mr-2" />
            {sending ? 'Sending…' : 'Send Notification'}
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 lg:p-8">
        <h3 className="font-bold text-slate-900 text-lg mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" /> Recent Notifications
        </h3>
        <div className="space-y-2">
          {recent.length === 0 && <p className="text-slate-400 text-sm text-center py-8">No notifications sent yet</p>}
          {recent.map((n: any) => (
            <div key={n.id} className="border border-slate-100 rounded-2xl p-4">
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 text-sm truncate">{n.title}</p>
                  {n.body && <p className="text-xs text-slate-500 mt-1">{n.body}</p>}
                  <div className="flex items-center gap-2 mt-2 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                    <span className="bg-slate-100 px-2 py-0.5 rounded">{n.type}</span>
                    <span>{n.user_id ? 'Direct' : 'Broadcast'}</span>
                    <span>{new Date(n.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationsManagement;
