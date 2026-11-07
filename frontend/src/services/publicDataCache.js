
const API_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://localhost:8000/api" : "/api")
).replace(/\/$/, "");

const CACHE_DURATION = 3 * 60 * 1000;
const STORAGE_PREFIX = "agric_x_public_cache_v1_";
const REFRESH_INTERVAL = 3 * 60 * 1000;

const resources = {
  research: {
    collectionUrl: "/research/published",
    collectionKey: "reports",
    detailKey: "report",
    detailUrl: (slug) =>
      `/research/published/${encodeURIComponent(slug)}`,
  },

  articles: {
    collectionUrl: "/articles/published",
    collectionKey: "articles",
    detailKey: "article",
    detailUrl: (slug) =>
      `/articles/published/${encodeURIComponent(slug)}`,
  },

  videos: {
    collectionUrl: "/videos/published",
    collectionKey: "videos",
    detailKey: "video",
    detailUrl: (slug) =>
      `/videos/published/${encodeURIComponent(slug)}`,
  },
};

// VNS 1: SHARED CACHE STORAGE
const collectionCache = new Map();
const detailCache = new Map();
const collectionRequests = new Map();
const detailRequests = new Map();
const listeners = new Set();

let cacheStarted = false;
let refreshTimer = null;

// VNS 2: SAFE BROWSER STORAGE
const readStoredCollection = (type) => {
  try {
    const stored = sessionStorage.getItem(
      `${STORAGE_PREFIX}${type}`
    );

    if (!stored) return null;

    const parsed = JSON.parse(stored);

    if (
      !Array.isArray(parsed.data) ||
      typeof parsed.cachedAt !== "number"
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

const saveStoredCollection = (type, entry) => {
  try {
    sessionStorage.setItem(
      `${STORAGE_PREFIX}${type}`,
      JSON.stringify(entry)
    );
  } catch {
    // The in-memory cache remains usable if storage is full or unavailable.
  }
};

const removeStoredCollection = (type) => {
  try {
    sessionStorage.removeItem(
      `${STORAGE_PREFIX}${type}`
    );
  } catch {
    // Storage is optional.
  }
};

// VNS 3: INITIALIZE EXISTING CACHED COLLECTIONS
Object.keys(resources).forEach((type) => {
  const stored = readStoredCollection(type);

  if (stored) {
    collectionCache.set(type, stored);
  }
});

// VNS 4: NOTIFY CONNECTED PUBLIC PAGES
const notifyListeners = (type, data) => {
  listeners.forEach((listener) => {
    try {
      listener(type, data);
    } catch (error) {
      console.error("Public cache listener error:", error);
    }
  });
};

export const subscribePublicData = (listener) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

// VNS 5: READ CACHED COLLECTION DATA
export const getPublicCollection = (type) => {
  return collectionCache.get(type)?.data ?? null;
};

// VNS 6: READ CACHED DETAIL DATA
export const getPublicDetail = (type, slug) => {
  if (!resources[type] || !slug) return null;

  const collection = collectionCache.get(type)?.data;

  const collectionRecord = collection?.find(
    (item) => item.slug === slug
  );

  if (collectionRecord) {
    return collectionRecord;
  }

  return detailCache.get(`${type}:${slug}`)?.data ?? null;
};

// VNS 7: CHECK CACHE FRESHNESS
const isFresh = (entry) => {
  return (
    entry &&
    Date.now() - entry.cachedAt < CACHE_DURATION
  );
};

// VNS 8: UPDATE COLLECTION CACHE
const saveCollection = (type, data) => {
  const entry = {
    data,
    cachedAt: Date.now(),
  };

  collectionCache.set(type, entry);
  saveStoredCollection(type, entry);

  // Keep detail records synchronized with the latest public collection.
  const publishedSlugs = new Set(
    data.map((item) => item.slug).filter(Boolean)
  );

  for (const key of detailCache.keys()) {
    if (!key.startsWith(`${type}:`)) continue;

    const slug = key.slice(type.length + 1);

    if (!publishedSlugs.has(slug)) {
      detailCache.delete(key);
    }
  }

  data.forEach((item) => {
    if (!item.slug) return;

    detailCache.set(`${type}:${item.slug}`, {
      data: item,
      cachedAt: Date.now(),
    });
  });

  notifyListeners(type, data);
};

// VNS 9: FETCH AND VALIDATE PUBLIC API RESPONSES
const fetchPublicData = async (url) => {
  const response = await fetch(`${API_URL}${url}`);

  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error("The server returned an invalid response.");
  }

  if (!response.ok || result.success === false) {
    throw new Error(
      result.message || "Unable to retrieve public content."
    );
  }

  return result;
};

// VNS 10: LOAD A PUBLIC COLLECTION
export const loadPublicCollection = (
  type,
  { force = false } = {}
) => {
  const config = resources[type];

  if (!config) {
    return Promise.reject(
      new Error(`Unknown public resource: ${type}`)
    );
  }

  const cached = collectionCache.get(type);

  // Return cached data immediately and refresh it in the background
  // whenever it becomes stale.
  if (cached && !force) {
    if (!isFresh(cached)) {
      loadPublicCollection(type, { force: true }).catch(
        (error) => {
          console.warn(
            `Background refresh failed for ${type}:`,
            error.message
          );
        }
      );
    }

    return Promise.resolve(cached.data);
  }

  // Reuse an existing request instead of making duplicate requests.
  if (collectionRequests.has(type)) {
    return collectionRequests.get(type);
  }

  const request = fetchPublicData(config.collectionUrl)
    .then((result) => {
      const data = result[config.collectionKey];

      if (!Array.isArray(data)) {
        throw new Error(
          `The ${type} response did not contain a valid collection.`
        );
      }

      saveCollection(type, data);

      return data;
    })
    .finally(() => {
      collectionRequests.delete(type);
    });

  collectionRequests.set(type, request);

  return request;
};

// VNS 11: LOAD ONE PUBLIC DETAIL RECORD
export const loadPublicDetail = (
  type,
  slug,
  { force = false } = {}
) => {
  const config = resources[type];

  if (!config || !slug) {
    return Promise.reject(
      new Error("A valid resource type and slug are required.")
    );
  }

  const key = `${type}:${slug}`;
  const collection = collectionCache.get(type);

  // Collection endpoints already include the full public records.
  const collectionRecord = collection?.data.find(
    (item) => item.slug === slug
  );

  if (collectionRecord && !force) {
    if (!isFresh(collection)) {
      loadPublicCollection(type, { force: true }).catch(
        (error) => {
          console.warn(
            `Background refresh failed for ${type}:`,
            error.message
          );
        }
      );
    }

    return Promise.resolve(collectionRecord);
  }

  const cached = detailCache.get(key);

  if (cached && !force) {
    if (!isFresh(cached)) {
      loadPublicDetail(type, slug, { force: true }).catch(
        (error) => {
          console.warn(
            `Background detail refresh failed for ${key}:`,
            error.message
          );
        }
      );
    }

    return Promise.resolve(cached.data);
  }

  if (detailRequests.has(key)) {
    return detailRequests.get(key);
  }

  const request = fetchPublicData(
    config.detailUrl(slug)
  )
    .then((result) => {
      const record = result[config.detailKey];

      if (!record || record.slug !== slug) {
        throw new Error(
          "The requested public record was not returned."
        );
      }

      detailCache.set(key, {
        data: record,
        cachedAt: Date.now(),
      });

      notifyListeners(type, getPublicCollection(type));

      return record;
    })
    .finally(() => {
      detailRequests.delete(key);
    });

  detailRequests.set(key, request);

  return request;
};

// VNS 12: PREFETCH ALL PUBLIC COLLECTIONS
export const prefetchPublicData = async () => {
  const results = await Promise.allSettled([
    loadPublicCollection("research"),
    loadPublicCollection("articles"),
    loadPublicCollection("videos"),
  ]);

  return results;
};

// VNS 13: REFRESH ONE PUBLIC COLLECTION
export const refreshPublicCollection = (type) => {
  return loadPublicCollection(type, { force: true });
};

// VNS 14: INVALIDATE AFTER ADMIN CONTENT CHANGES
export const invalidatePublicData = (type) => {
  if (!resources[type]) return Promise.resolve(null);

  collectionCache.delete(type);
  removeStoredCollection(type);

  for (const key of detailCache.keys()) {
    if (key.startsWith(`${type}:`)) {
      detailCache.delete(key);
    }
  }

  notifyListeners(type, null);

  return refreshPublicCollection(type);
};

// VNS 15: BACKGROUND REFRESH
const refreshVisibleCollections = () => {
  if (
    typeof document !== "undefined" &&
    document.visibilityState !== "visible"
  ) {
    return;
  }

  Object.keys(resources).forEach((type) => {
    if (!collectionCache.has(type)) return;

    loadPublicCollection(type, { force: true }).catch(
      (error) => {
        console.warn(
          `Automatic refresh failed for ${type}:`,
          error.message
        );
      }
    );
  });
};

// VNS 16: START THE SHARED CACHE ON APPLICATION STARTUP
export const startPublicDataCache = () => {
  if (
    cacheStarted ||
    typeof window === "undefined"
  ) {
    return;
  }

  cacheStarted = true;

  // Start loading public collections without blocking the application.
  prefetchPublicData();

  window.addEventListener(
    "focus",
    refreshVisibleCollections
  );

  window.addEventListener(
    "online",
    refreshVisibleCollections
  );

  document.addEventListener(
    "visibilitychange",
    refreshVisibleCollections
  );

  refreshTimer = window.setInterval(
    refreshVisibleCollections,
    REFRESH_INTERVAL
  );
};

// VNS 17: CLEAN UP BACKGROUND REFRESH WHEN NEEDED
export const stopPublicDataCache = () => {
  if (!cacheStarted || typeof window === "undefined") {
    return;
  }

  window.removeEventListener(
    "focus",
    refreshVisibleCollections
  );

  window.removeEventListener(
    "online",
    refreshVisibleCollections
  );

  document.removeEventListener(
    "visibilitychange",
    refreshVisibleCollections
  );

  if (refreshTimer !== null) {
    window.clearInterval(refreshTimer);
  }

  refreshTimer = null;
  cacheStarted = false;
};
