export function assignPartner({ estimateId, packageId, partners = [] }) {
  const partner = partners.find((item) => item.capabilities?.includes(packageId));

  if (!partner) {
    return {
      ok: false,
      estimateId,
      packageId,
      status: 'manual_review',
      reason: '해당 패키지 역량을 가진 파트너가 없습니다.'
    };
  }

  return {
    ok: true,
    estimateId,
    packageId,
    partnerId: partner.id,
    partnerName: partner.name,
    status: 'assigned'
  };
}
