import type { ConfirmedCulturalEvent } from './calendarTypes';

/** Specific announced Gregorian occurrences, never conversions of dataset festival text. */
export const culturalEvents: ConfirmedCulturalEvent[] = [
  {
    id: 'qingshan-night-patrol-procession-2026',
    organizationId: 'org-21-1bs6r0m', organizationName: '艋舺青山宮', district: '萬華區', address: '貴陽街2段218號',
    title: { zh: '2026艋舺青山宮暗訪暨遶境', en: '2026 Bangka Qingshan Temple Night Patrol and Procession' },
    description: {
      zh: '主辦活動網站公告2026年11月28日至30日舉行暗訪暨遶境；10月8日發布的政府藝文公告也列出相同日期並註明免費參與。每日時刻、實際路線與參與安排，請出發前向主辦單位確認。',
      en: 'The organizer’s event site announces the night patrol and procession for 28–30 November 2026. A government cultural notice published on 8 October gives the same dates and states that participation is free. Confirm daily times, actual routes and participation arrangements with the organizer before visiting.',
    },
    location: {
      zh: '艋舺青山宮（貴陽街2段218號）及萬華區相關活動場域；各日動線依主辦公告。',
      en: 'Bangka Qingshan Temple, 218 Guiyang Street Section 2, and related event sites in Wanhua. Daily routes follow the organizer’s announcements.',
    },
    startDate: '2026-11-28', endDate: '2026-11-30', timeZone: 'Asia/Taipei',
    attendance: 'public', status: 'confirmed', verifiedAt: '2026-11-04', editorialReviewStatus: 'internal-reviewed',
    sources: [
      {
        id: 'qingshan-2026-organizer',
        title: { zh: '主辦活動網站：2026艋舺青山宮暗訪暨遶境', en: 'Organizer event site: 2026 Qingshan Temple night patrol and procession' },
        url: 'https://www.religiouscarnival.com/edcontent.php?id=1155&lang=tw&tb=8',
        publisher: '艋舺青山宮（活動主辦單位）', verifiedAt: '2026-11-04',
      },
      {
        id: 'qingshan-2026-government-notice',
        title: { zh: '政府藝文公告：2026艋舺青山宮暗訪暨遶境、青山王祭展演', en: 'Government cultural notice: 2026 Qingshan Temple procession and festival performances' },
        url: 'https://www.ilccb.gov.tw/News_Content.aspx?n=10203&s=410445&sms=12921',
        publisher: '宜蘭縣政府文化局（北臺八縣市藝文活動）', verifiedAt: '2026-11-04',
      },
    ],
  },
];
