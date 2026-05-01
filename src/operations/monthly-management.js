export function createMonthlyAccount({ leadId, siteUrl, cadence = 'monthly', startedAt = new Date().toISOString() }) {
  return {
    leadId,
    siteUrl,
    cadence,
    status: 'active',
    startedAt,
    nextDiagnosisAt: nextDiagnosisDate(startedAt, cadence)
  };
}

function nextDiagnosisDate(startedAt, cadence) {
  const date = new Date(startedAt);
  if (cadence === 'weekly') {
    date.setUTCDate(date.getUTCDate() + 7);
  } else {
    date.setUTCMonth(date.getUTCMonth() + 1);
  }
  return date.toISOString();
}
