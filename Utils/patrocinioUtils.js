function isNewWeek(lastUse) {
  if (!lastUse) return true;

  const now = Date.now();
  const last = new Date(lastUse).getTime();

  return now - last > 7 * 24 * 60 * 60 * 1000;
}

module.exports = { isNewWeek };
