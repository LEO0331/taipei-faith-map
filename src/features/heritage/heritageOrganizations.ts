import type { HeritagePlaceReference } from './heritageTypes';
import { heritageSources } from './historicalMilestones';

/** These are present-day registration matches, never a historical-coordinate layer. */
export const heritageOrganizations: HeritagePlaceReference[] = [
  {
    organizationId: 'org-83-1arg2kq', organizationName: '財團法人台北市艋舺龍山寺', district: '萬華區', address: '廣州街211號',
    relationship: { zh: '對應龍山寺史料的目前登記場所；此位置不代表1738年的地理範圍或法人身分。', en: 'The current registration associated with the Lungshan Temple records, not a reconstruction of its 1738 geographic extent or legal identity.' },
    sources: [heritageSources.lungshan],
  },
  {
    organizationId: 'org-294-ypjbe6', organizationName: '財團法人艋舺清水巖祖師廟', district: '萬華區', address: '康定路81號',
    relationship: { zh: '對應清水巖建築史料的目前登記場所，不以現址推定歷次建築範圍。', en: 'The current registration associated with Qingshui Temple’s building history; current coordinates do not establish earlier building boundaries.' },
    sources: [heritageSources.qingshui],
  },
  {
    organizationId: 'org-21-1bs6r0m', organizationName: '艋舺青山宮', district: '萬華區', address: '貴陽街2段218號',
    relationship: { zh: '對應青山王館與青山宮公開歷史的目前登記場所；重建年代另見史料。', en: 'The current registration associated with published histories of Qingshan Wangguan and Qingshan Temple; rebuilding dates are recorded separately.' },
    sources: [heritageSources.qingshan],
  },
  {
    organizationId: 'org-387-1o20pm9', organizationName: '財團法人台北市中山基督長老教會', district: '中山區', address: '林森北路62號',
    relationship: { zh: '目前登記堂會與林森北路教堂史料相連；建築、堂會與法人成立日期不得互換。', en: 'The current registered congregation is associated with the Linsen North Road church records; building, congregation and legal-entity dates are not interchangeable.' },
    sources: [heritageSources.zhongshanHistory, heritageSources.zhongshanHeritage],
  },
  {
    organizationId: 'org-530-nftfoh', organizationName: '財團法人台北清真寺基金會', district: '大安區', address: '新生南路2段62號',
    relationship: { zh: '新生南路的目前登記場所，可連結現址建築與古蹟指定記錄；不作為麗水街舊址座標。', en: 'The present Xinsheng South Road registration associated with building and designation records; it is not used as coordinates for the earlier Lishui Street site.' },
    sources: [heritageSources.mosqueHistory, heritageSources.mosqueHeritage],
  },
];
