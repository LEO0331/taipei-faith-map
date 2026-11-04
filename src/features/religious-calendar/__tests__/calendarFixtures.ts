import type { ReligiousOrganization } from '../../../types';
import type { ConfirmedCulturalEvent } from '../calendarTypes';

export const testOrganization: ReligiousOrganization = {
  id: 'calendar-fixture', name: '行事曆測試宮', religion: '道教', district: '萬華區', address: '測試街1號',
  latitude: 25.03, longitude: 121.5, originalX: 0, originalY: 0, source: 'Government fixture',
  festivalDates: ['農曆10月22日', '國曆3月23日', '日期未詳'],
};

export const testEvent: ConfirmedCulturalEvent = {
  id: 'dated-fixture', organizationId: testOrganization.id, organizationName: testOrganization.name,
  district: testOrganization.district, address: testOrganization.address,
  title: { zh: '有來源的文化活動', en: 'Sourced cultural event' },
  description: { zh: '測試用的特定年度活動。', en: 'A specific dated occurrence used only in tests.' },
  location: { zh: '測試街活動場域', en: 'Test Street event site' },
  startDate: '2026-11-28', endDate: '2026-11-30', timeZone: 'Asia/Taipei', attendance: 'unknown', status: 'confirmed',
  verifiedAt: '2026-11-01', editorialReviewStatus: 'internal-reviewed',
  sources: [{ id: 'test-official', title: { zh: '官方測試公告', en: 'Official test notice' }, url: 'https://example.org/event', publisher: 'Test organization', verifiedAt: '2026-11-01' }],
};
