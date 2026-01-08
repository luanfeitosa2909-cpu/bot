module.exports.parseDate = function (raw) {
  if (!raw || typeof raw !== 'string') return null;

  try {
    // Remove milissegundos se existirem ( :326 )
    const clean = raw.split(':')[0];

    // 2025.12.29-21.38.39 → 2025-12-29T21:38:39
    const iso = clean.replace(
      /(\d{4})\.(\d{2})\.(\d{2})-(\d{2})\.(\d{2})\.(\d{2})/,
      '$1-$2-$3T$4:$5:$6'
    );

    const date = new Date(iso);
    if (isNaN(date.getTime())) return null;

    return date;
  } catch {
    return null;
  }
};
