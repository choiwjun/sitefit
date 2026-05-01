export function compareDiagnosisRuns({ before, after }) {
  const beforeIssues = issueKeys(before.issues || []);
  const afterIssues = issueKeys(after.issues || []);
  const afterSet = new Set(afterIssues);
  const beforeSet = new Set(beforeIssues);

  return {
    scoreDelta: Number(after.scores?.overall || 0) - Number(before.scores?.overall || 0),
    resolvedIssues: beforeIssues.filter((item) => !afterSet.has(item)),
    remainingIssues: afterIssues.filter((item) => beforeSet.has(item)),
    newIssues: afterIssues.filter((item) => !beforeSet.has(item))
  };
}

function issueKeys(issues) {
  return issues.map((issue) => `${issue.name} @ ${issue.targetUrl}`);
}
