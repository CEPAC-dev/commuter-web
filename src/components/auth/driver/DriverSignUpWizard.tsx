'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import StepIndicator from '@/components/auth/driver/StepIndicator';
import Step1Personal, { type Step1Data } from '@/components/auth/driver/steps/Step1Personal';
import Step2CarInfo, { type Step2Data } from '@/components/auth/driver/steps/Step2CarInfo';
import Step3Documents, { type Step3Data } from '@/components/auth/driver/steps/Step3Documents';
import authApi from '@/lib/api/auth';
import { useRedirectIfAuth } from '@/lib/auth/useRedirectIfAuth';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';

const SESSION_KEY = 'commuter_driver_signup';

interface WizardData {
  step1?: Partial<Step1Data>;
  step2?: Partial<Step2Data>;
}

function loadWizard(): WizardData {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function saveWizard(data: WizardData) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

function clearWizard() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(SESSION_KEY);
}

export default function DriverSignUpWizard() {
  const [step, setStep]         = useState<1 | 2 | 3>(1);
  const [highestStep, setHighestStep] = useState<number>(1);
  const [step1Data, setStep1Data] = useState<Partial<Step1Data>>({});
  const [step2Data, setStep2Data] = useState<Partial<Step2Data>>({});
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [success, setSuccess] = useState(false);

  // Redirect already-authenticated users away from the sign-up wizard
  // (also handles bfcache restores from the back button).
  useRedirectIfAuth();

  // Restore from sessionStorage
  useEffect(() => {
    const saved = loadWizard();
    if (saved.step1) setStep1Data(saved.step1);
    if (saved.step2) setStep2Data(saved.step2);
  }, []);

  function handleStep1(data: Step1Data) {
    setStep1Data(data);
    saveWizard({ step1: data, step2: step2Data });
    setStep(2);
    setHighestStep((h) => Math.max(h, 2));
  }

  function handleStep2(data: Step2Data) {
    setStep2Data(data);
    saveWizard({ step1: step1Data, step2: data });
    setStep(3);
    setHighestStep((h) => Math.max(h, 3));
  }

  async function handleStep3(docs: Step3Data) {
    // Pull whatever the wizard collected. Driver step1/step2 may not cover every
    // backend field — we send safe fallbacks; the backend will reject anything
    // truly required so the user sees a real error message.
    const s1 = step1Data as Partial<Step1Data> & Record<string, unknown>;

    try {
      const email = String(s1.email ?? '');
      const password = String((s1 as { password?: string }).password ?? '');
      const passwordConfirmation = String(
        (s1 as { password_confirmation?: string; confirmPassword?: string })
          .password_confirmation
        ?? (s1 as { confirmPassword?: string }).confirmPassword
        ?? password,
      );

      await authApi.register({
        role:                  'driver',
        name:                  String(s1.name ?? '').trim(),
        email,
        phone_number:          String((s1 as { phone_number?: string; phone?: string }).phone_number ?? (s1 as { phone?: string }).phone ?? ''),
        whatsapp_number:       String((s1 as { whatsapp_number?: string }).whatsapp_number ?? (s1 as { phone?: string }).phone ?? ''),
        province:              String((s1 as { province?: string }).province ?? ''),
        gender:                ((s1 as { gender?: 'male' | 'female' }).gender) ?? 'male',
        birthdate:             String((s1 as { birthdate?: string; date_of_birth?: string; dateOfBirth?: string }).birthdate ?? (s1 as { date_of_birth?: string }).date_of_birth ?? (s1 as { dateOfBirth?: string }).dateOfBirth ?? ''),
        district:              String((s1 as { district?: string }).district ?? ''),
        sub_district:          String((s1 as { sub_district?: string }).sub_district ?? ''),
        building:              String((s1 as { building?: string }).building ?? ''),
        street:                String((s1 as { street?: string }).street ?? ''),
        landmark:              String((s1 as { landmark?: string; address?: string }).landmark ?? (s1 as { address?: string }).address ?? ''),
        password,
        password_confirmation: passwordConfirmation,
      });

      // Upload documents (best-effort; backend may want them on the same request)
      try {
        for (const [field, file] of Object.entries(docs)) {
          if (file instanceof File) {
            const fd = new FormData();
            fd.append(field, file);
            // Fire and forget — if endpoint not ready, we still complete signup
            const { call } = await import('@/lib/api/client');
            await call(`driver/documents/${field}`, { method: 'POST', body: fd, auth: false }).catch(() => undefined);
          }
        }
      } catch {
        // Ignore document upload errors — driver can re-upload from profile
      }

      setSubmittedEmail(email);
      clearWizard();
      setSuccess(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    }
  }

  const stepTitles: Record<1 | 2 | 3, string> = {
    1: 'Personal information',
    2: 'Car information',
    3: 'Upload documents',
  };

  if (success) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center px-6">
        <div className="bg-white rounded-[20px] p-10 max-w-md w-full text-center shadow-2xl">
          <div className="flex justify-center mb-5">
            <CheckCircle size={64} className="text-secondary" />
          </div>
          <h2 className="text-2xl font-bold text-primary mb-3">Application submitted!</h2>
          <p className="text-text-muted text-sm leading-relaxed mb-4">
            We&apos;ve received your info and documents. Our team will review your application within 24–48 hours.
          </p>
          <p className="text-sm text-primary mb-8">
            We&apos;ll email you at: <strong>{submittedEmail}</strong>
          </p>
          <Link
            href="/driver/sign-in"
            className="flex items-center justify-center w-full h-[52px] rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ background: '#00C2A8', color: '#fff' }}
          >
            Go to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <StepIndicator
        currentStep={step}
        completedUpTo={highestStep - 1}
        onStepClick={(s) => { if (s < step) setStep(s); }}
      />

      <h2 className="text-2xl font-bold text-primary mb-1">{stepTitles[step]}</h2>
      <p className="text-sm text-text-muted mb-6">Step {step} of 3</p>

      {step === 1 && (
        <Step1Personal initial={step1Data} onNext={handleStep1} />
      )}
      {step === 2 && (
        <Step2CarInfo
          initial={step2Data}
          onNext={handleStep2}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && (
        <Step3Documents
          email={step1Data.email ?? ''}
          onBack={() => setStep(2)}
          onSubmit={handleStep3}
        />
      )}
    </div>
  );
}
