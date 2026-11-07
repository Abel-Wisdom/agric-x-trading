
import { useCallback, useEffect, useState } from "react";
import {
  getPublicCollection,
  getPublicDetail,
  loadPublicCollection,
  loadPublicDetail,
  subscribePublicData,
} from "../services/publicDataCache.js";

// Shared hook for Research, Articles, and Videos collection pages.
export function usePublicCollection(type) {
  const [data, setData] = useState(
    () => getPublicCollection(type)
  );

  const [loading, setLoading] = useState(
    () => getPublicCollection(type) === null
  );

  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const unsubscribe = subscribePublicData(
      (updatedType, updatedData) => {
        if (!active || updatedType !== type) return;

        if (Array.isArray(updatedData)) {
          setData(updatedData);
          setError("");
          setLoading(false);
        }
      }
    );

    loadPublicCollection(type)
      .then((records) => {
        if (!active) return;

        setData(records);
        setError("");
      })
      .catch((err) => {
        if (!active) return;

        setError(err.message || "Unable to load content.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [type]);

  const retry = useCallback(async () => {
    setError("");

    if (!data) {
      setLoading(true);
    }

    try {
      const records = await loadPublicCollection(type, {
        force: true,
      });

      setData(records);
      setError("");
    } catch (err) {
      setError(err.message || "Unable to load content.");
    } finally {
      setLoading(false);
    }
  }, [type, data]);

  return { data, loading, error, retry };
}

// Shared hook for individual Research, Article, and Video pages.
export function usePublicDetail(type, slug) {
  const [data, setData] = useState(
    () => (slug ? getPublicDetail(type, slug) : null)
  );

  const [loading, setLoading] = useState(
    () => Boolean(slug) && getPublicDetail(type, slug) === null
  );

  const [error, setError] = useState(
    () => (slug ? "" : "A valid content address is required.")
  );

  useEffect(() => {
    let active = true;

    // Invalid slugs need no request or state update inside the effect.
    if (!slug) {
      return () => {
        active = false;
      };
    }

    // Keep detail pages synchronized with collection updates.
    const unsubscribe = subscribePublicData(
      (updatedType, updatedData) => {
        if (!active || updatedType !== type) return;
        if (!Array.isArray(updatedData)) return;

        const matchingRecord = updatedData.find(
          (item) => item.slug === slug
        );

        if (matchingRecord) {
          setData(matchingRecord);
          setError("");
          setLoading(false);
        } else {
          setData(null);
          setError("This content is no longer available.");
          setLoading(false);
        }
      }
    );

    loadPublicDetail(type, slug)
      .then((record) => {
        if (!active) return;

        setData(record);
        setError("");
      })
      .catch((err) => {
        if (!active) return;

        setError(err.message || "Unable to load this content.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [type, slug]);

  const retry = useCallback(async () => {
    if (!slug) {
      setError("A valid content address is required.");
      return;
    }

    setError("");

    if (!data) {
      setLoading(true);
    }

    try {
      const record = await loadPublicDetail(type, slug, {
        force: true,
      });

      setData(record);
      setError("");
    } catch (err) {
      setError(err.message || "Unable to load this content.");
    } finally {
      setLoading(false);
    }
  }, [type, slug, data]);

  return { data, loading, error, retry };
}
