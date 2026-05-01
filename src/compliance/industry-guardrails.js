const GENERAL_NOTE = '성과 보장 표현을 피하고, 준비도와 개선 가능성 중심의 표현을 사용해야 합니다.';

const INDUSTRY_NOTES = {
  hospital: [
    '의료 페이지는 치료 효과 주장, 환자 후기 사용, 최고·전문 표현, 위험 고지 누락 여부를 더 엄격하게 검토해야 합니다.',
    GENERAL_NOTE
  ],
  clinic: [
    '의료 페이지는 치료 효과 주장, 환자 후기 사용, 최고·전문 표현, 위험 고지 누락 여부를 더 엄격하게 검토해야 합니다.',
    GENERAL_NOTE
  ],
  law: [
    '법률 페이지는 승소율, 결과 보장, 전문성 표현을 더 엄격하게 검토해야 합니다.',
    GENERAL_NOTE
  ],
  finance: [
    '금융·투자 페이지는 수익, 이익, 위험 관련 표현을 더 엄격하게 검토해야 합니다.',
    GENERAL_NOTE
  ],
  supplement: [
    '건강기능식품 페이지는 효능, 질병, 치료, 과장된 효과 표현을 더 엄격하게 검토해야 합니다.',
    GENERAL_NOTE
  ]
};

export function complianceNotesForIndustry(industry = '') {
  return INDUSTRY_NOTES[industry] || [GENERAL_NOTE];
}
