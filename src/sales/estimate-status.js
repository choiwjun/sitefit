export const ESTIMATE_STATUSES = [
  'draft',
  'sent',
  'negotiation',
  'accepted',
  'rejected'
];

const ALLOWED_TRANSITIONS = {
  draft: ['sent', 'rejected'],
  sent: ['negotiation', 'accepted', 'rejected'],
  negotiation: ['sent', 'accepted', 'rejected'],
  accepted: [],
  rejected: []
};

export function transitionEstimateStatus(currentStatus, nextStatus) {
  if (!ESTIMATE_STATUSES.includes(currentStatus) || !ESTIMATE_STATUSES.includes(nextStatus)) {
    return { ok: false, status: currentStatus, reason: '알 수 없는 견적 상태입니다.' };
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
