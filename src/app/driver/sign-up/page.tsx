'use client';

import { Toaster } from 'react-hot-toast';
import { useTranslations } from 'next-intl';
import AuthSplitLayout from '@/components/shared/AuthSplitLayout';
import DriverSignUpWizard from '@/components/auth/driver/DriverSignUpWizard';
import { CheckCircle } from 'lucide-react';

function DriverSignUpLeft() {
  const t = useTranslations('driver_signup.left_panel');
  const checklist = [
    'Personal information',
    'Your car details',
    'Upload your documents',
  ];

  return (
    <div className="text-white">
      <div className="mb-8">
        <h2 className="text-4xl font-bold leading-tight mb-3">
          {t('headline1')}<br />
          <span style={{ color: '#00C2A8' }}>{t('headline2')}</span>
        </h2>
        <p className="text-white/65 text-[15px] leading-relaxed">
          {t('desc')}
        </p>
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium text-white/80 mb-3">What you&apos;ll need to register:</p>
        {checklist.map((item, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <CheckCircle size={16} className="text-secondary flex-shrink-0 mt-0.5" />
            <span className="text-white/80 text-sm leading-relaxed whitespace-pre-line">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DriverSignUpPage() {
  return (
    <>
      <Toaster position="top-right" />
      <AuthSplitLayout
        role="driver"
        leftContent={<DriverSignUpLeft />}
        rightContent={<DriverSignUpWizard />}
      />
    </>
  );
}
