const BUDGET_POINTS = {
  'under-100': 5,
  '100-300': 20,
  '300-700': 30,
  'over-700': 35,
  unknown: 0
};

const WORK_POINTS = {
  'diagnosis-only': 5,
  'fix-only': 20,
  'fix-and-monthly': 30,
  'monthly-management': 25
};

const TIMELINE_POINTS = {
  urgent: 20,
  month: 15,
  quarter: 10,
  flexible: 0
};

export function scoreLead(input) {
  const budget = BUDGET_POINTS[input.budgetRange] ?? 0;
  const work = WORK_POINTS[input.desiredWork] ?? 0;
  const timeline = TIMELINE_POINTS[input.timeline] ?? 0;
  const issueSeverity = Math.min(15, Number(input.issueCount || 0));
  const highImpact = Math.min(20, Number(input.highImpactIssueCount || 0) * 3);
  const score = Math.min(100, budget + work + timeline + issueSeverity + highImpact);
  const reasons = [];

  if (budget >= 20) reasons.push('예산 확인됨');
  if (work >= 25) reasons.push('SI 또는 월관리 의향');
  if (timeline >= 15) reasons.push('단기 진행 일정');
  if (highImpact >= 12) reasons.push('영향도 높은 진단 이슈');

  return {
    score,
    grade: gradeScore(score),
    reasons
  };
}

function gradeScore(score) {
  if (score >= 75) return 'hot';
  if (score >= 50) return 'warm';
  return 'nurture';
}
