
// Shared in-memory cache for authenticated admin data.

const cache = new Map();
const pendingRequests = new Map();
const keyVersions = new Map();

let activeToken = null;

const syncToken = (token) => {
  if (activeToken !== token) {
    cache.clear();
    pendingRequests.clear();
    keyVersions.clear();
    activeToken = token;
  }
};

export const getAdminCache = (key, token) => {
  if (!token) return null;

  syncToken(token);

  return cache.get(key)?.data ?? null;
};

export const fetchAdminData = async (
  key,
  fetcher,
  token,
  { force = false } = {}
) => {
  if (!token) {
    throw new Error("Admin authentication is required.");
  }

  syncToken(token);

  if (!force && pendingRequests.has(key)) {
    return pendingRequests.get(key);
  }

  const requestToken = token;
  const requestVersion = keyVersions.get(key) || 0;

  const request = (async () => {
    const data = await fetcher();

    // Prevent old requests from repopulating invalidated or
    // previous-session cache entries.
    if (
      activeToken === requestToken &&
      (keyVersions.get(key) || 0) === requestVersion
    ) {
      cache.set(key, {
        data,
        updatedAt: Date.now(),
      });
    }

    return data;
  })();

  pendingRequests.set(key, request);

  try {
    return await request;
  } finally {
    if (pendingRequests.get(key) === request) {
      pendingRequests.delete(key);
    }
  }
};

export const invalidateAdminData = (...keys) => {
  keys.forEach((key) => {
    cache.delete(key);
    keyVersions.set(key, (keyVersions.get(key) || 0) + 1);
    pendingRequests.delete(key);
  });
};

export const clearAdminDataCache = () => {
  cache.clear();
  pendingRequests.clear();
  keyVersions.clear();
  activeToken = null;
};
