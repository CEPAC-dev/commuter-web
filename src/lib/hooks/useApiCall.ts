'use client';

import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { ApiError } from '@/lib/api/client';

export function useApiCall<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  opts: {
    onSuccess?:  (data: TResult) => void;
    onError?:    (err: ApiError) => void;
    successMsg?: string;
    errorMsg?:   string;
    showToast?:  boolean;
  } = {},
) {
  const [data,    setData]    = useState<TResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const execute = useCallback(
    async (...args: TArgs): Promise<TResult | null> => {
      setLoading(true);
      setError(null);
      try {
        const result = await fn(...args);
        setData(result);
        if (opts.showToast !== false && opts.successMsg) {
          toast.success(opts.successMsg);
        }
        opts.onSuccess?.(result);
        return result;
      } catch (e) {
        const err = e instanceof ApiError ? e : new ApiError(0, 'Unexpected error');
        const msg = opts.errorMsg ?? err.message;
        setError(msg);
        if (opts.showToast !== false) toast.error(msg);
        opts.onError?.(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fn],
  );

  return { data, loading, error, execute, setData };
}
