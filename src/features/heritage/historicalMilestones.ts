import type { SourceReference } from '../faith-spaces/placeProfileTypes';
import type { HistoricalMilestone } from './heritageTypes';
import { neighborhoodHistories } from './neighborhoodHistories';

export const heritageReviewDate = '2026-11-04';
const source = (id: string, zh: string, en: string, url: string, publisher: string): SourceReference => ({
  id, title: { zh, en }, url, publisher, verifiedAt: heritageReviewDate,
});

/** Primary institutional pages read for this release; no archival images are reused. */
export const heritageSources = {
  lungshan: source('heritage-lungshan-moi', '內政部：艋舺龍山寺文化資產介紹', 'Ministry of the Interior: Bangka Lungshan Temple heritage',
    'https://taiwangods.moi.gov.tw/html/Cultural/3_0011.aspx?i=13', '內政部'),
  qingshui: source('heritage-qingshui-moi', '內政部：艋舺清水巖祖師廟文化資產介紹', 'Ministry of the Interior: Bangka Qingshui Temple heritage',
    'https://taiwangods.moi.gov.tw/html/Cultural/3_0011.aspx?i=12', '內政部'),
  qingshan: source('heritage-qingshan-moi', '內政部：艋舺青山宮文化資產介紹', 'Ministry of the Interior: Bangka Qingshan Temple heritage',
    'https://taiwangods.moi.gov.tw/Religious_Culture/html/Cultural/3_0011.aspx?i=211', '內政部'),
  zhongshanHistory: source('heritage-zhongshan-presbytery', '七星中會：台北中山教會簡史', 'Seven Star Presbytery: Taipei Zhongshan Church history',
    'https://www.sevenstar.org.tw/church/c02004/', '台灣基督長老教會七星中會'),
  zhongshanHeritage: source('heritage-zhongshan-moi', '內政部：中山基督長老教會文化資產介紹', 'Ministry of the Interior: Zhongshan Presbyterian Church heritage',
    'https://taiwangods.moi.gov.tw/html/cultural/3_0011.aspx?i=213', '內政部'),
  mosqueHistory: source('heritage-mosque-official', '台北清真寺：歷史沿革與建築特色', 'Taipei Grand Mosque: official history and architecture',
    'https://www.taipeimosque.org.tw/guided.php?lang=tw', '台北清真寺'),
  mosqueHeritage: source('heritage-mosque-moi', '內政部：臺北清真寺文化資產介紹', 'Ministry of the Interior: Taipei Grand Mosque heritage',
    'https://taiwangods.moi.gov.tw/html/cultural/3_0011.aspx?i=39', '內政部'),
};

const reviewed = { lastReviewed: heritageReviewDate, editorialReviewStatus: 'internal-reviewed' as const };
const bangka = 'bangka-building-layers';
const buildings = 'buildings-and-communities';

