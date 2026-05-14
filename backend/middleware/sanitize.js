function clean(value) {
  if (typeof value === 'string') return value.replace(/<[^>]*>/g, '').trim();
  if (Array.isArray(value)) return value.map(clean);
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, clean(v)]));
  }
  return value;
}

module.exports = (req, _res, next) => {
  if (req.body) req.body = clean(req.body);
  next();
};
