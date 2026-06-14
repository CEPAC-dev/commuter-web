'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import authApi, {
  extractToken, extractRole, extractName, extractId,
  type AuthApiResponse,
} from '@/lib/api/auth';
import { sendOtp, verifyOtp } from '@/lib/api/auth';
import { useAuth } from '@/lib/auth/AuthContext';
import { useRedirectIfAuth } from '@/lib/auth/useRedirectIfAuth';
import { saveUserData } from '@/lib/auth/tokenStorage';
import Step1Info,    { type Step1Data } from './steps/Step1Info';
import Step2Address, { type Step2Data } from './steps/Step2Address';
import Step3Otp from './steps/Step3Otp';

// ── Step indicator ────────────────────────────────────────────────────────────

function StepBar({ current, steps }: { current: 1 | 2 | 3; steps: readonly string[] }) {
  return (
    <div className="flex items-center mb-8" role="list" aria-label="Sign-up progress">
      {steps.map((label, idx) => {
        const n        = (idx + 1) as 1 | 2 | 3;
        const done     = n < current;
        const active   = n === current;

        return (
          <div key={n} className="flex items-center flex-1 last:flex-none" role="listitem">
            <div
              className={[
                'flex items-center justify-center w-8 h-8 rounded-full border-2 flex-shrink-0 text-xs font-bold transition-all',
                done   ? 'bg-[#00C2A8] border-[#00C2A8] text-[#0B1E3D]'
                       : active
                       ? 'bg-white border-[#00C2A8] text-[#00C2A8] shadow-[0_0_0_3px_rgba(0,194,168,0.2)]'
                       : 'bg-white border-[#D1D5DB] text-[#9CA3AF]',
              ].join(' ')}
              aria-current={active ? 'step' : undefined}
            >
              {done ? (
                <svg width="12" height="10" viewBox="0 0 12 10" fill="none" aria-hidden>
                  <path d="M1 5L4.5 8.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                n
              )}
            </div>

            <span className={[
              'ml-1.5 text-xs whitespace-nowrap',
              active ? 'text-[#0B1E3D] font-semibold' : done ? 'text-[#00C2A8] font-medium' : 'text-[#9CA3AF]',
            ].join(' ')}>
              {label}
            </span>

            {/* connector */}
            {idx < steps.length - 1 && (
              <div className={`flex-1 h-px mx-3 ${done ? 'bg-[#00C2A8]' : 'bg-[#E2E8F0]'}`} aria-hidden />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Wizard ────────────────────────────────────────────────────────────────────

export default function UserSignUpForm() {
  const t = useTranslations('sign_up_form');
  const router = useRouter();
  const { login } = useAuth();

  const [step,          setStep]          = useState<1 | 2 | 3>(1);
  const [step1Data,     setStep1Data]     = useState<Partial<Step1Data>>({});
  const [loading,       setLoading]       = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [otpError,      setOtpError]      = useState<string | null>(null);
  // store auth response between step 2 and step 3
  const [pendingAuth,   setPendingAuth]   = useState<AuthApiResponse | null>(null);

  // If already logged in, skip the wizard entirely (handles bfcache too)
  useRedirectIfAuth();

  function handleStep1(data: Step1Data) {
    setStep1Data(data);
    setStep(2);
  }

  async function handleStep2(addrData: Step2Data) {
    if (!step1Data.name) return; // guard
    setLoading(true);
    try {
      const result = await authApi.register({
        role:                  'user',
        name:                  step1Data.name!.trim(),
        email:                 step1Data.email!.trim(),
        phone_number:          step1Data.phone_number!,
        whatsapp_number:       step1Data.whatsapp_same_as_phone
                                 ? step1Data.phone_number!
                                 : step1Data.whatsapp_number!,
        province:              addrData.province.trim(),
        gender:                step1Data.gender ?? 'male',
        birthdate:             step1Data.birthdate ?? '',
        district:              addrData.district.trim(),
        sub_district:          addrData.sub_district.trim(),
        building:              addrData.building.trim(),
        street:                addrData.street.trim(),
        landmark:              addrData.landmark.trim(),
        password:              step1Data.password!,
        password_confirmation: step1Data.password_confirmation!,
      });
      setPendingAuth(result);
      // Send OTP to the registered email
      await sendOtp(step1Data.email!.trim());
      setStep(3);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('signup_failed'));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(code: string) {
    if (!step1Data.email || !pendingAuth) return;
    setLoading(true);
    setOtpError(null);
    try {
      await verifyOtp(step1Data.email.trim(), code);
      const token = extractToken(pendingAuth);
      if (token) {
        login({
          token,
          role: extractRole(pendingAuth) || 'user',
          name: extractName(pendingAuth) || step1Data.name!.trim(),
          id:   extractId(pendingAuth),
        });
        if (typeof window !== 'undefined') localStorage.setItem('commuter_email', step1Data.email!.trim());
        // Store everything we submitted so the profile shows real data immediately
        const registeredUser = (pendingAuth as AuthApiResponse & { user?: Record<string, unknown> }).user ?? {};
        saveUserData({
          ...registeredUser,
          name:            step1Data.name!.trim(),
          email:           step1Data.email!.trim(),
          phone_number:    step1Data.phone_number ?? '',
          whatsapp_number: step1Data.whatsapp_same_as_phone ? step1Data.phone_number : (step1Data.whatsapp_number ?? ''),
          gender:          step1Data.gender ?? 'male',
          date_of_birth:   step1Data.birthdate ?? '',
        });
        toast.success(t('welcome_toast', { name: step1Data.name!.trim() }));
        router.replace('/user/onboarding');
      } else {
        // No auto-login token from backend — send to sign-in with success flag
        router.replace('/sign-in?registered=true');
      }
    } catch (err: unknown) {
      setOtpError(err instanceof Error ? err.message : 'Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    if (!step1Data.email) return;
    setResendLoading(true);
    setOtpError(null);
    try {
      await sendOtp(step1Data.email.trim());
      toast.success(t('resend_success'));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : t('resend_failed'));
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-[28px] font-bold text-[#0B1E3D] mb-1">{t('title')}</h1>
      <p className="text-sm text-[#5A6A7A] mb-6">{t('subtitle')}</p>

      <StepBar current={step} steps={[t('step_personal'), t('step_address'), t('step_verify')]} />

      {step === 1 && (
        <Step1Info initial={step1Data} onNext={handleStep1} />
      )}
      {step === 2 && (
        <Step2Address
          initial={{}}
          loading={loading}
          onBack={() => setStep(1)}
          onSubmit={handleStep2}
        />
      )}
      {step === 3 && (
        <Step3Otp
          email={step1Data.email ?? ''}
          loading={loading}
          resendLoading={resendLoading}
          error={otpError}
          onVerify={handleVerifyOtp}
          onResend={handleResendOtp}
        />
      )}

      <p className="mt-5 text-center text-sm text-[#5A6A7A]">
        {t('have_account')}{' '}
        <a href="/sign-in" className="text-[#00C2A8] font-medium hover:underline">
          {t('sign_in_link')}
        </a>
      </p>
    </div>
  );
}
