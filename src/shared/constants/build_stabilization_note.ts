export const BUILD_STABILIZATION_NOTE = {
stage: 'M7.8',
purpose: 'Permitir build mientras se migra el frontend legacy a vNext',
knownDebt: [
'legacy any usage',
'legacy eslint warnings',
'legacy hook ordering issues',
'legacy mongoose/model typing debt',
'TurnoPanel import/export mismatch',
'Ticket.ts parse debt',
],
} as const;
