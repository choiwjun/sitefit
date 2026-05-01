export const SALES_STATUSES = [
  'request_received',
  'diagnosis_complete',
  'consultation_requested',
  'consultation_scheduled',
  'consultation_complete',
  'estimate_pending',
  'estimate_sent',
  'negotiation',
  'contracted',
  'lost',
  'rediagnosis_requested',
  'monthly_management_proposed',
  'monthly_management_active'
];

const ALLOWED_TRANSITIONS = {
  request_received: ['diagnosis_complete', 'lost'],
  diagnosis_complete: ['consultation_requested', 'lost'],
  consultation_requested: ['consultation_scheduled', 'lost'],
  consultation_scheduled: ['consultation_complete', 'lost'],
  consultation_complete: ['estimate_pending', 'lost'],
  estimate_pending: ['estimate_sent', 'lost'],
  estimate_sent: ['negotiation', 'contracted', 'lost'],
  negotiation: ['contracted', 'estimate_sent', 'lost'],
  contracted: ['rediagnosis_requested', 'monthly_management_proposed'],
  rediagnosis_requested: ['monthly_management_proposed', 'monthly_management_active'],
  monthly_management_proposed: ['monthly_management_active', 'lost'],
  monthly_management_active: [],
  lost: []
};

export function transitionLeadStatus(currentStatus, nextStatus) {
  if (!SALES_STATUSES.includes(currentStatus) || !SALES_STATUSES.includes(nextStatus)) {
    return { ok: false, status: currentStatus, reason: '알 수 없는 영업 상태입니다.' };
  }

  if (!ALLOWED_TRANSITIONS[currentStatus].includes(nextStatus)) {
    return {
      ok: false,
      status: currentStatus,
      reason: `${currentStatus}에서 ${nextStatus}로 바로 변경할 수 없습니다.`
    };
  }

  return { ok: true, status: nextStatus };
}