export const historicalMilestones: HistoricalMilestone[] = [
  ...neighborhoodHistories.milestones,
  {
    id: 'lungshan-foundation-1738',
    title: { zh: '龍山寺的創建記錄', en: 'Lungshan Temple’s documented founding' },
    summary: {
      zh: '內政部文化資產介紹將艋舺龍山寺的創建記為1738年。這是廟宇歷史的記載，不是現今登記法人的成立日期。',
      en: 'The government heritage profile dates Lungshan Temple’s founding to 1738. This describes the temple’s history, not the establishment date of today’s registered legal entity.',
    },
    date: { startYear: 1738, precision: 'year', calendarSystem: 'gregorian', displayLabel: { zh: '1738年', en: '1738' } },
    theme: 'foundation', organizationIds: ['org-83-1arg2kq'], storyIds: [bangka], sources: [heritageSources.lungshan], ...reviewed,
  },
  {
    id: 'qingshui-construction-1787-1790',
    title: { zh: '清水巖的起造與落成', en: 'Qingshui Temple’s construction and completion' },
    summary: {
      zh: '文化資產介紹記錄清水巖於1787年起造、1790年落成。此區間保留兩個建築里程碑，不補推工程的確切起訖日。',
      en: 'The heritage profile records construction beginning in 1787 and completion in 1790. The range preserves these two building milestones without inventing exact start or end dates.',
    },
    date: { startYear: 1787, endYear: 1790, precision: 'range', calendarSystem: 'gregorian', displayLabel: { zh: '1787–1790年', en: '1787–1790' } },
    theme: 'architecture', organizationIds: ['org-294-ypjbe6'], storyIds: [bangka], sources: [heritageSources.qingshui], ...reviewed,
  },
  {
    id: 'qingshan-construction-1856-1859',
    title: { zh: '青山王館的建造記錄', en: 'The building record of Qingshan Wangguan' },
    summary: {
      zh: '內政部介紹將1856至1859年記作在現址建廟至竣工的期間，當時稱為「青山王館」。這裡保留來源的年份區間。',
      en: 'The government profile describes building at the present site from 1856 to 1859, when the institution was called Qingshan Wangguan. The source’s year range is retained here.',
    },
    date: { startYear: 1856, endYear: 1859, precision: 'range', calendarSystem: 'gregorian', displayLabel: { zh: '1856–1859年', en: '1856–1859' } },
    theme: 'foundation', organizationIds: ['org-21-1bs6r0m'], storyIds: [bangka], sources: [heritageSources.qingshan], ...reviewed,
  },
  {
    id: 'qingshan-rebuilding-1934-1938',
    title: { zh: '重建與「青山宮」之名', en: 'Rebuilding and the name Qingshan Temple' },
    summary: {
      zh: '文化資產介紹記錄1934年重建、1938年竣工，並由青山王館改稱青山宮。創建與重建是不同的歷史階段。',
      en: 'The heritage profile records rebuilding from 1934 to 1938 and the change from Qingshan Wangguan to Qingshan Temple. Founding and rebuilding are separate historical stages.',
    },
    date: { startYear: 1934, endYear: 1938, precision: 'range', calendarSystem: 'gregorian', displayLabel: { zh: '1934–1938年', en: '1934–1938' } },
    theme: 'transformation', organizationIds: ['org-21-1bs6r0m'], storyIds: [bangka], sources: [heritageSources.qingshan], ...reviewed,
  },
  {
    id: 'zhongshan-building-1937',
    title: { zh: '中山教堂的建築年代', en: 'The date of Zhongshan’s church building' },
    summary: {
      zh: '教會簡史與政府文化資產介紹均記載教堂建於1937年，但對完工月份記載不同。因此此處僅列共同支持的年份。',
      en: 'The church chronology and government heritage profile both date the building to 1937 but differ on the completion month. Only their shared year is presented here.',
    },
    date: { startYear: 1937, precision: 'year', calendarSystem: 'gregorian', displayLabel: { zh: '1937年（月份記載不一）', en: '1937 (completion month differs between sources)' } },
    theme: 'architecture', organizationIds: ['org-387-1o20pm9'], storyIds: [buildings], sources: [heritageSources.zhongshanHistory, heritageSources.zhongshanHeritage], ...reviewed,
  },
  {
    id: 'zhongshan-congregation-1947',
    title: { zh: '長老教會堂會成立', en: 'Establishment of the Presbyterian congregation' },
    summary: {
      zh: '七星中會的教會簡史明列1947年12月15日成立長老教會堂會。此日期與先前教堂建築的完工年代不同。',
      en: 'The presbytery’s chronology explicitly dates the Presbyterian congregation’s establishment to 15 December 1947, a different milestone from completion of the earlier church building.',
    },
    date: { startYear: 1947, exactDate: '1947-12-15', precision: 'exact', calendarSystem: 'gregorian', displayLabel: { zh: '1947年12月15日', en: '15 December 1947' } },
    theme: 'community', organizationIds: ['org-387-1o20pm9'], storyIds: [buildings], sources: [heritageSources.zhongshanHistory], ...reviewed,
  },
  {
    id: 'lishui-prayer-space-1948',
    title: { zh: '麗水街的早期清真寺', en: 'An earlier mosque on Lishui Street' },
    summary: {
      zh: '政府文化資產介紹記錄1948年將麗水街一棟日式房舍改作清真寺。這是先前場所的歷史，本項不以新生南路的現今登記座標標示舊址。',
      en: 'The government heritage profile records a Japanese-style house on Lishui Street adapted as a mosque in 1948. This earlier location is not mapped using the present Xinsheng South Road registration coordinates.',
    },
    date: { startYear: 1948, precision: 'year', calendarSystem: 'gregorian', displayLabel: { zh: '1948年', en: '1948' } },
    theme: 'community', organizationIds: [], religions: ['回教'], storyIds: [buildings], sources: [heritageSources.mosqueHeritage], ...reviewed,
  },
  {
    id: 'taipei-mosque-completion-1960',
    title: { zh: '新生南路清真寺落成', en: 'Completion of the mosque on Xinsheng South Road' },
    summary: {
      zh: '清真寺官方導覽記錄新生南路現址建築於1960年落成。這個建築里程碑與麗水街早期場所分開呈現。',
      en: 'The mosque’s official guide records completion of its Xinsheng South Road building in 1960. This building milestone is presented separately from the earlier Lishui Street location.',
    },
    date: { startYear: 1960, precision: 'year', calendarSystem: 'gregorian', displayLabel: { zh: '1960年', en: '1960' } },
    theme: 'architecture', organizationIds: ['org-530-nftfoh'], storyIds: [buildings], sources: [heritageSources.mosqueHistory], ...reviewed,
  },
  {
    id: 'taipei-mosque-designation-1999',
    title: { zh: '清真寺的古蹟指定', en: 'The mosque’s heritage designation' },
    summary: {
      zh: '政府文化資產資料與寺方導覽均記錄1999年6月29日指定為臺北市定古蹟。指定日期並不是建築完工日期。',
      en: 'Government and mosque records give 29 June 1999 as the municipal heritage designation date. Designation and building completion are different milestones.',
    },
    date: { startYear: 1999, exactDate: '1999-06-29', precision: 'exact', calendarSystem: 'gregorian', displayLabel: { zh: '1999年6月29日', en: '29 June 1999' } },
    theme: 'heritage', organizationIds: ['org-530-nftfoh'], storyIds: [buildings], sources: [heritageSources.mosqueHeritage, heritageSources.mosqueHistory], ...reviewed,
  },
];
