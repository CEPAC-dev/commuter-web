'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import PasswordInput from '@/components/shared/PasswordInput';
import { changePassword } from '@/lib/api/auth';
import { useTranslations } from 'next-intl';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose }: Props) {
  const t = useTranslations('change_password');
  const tc = useTranslations('common');
  const [current, setCurrent]     = useState('');
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [currentErr, setCurrentErr] = useState('');
  const [pwErr, setPwErr]         = useState('');
  const [confirmErr, setConfirmErr] = useState('');
  const [loading, setLoading]     = useState(false);

  function reset() {
    setCurrent(''); setPassword(''); setConfirm('');
    setCurrentErr(''); setPwErr(''); setConfirmErr('');
  }

  function handleClose() {
    reset();
    onClose();
  }

  function validate(): boolean {
    let ok = true;
    setCurrentErr(''); setPwErr(''); setConfirmErr('');
    if (current.length < 1) { setCurrentErr(t('current_error')); ok = false; }
    if (password.length < 8) { setPwErr(t('pw_error')); ok = false; }
    if (password !== confirm) { setConfirmErr(t('confirm_error')); ok = false; }
    return ok;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await changePassword(current, password, confirm);
      toast.success(t('success'));
      handleClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('failed');
      // Surface backend errors on the relevant field
      if (msg.toLowerCase().includes('current') || msg.toLowerCase().includes('wrong') || msg.toLowerCase().includes('incorrect')) {
        setCurrentErr(msg);
      } else {
        setPwErr(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        style={{
          background: '#fff', borderRadius: 16,
          padding: 28, width: '100%', maxWidth: 420,
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0B1E3D' }}>{t('title')}</h2>
          <button
            onClick={handleClose}
            aria-label={t('close')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', display: 'flex', alignItems: 'center', padding: 4 }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <PasswordInput
            label={t('current_label')}
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            placeholder={t('current_placeholder')}
            error={currentErr}
            autoComplete="current-password"
          />
          <PasswordInput
            label={t('new_label')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('new_placeholder')}
            error={pwErr}
            autoComplete="new-password"
          />
          <PasswordInput
            label={t('confirm_label')}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={t('confirm_placeholder')}
            error={confirmErr}
            autoComplete="new-password"
          />

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button
              type="button"
              onClick={handleClose}
              style={{
                flex: 1, height: 48, borderRadius: 10, border: '1.5px solid #D1D5DB',
                background: '#fff', color: '#5A6A7A', fontWeight: 600, fontSize: 14,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {tc('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1, height: 48, borderRadius: 10, border: 'none',
                background: '#00C2A8', color: '#0B1E3D', fontWeight: 700, fontSize: 14,
                cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                opacity: loading ? 0.65 : 1,
              }}
            >
              {loading && <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />}
              {t('save_btn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
