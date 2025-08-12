const cache = {};
const usage = {};

export const getCache = (key) => {
  const entry = cache[key];
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    delete cache[key];
    return null;
  }
  return entry.value;
};

export const setCache = (key, value, ttl = 86400) => {
  cache[key] = {
    value,
    expiry: Date.now() + ttl * 1000
  };
};

export const incrementUsage = (apiName) => {
  const today = new Date().toISOString().slice(0, 10);
  const key = `${apiName}:${today}`;
  usage[key] = (usage[key] || 0) + 1;
  return usage[key];
};

export const getUsage = (apiName) => {
  const today = new Date().toISOString().slice(0, 10);
  const key = `${apiName}:${today}`;
  return usage[key] || 0;
}; 