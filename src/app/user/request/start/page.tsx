'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useIntent } from '@/lib/IntentContext';

type RideType = 'private' | 'shared';
type SharedWith = 'known' | 'anyone';
type GroupAction = 'generate' | 'join';

type Step =
  | { id: 'ride' }
  | { id: 'sub-private' }
  | { id: 'sub-shared' }
  | { id: 'code' };

function genCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function RequestStartPage() {
  const router = useRouter();
  const t = useTranslations('request_start');
  const { intent, setIntent } = useIntent();
  const intentRideType = intent.ride_type;

  useEffect(() => {
    if (intentRideType !== null) {
      router.replace('/user/request/new');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [rideType, setRideType] = useState<RideType | null>(null);
  const [passengerCount, setPassengerCount] = useState(1);
  const [sharedWith, setSharedWith] = useState<SharedWith | null>(null);
  const [groupAction, setGroupAction] = useState<GroupAction | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinError, setJoinError] = useState(false);
  const [joining, setJoining] = useState(false);
  const [step, setStep] = useState<Step>({ id: 'ride' });

  function handleRideType(type: RideType) {
    setRideType(type);
    setSharedWith(null);
    setGroupAction(null);
    setGeneratedCode(null);
    setJoinCodeInput('');
  }

  function handleNext() {
    if (step.id === 'ride') {
      if (rideType === 'private') setStep({ id: 'sub-private' });
      else setStep({ id: 'sub-shared' });
      return;
    }
    if (step.id === 'sub-private') { finishAndNavigate(); return; }
    if (step.id === 'sub-shared') {
      if (sharedWith === 'anyone') { finishAndNavigate(); return; }
      setStep({ id: 'code' });
      return;
    }
    if (step.id === 'code') { finishAndNavigate(); }
  }

  function handleBack() {
    if (step.id === 'ride') { router.back(); return; }
    if (step.id === 'sub-private' || step.id === 'sub-shared') { setStep({ id: 'ride' }); return; }
    if (step.id === 'code') { setStep({ id: 'sub-shared' }); }
  }

  function finishAndNavigate() {
    setIntent({
      ride_type: rideType!,
      passenger_count: passengerCount,
      group_type: sharedWith === 'known' ? 'friends' : sharedWith === 'anyone' ? 'open' : null,
      group_action: groupAction === 'generate' ? 'create' : groupAction === 'join' ? 'join' : null,
      group_code: generatedCode ?? (joinCodeInput || null),
    });
    router.push('/user/request/new');
  }

  async function handleGenerateCode() {
    const code = genCode();
    try {
      await fetch('/api/cycles/group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
    } catch { /* offline */ }
    setGeneratedCode(code);
  }

  async function handleJoinCode() {
    const code = joinCodeInput.trim().toUpperCase();
    if (code.length !== 6) { setJoinError(true); return; }
    setJoining(true);
    setJoinError(false);
    try {
      const res = await fetch('/api/cycles/group/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) { setJoinError(true); setJoining(false); return; }
    } catch { /* offline */ }
    setJoining(false);
    finishAndNavigate();
  }

  function canProceed(): boolean {
    if (step.id === 'ride') return rideType !== null;
    if (step.id === 'sub-private') return true;
    if (step.id === 'sub-shared') return sharedWith !== null;
    if (step.id === 'code') {
      if (groupAction === 'generate') return generatedCode !== null;
      if (groupAction === 'join') return joinCodeInput.length === 6;
      return false;
    }
    return false;
  }

  const steps: Step['id'][] = (() => {
    if (!rideType) return ['ride'];
    if (rideType === 'private') return ['ride', 'sub-private'];
    if (sharedWith === 'anyone') return ['ride', 'sub-shared'];
    return ['ride', 'sub-shared', 'code'];
  })();

  const stepIndex = steps.indexOf(step.id);

  const passengerLabel = passengerCount === 1
    ? t('just_you')
    : t(passengerCount - 1 > 1 ? 'you_plus_plural' : 'you_plus', { count: passengerCount - 1 });

  const continueLabel =
    step.id === 'sub-private' || (step.id === 'sub-shared' && sharedWith === 'anyone') || step.id === 'code'
      ? t('continue_map')
      : t('continue');

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <button onClick={handleBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 13L5 8l5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {t('back')}
        </button>
        <div className="flex items-center gap-2">
          {steps.map((s, i) => (
            <div key={s} className={"rounded-full transition-all duration-200 " + (i === stepIndex ? 'w-5 h-2 bg-[#0B1E3D]' : i < stepIndex ? 'w-2 h-2 bg-[#00C2A8]' : 'w-2 h-2 bg-gray-200')} />
          ))}
        </div>
        <div className="w-12" />
      </div>

      <div className="flex-1 flex flex-col px-5 pt-6 pb-8 max-w-md mx-auto w-full">

        {step.id === 'ride' && (
          <>
            <h1 className="text-xl font-medium text-[#0B1E3D] mb-1">{t('how_travel')}</h1>
            <p className="text-sm text-gray-500 mb-8">{t('how_travel_desc')}</p>
            <div className="grid grid-cols-2 gap-3 mb-auto">
              {[
                { type: 'private', label: t('private_car'), desc: t('private_car_desc'), badge: t('private_badge') },
                { type: 'shared', label: t('shared_ride'), desc: t('shared_ride_desc'), badge: t('shared_badge') },
              ].map(({ type, label, desc, badge }) => (
                <button key={type} onClick={() => handleRideType(type as RideType)}
                  className={"flex flex-col items-start p-4 rounded-2xl border text-left transition-all duration-150 " + (rideType === type ? 'border-[#00C2A8] bg-[#EFF7F6]' : 'border-gray-200 bg-white hover:border-gray-300')}>
                  <div className="text-sm font-medium text-[#0B1E3D] mb-1">{label}</div>
                  <div className="text-xs text-gray-500 mb-3 leading-relaxed">{desc}</div>
                  <span className="text-xs bg-gray-100 text-gray-500 rounded px-2 py-0.5">{badge}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {step.id === 'sub-private' && (
          <>
            <h1 className="text-xl font-medium text-[#0B1E3D] mb-1">{t('how_many')}</h1>
            <p className="text-sm text-gray-500 mb-8">{t('how_many_desc')}</p>
            <div className="flex flex-col items-center gap-6 mb-auto">
              <div className="flex items-center gap-6">
                <button onClick={() => setPassengerCount(c => Math.max(1, c - 1))} disabled={passengerCount === 1}
                  className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center text-xl font-light text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition-all">−</button>
                <div className="text-center">
                  <div className="text-5xl font-medium text-[#0B1E3D] leading-none">{passengerCount}</div>
                  <div className="text-sm text-gray-400 mt-2">{passengerLabel}</div>
                </div>
                <button onClick={() => setPassengerCount(c => Math.min(4, c + 1))} disabled={passengerCount === 4}
                  className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center text-xl font-light text-gray-600 hover:bg-gray-50 disabled:opacity-30 transition-all">+</button>
              </div>
              <div className="text-xs text-gray-400 text-center">{t('max_note')}</div>
            </div>
          </>
        )}

        {step.id === 'sub-shared' && (
          <>
            <h1 className="text-xl font-medium text-[#0B1E3D] mb-1">{t('who_share')}</h1>
            <p className="text-sm text-gray-500 mb-8">{t('who_share_desc')}</p>
            <div className="grid grid-cols-2 gap-3 mb-auto">
              {[
                { val: 'known', label: t('people_know'), desc: t('people_know_desc'), badge: t('people_know_badge') },
                { val: 'anyone', label: t('anyone_nearby'), desc: t('anyone_nearby_desc'), badge: t('auto_matched') },
              ].map(({ val, label, desc, badge }) => (
                <button key={val} onClick={() => setSharedWith(val as SharedWith)}
                  className={"flex flex-col items-start p-4 rounded-2xl border text-left transition-all duration-150 " + (sharedWith === val ? 'border-[#00C2A8] bg-[#EFF7F6]' : 'border-gray-200 bg-white hover:border-gray-300')}>
                  <div className="text-sm font-medium text-[#0B1E3D] mb-1">{label}</div>
                  <div className="text-xs text-gray-500 mb-3 leading-relaxed">{desc}</div>
                  <span className="text-xs bg-gray-100 text-gray-500 rounded px-2 py-0.5">{badge}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {step.id === 'code' && (
          <>
            <h1 className="text-xl font-medium text-[#0B1E3D] mb-1">{t('group_code')}</h1>
            <p className="text-sm text-gray-500 mb-6">{t('group_code_desc')}</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { val: 'generate', label: t('create_group'), desc: t('create_group_desc') },
                { val: 'join', label: t('join_group'), desc: t('join_group_desc') },
              ].map(({ val, label, desc }) => (
                <button key={val} onClick={() => { setGroupAction(val as GroupAction); setGeneratedCode(null); setJoinCodeInput(''); setJoinError(false); }}
                  className={"flex flex-col items-start p-4 rounded-2xl border text-left transition-all duration-150 " + (groupAction === val ? 'border-[#00C2A8] bg-[#EFF7F6]' : 'border-gray-200 bg-white hover:border-gray-300')}>
                  <div className="text-sm font-medium text-[#0B1E3D] mb-1">{label}</div>
                  <div className="text-xs text-gray-500">{desc}</div>
                </button>
              ))}
            </div>

            {groupAction === 'generate' && (
              <div className="mb-auto">
                {!generatedCode ? (
                  <button onClick={handleGenerateCode} className="w-full h-12 rounded-xl bg-[#EFF7F6] border border-[#00C2A8] text-[#085041] text-sm font-medium hover:bg-[#00C2A8] hover:text-[#0B1E3D] transition-all">{t('generate_code')}</button>
                ) : (
                  <div className="space-y-3">
                    <div className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">{t('share_code_note')}</div>
                    <button onClick={() => navigator.clipboard.writeText(generatedCode).catch(() => {})}
                      className="w-full flex items-center justify-center gap-3 py-4 rounded-xl border border-gray-200 bg-gray-50 font-mono text-2xl font-medium tracking-[6px] text-[#0B1E3D] hover:border-[#00C2A8] transition-all">
                      {generatedCode}
                    </button>
                    <a href={"https://wa.me/?text=" + encodeURIComponent(t('whatsapp_message', { code: generatedCode }))} target="_blank" rel="noreferrer"
                      className="flex items-center justify-center py-2.5 rounded-xl border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 transition-all">{t('share_whatsapp')}</a>
                  </div>
                )}
              </div>
            )}

            {groupAction === 'join' && (
              <div className="mb-auto space-y-3">
                <div className="flex gap-2">
                  <input type="text" maxLength={6} value={joinCodeInput}
                    onChange={e => { const v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,''); setJoinCodeInput(v); setJoinError(false); if(v.length===6) handleJoinCode(); }}
                    placeholder="ABC123"
                    className={"flex-1 h-12 rounded-xl border text-center font-mono text-lg tracking-widest outline-none transition-all " + (joinError ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-[#00C2A8]')} />
                  <button onClick={handleJoinCode} disabled={joinCodeInput.length !== 6 || joining}
                    className="h-12 px-5 rounded-xl bg-[#0B1E3D] text-[#00C2A8] text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-all">
                    {joining ? '…' : t('join')}
                  </button>
                </div>
                {joinError && <p className="text-xs text-red-500">{t('code_not_found')}</p>}
              </div>
            )}
          </>
        )}

        <div className="mt-8 pt-4 border-t border-gray-100">
          <button onClick={handleNext} disabled={!canProceed()}
            className={"w-full h-12 rounded-xl text-sm font-medium transition-all " + (canProceed() ? 'bg-[#0B1E3D] text-[#00C2A8] hover:opacity-90' : 'bg-gray-100 text-gray-400 cursor-not-allowed')}>
            {continueLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
