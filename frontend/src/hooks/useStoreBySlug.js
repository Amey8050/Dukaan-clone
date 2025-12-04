import { useEffect, useState } from 'react';
import storeService from '../services/storeService';

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const useStoreBySlug = (slug) => {
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(Boolean(slug));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) {
      setStore(null);
      setLoading(false);
      setError('Missing store reference');
      return;
    }

    let isMounted = true;

    const fetchStore = async () => {
      setLoading(true);
      setError('');

      try {
        const isUuid = uuidRegex.test(slug);
        const result = isUuid
          ? await storeService.getStore(slug)
          : await storeService.getStoreBySlug(slug);

        if (result.success) {
          if (isMounted) {
            setStore(result.data.store);
            setError('');
          }
        } else if (isMounted) {
          setStore(null);
          setError(result.error?.message || 'Store not found');
        }
      } catch (err) {
        if (isMounted) {
          setStore(null);
          setError(err.response?.data?.error?.message || 'Failed to load store');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchStore();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  return {
    store,
    storeId: store?.id || null,
    loading,
    error
  };
};

export default useStoreBySlug;

