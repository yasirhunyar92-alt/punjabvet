import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const Auth = () => {
  const { t, isUrdu } = useLanguage();
  const { signIn, signUp, signInWithGoogle, resetPassword, user } = useAuth();
  const navigate = useNavigate();
  const fontClass = isUrdu ? 'font-urdu' : '';
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', name: '' });

  if (user) { navigate('/'); return null; }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isForgot) {
        await resetPassword(form.email);
        toast.success('Password reset email sent');
        setIsForgot(false);
      } else if (isSignUp) {
        if (form.password !== form.confirmPassword) { toast.error('Passwords do not match'); setLoading(false); return; }
        if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); setLoading(false); return; }
        await signUp(form.email, form.password, form.name);
        toast.success('Account created! Check your email to verify.');
      } else {
        await signIn(form.email, form.password);
        toast.success('Welcome back!');
        navigate('/');
      }
    } catch (err: any) {
      toast.error(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-12 max-w-md">
      <div className="bg-card border rounded-xl p-6 shadow-sm">
        {/* Brand */}
        <div className="text-center mb-6">
          <h2 className="text-lg font-extrabold text-primary">Punjab Veterinary</h2>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">Medical Store</p>
        </div>

        <h1 className={`text-xl font-bold text-center text-foreground mb-6 ${fontClass}`}>
          {isForgot ? t('resetPassword') : isSignUp ? t('signUp') : t('signIn')}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div>
              <Label className={fontClass}>{t('name')}</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
          )}
          <div>
            <Label className={fontClass}>{t('email')}</Label>
            <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          {!isForgot && (
            <div>
              <Label className={fontClass}>{t('password')}</Label>
              <Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} />
            </div>
          )}
          {isSignUp && (
            <div>
              <Label className={fontClass}>{t('confirmPassword')}</Label>
              <Input type="password" value={form.confirmPassword} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} required minLength={6} />
            </div>
          )}

          <Button type="submit" className={`w-full ${fontClass}`} disabled={loading}>
            {loading ? t('loading') : isForgot ? t('resetPassword') : isSignUp ? t('signUp') : t('signIn')}
          </Button>
        </form>

        {!isForgot && (
          <>
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">or</span></div>
            </div>
            <Button variant="outline" className={`w-full ${fontClass}`} onClick={signInWithGoogle}>
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              {t('continueWithGoogle')}
            </Button>
          </>
        )}

        <div className="mt-4 text-center text-sm space-y-2">
          {!isForgot && (
            <button onClick={() => setIsForgot(true)} className={`text-primary hover:underline ${fontClass}`}>
              {t('forgotPassword')}
            </button>
          )}
          <div>
            <button onClick={() => { setIsSignUp(!isSignUp); setIsForgot(false); }} className={`text-primary hover:underline ${fontClass}`}>
              {isSignUp || isForgot ? t('haveAccount') : t('noAccount')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
