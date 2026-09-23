// src/lib/adlDomains.js
// Must match backend/src/lib/adlDomains.js exactly (separate codebases, same
// discipline this app already uses for CARE_LEVELS — see homes.js /
// RateSchedulesModal.jsx). The backend rejects anything not in this list, so
// drift here would just mean every "Log" tap fails with a 400.
export const ADL_DOMAINS = [
  "Ambulation/Mobility",
  "Bed Mobility/Transfer",
  "Eating",
  "Toileting/Continence",
  "Dressing",
  "Personal Hygiene",
  "Bathing",
  "Foot Care",
  "Skin Care",
];
