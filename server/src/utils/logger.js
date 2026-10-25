function logInfo(message, meta) {
  if (meta) {
    console.log(`[INFO] ${new Date().toISOString()} ${message}`, meta);
    return;
  }
  console.log(`[INFO] ${new Date().toISOString()} ${message}`);
}

function logWarn(message, meta) {
  if (meta) {
    console.warn(`[WARN] ${new Date().toISOString()} ${message}`, meta);
    return;
  }
  console.warn(`[WARN] ${new Date().toISOString()} ${message}`);
}

function logError(message, error) {
  if (error) {
    console.error(`[ERROR] ${new Date().toISOString()} ${message}`, error);
    return;
  }
  console.error(`[ERROR] ${new Date().toISOString()} ${message}`);
}

module.exports = {
  logInfo,
  logWarn,
  logError,
};
