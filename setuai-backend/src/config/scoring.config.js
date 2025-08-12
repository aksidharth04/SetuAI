// src/config/scoring.config.js

export const scoringWeights = {
  factors: {
    VERIFIED: 100,
    PENDING: 50,
    PENDING_API_VALIDATION: 60,
    PENDING_MANUAL_REVIEW: 40,
    MISSING: 0,
    REJECTED: 0,
    EXPIRED: 0,
  },
  pillars: {
    FACTORY_REGISTRATION_SAFETY: 1.5,
    WAGES_OVERTIME: 1.2,
    ESI_PF_COVERAGE: 1.2,
    CHILD_LABOR_AGE_VERIFICATION: 1.8,
    ENVIRONMENTAL: 1.3,
  },
  historyMultiplier: {
    0: 1.0,    // 0 rejections
    1: 0.9,    // 1 rejection
    2: 0.75,   // 2 rejections
    3: 0.5,    // 3+ rejections
  },
};
