import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from 'sonner';
import { Phone } from 'lucide-react';

type AuthMode = 'email' | 'phone';

const Auth = () => {
  const { t, isUrdu } = useLanguage();
  const { signIn, signUp, signInWithPhone, verifyPhoneOtp, resetPassword, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const fontClass = isUrdu ? 'font-urdu' : '';
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('email');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', name: '', phone: '' });
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/', { replace: true });
    }
  }, [authLoading, user, navigate]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isForgot) {
        await resetPassword(form.email);
        toast.success(isUrdu ? 'پاس ورڈ ری سیٹ ای میل بھیج دی گئی' : 'Password reset email sent');
        setIsForgot(false);
      } else if (isSignUp) {
        if (form.password !== form.confirmPassword) { toast.error(isUrdu ? 'پاس ورڈ مماثل نہیں ہیں' : 'Passwords do not match'); setLoading(false); return; }
        if (form.password.length < 6) { toast.error(isUrdu ? 'پاس ورڈ کم از کم 6 حروف کا ہونا چاہیے' : 'Password must be at least 6 characters'); setLoading(false); return; }
        await signUp(form.email, form.password, form.name);
        toast.success(isUrdu ? 'اکاؤنٹ بنایا گیا! تصدیق کے لیے ای میل چیک کریں۔' : 'Account created! Check your email to verify.');
      } else {
        await signIn(form.email, form.password);
        toast.success(isUrdu ? 'خوش آمدید!' : 'Welcome back!');
        navigate('/');
      }
    } catch (err: any) {
      toast.error(err.message || (isUrdu ? 'تصدیق ناکام ہوگئی' : 'Authentication failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.phone) {
      toast.error(isUrdu ? 'فون نمبر درج کریں' : 'Please enter your phone number');
      return;
    }
    setLoading(true);
    try {
      await signInWithPhone(form.phone);
      setOtpSent(true);
      toast.success(isUrdu ? 'تصدیقی کوڈ بھیج دیا گیا' : 'Verification code sent!');
    } catch (err: any) {
      toast.error(err.message || (isUrdu ? 'کوڈ بھیجنے میں ناکامی' : 'Failed to send code'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast.error(isUrdu ? '6 ہندسوں کا کوڈ درج کریں' : 'Please enter the 6-digit code');
      return;
    }
    setLoading(true);
    try {
      await verifyPhoneOtp(form.phone, otp);
      toast.success(isUrdu ? 'خوش آمدید!' : 'Welcome!');
      navigate('/');
    } catch (err: any) {
      toast.error(err.message || (isUrdu ? 'غلط کوڈ' : 'Invalid code'));
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="container py-12 max-w-md">
        <div className="bg-card border rounded-xl p-6 shadow-sm text-center text-muted-foreground">
          {t('loading')}
        </div>
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="container py-12 max-w-md">
      <div className="bg-card border rounded-xl p-6 shadow-sm">
        <div className="text-center mb-6">
          <h2 className="text-lg font-extrabold text-primary">Punjab Veterinary</h2>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">Medical Store</p>
        </div>

        {/* Auth Mode Tabs */}
        <div className="flex mb-6 border rounded-lg overflow-hidden">
          <button
            onClick={() => { setAuthMode('email'); setOtpSent(false); setOtp(''); }}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${authMode === 'email' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
          >
            {isUrdu ? 'ای میل' : 'Email'}
          </button>
          <button
            onClick={() => { setAuthMode('phone'); setIsForgot(false); setOtpSent(false); setOtp(''); }}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${authMode === 'phone' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
          >
            <Phone className="w-3.5 h-3.5" />
            {isUrdu ? 'موبائل نمبر' : 'Mobile'}
          </button>
        </div>

        {authMode === 'email' ? (
          <>
            <h1 className={`text-xl font-bold text-center text-foreground mb-6 ${fontClass}`}>
              {isForgot ? t('resetPassword') : isSignUp ? t('signUp') : t('signIn')}
            </h1>

            <form onSubmit={handleEmailSubmit} className="space-y-4">
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
          </>
        ) : (
          <>
            <h1 className={`text-xl font-bold text-center text-foreground mb-6 ${fontClass}`}>
              {isUrdu ? 'موبائل سے لاگ ان' : 'Login with Mobile'}
            </h1>

            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <Label className={fontClass}>{isUrdu ? 'موبائل نمبر' : 'Mobile Number'}</Label>
                  <Input
                    type="tel"
                    placeholder="+92 3XX XXXXXXX"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {isUrdu ? 'ملکی کوڈ کے ساتھ نمبر درج کریں جیسے +92' : 'Enter with country code e.g. +92'}
                  </p>
                </div>

                <Button type="submit" className={`w-full ${fontClass}`} disabled={loading}>
                  {loading ? t('loading') : isUrdu ? 'تصدیقی کوڈ بھیجیں' : 'Send Verification Code'}
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                <p className={`text-sm text-center text-muted-foreground ${fontClass}`}>
                  {isUrdu ? `${form.phone} پر کوڈ بھیجا گیا` : `Code sent to ${form.phone}`}
                </p>
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button onClick={handleVerifyOtp} className={`w-full ${fontClass}`} disabled={loading}>
                  {loading ? t('loading') : isUrdu ? 'تصدیق کریں' : 'Verify & Login'}
                </Button>

                <button
                  onClick={() => { setOtpSent(false); setOtp(''); }}
                  className={`w-full text-sm text-primary hover:underline ${fontClass}`}
                >
                  {isUrdu ? 'دوبارہ کوڈ بھیجیں' : 'Resend code'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Auth;
