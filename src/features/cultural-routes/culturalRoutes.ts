import type { SourceReference } from '../faith-spaces/placeProfileTypes';
import type { CulturalRoute } from './routeTypes';

const reviewed = '2026-11-04';
const source = (id: string, zh: string, en: string, url: string, publisher: string): SourceReference => ({
  id, title: { zh, en }, url, publisher, verifiedAt: reviewed,
});

const lungshan = source('route-lungshan-heritage', '內政部：艋舺龍山寺文化資產介紹', 'Ministry of the Interior: Bangka Lungshan Temple heritage',
  'https://taiwangods.moi.gov.tw/html/Cultural/3_0011.aspx?i=13', '內政部');
const qingshan = source('route-qingshan-heritage', '內政部：艋舺青山宮文化資產介紹', 'Ministry of the Interior: Bangka Qingshan Temple heritage',
  'https://taiwangods.moi.gov.tw/Religious_Culture/html/Cultural/3_0011.aspx?i=211', '內政部');
const qingshui = source('route-qingshui-heritage', '內政部：艋舺清水巖祖師廟文化資產介紹', 'Ministry of the Interior: Bangka Qingshui Temple heritage',
  'https://taiwangods.moi.gov.tw/html/Cultural/3_0011.aspx?i=12', '內政部');
const leeHeritage = source('route-lee-church-heritage', '內政部：李春生紀念教會與大稻埕郵便電信支局', 'Ministry of the Interior: Lee Chun-sheng Memorial Church and the former post office',
  'https://taiwangods.moi.gov.tw/Religious_Culture/html/Cultural/3_0011.aspx?i=356', '內政部');
const leeIdentity = source('route-lee-church-identity', '台灣基督長老教會：李春生紀念教會資料', 'Presbyterian Church in Taiwan: Lee Chun-sheng Memorial Church record',
  'https://www.pct.org.tw/churchdata.aspx?strOrgNo=C03001', '台灣基督長老教會');
const xiahai = source('route-xiahai-heritage', '內政部：大稻埕霞海城隍廟文化資產介紹', 'Ministry of the Interior: Dadaocheng Xia-Hai City God Temple heritage',
  'https://taiwangods.moi.gov.tw/Religious_Culture/html/Cultural/3_0011.aspx?i=58', '內政部');

/** Editorial stop sequences, not surveyed pedestrian paths or access guarantees. */
export const culturalRoutes: CulturalRoute[] = [
  {
    id: 'wanhua-temple-heritage',
    title: { zh: '艋舺三處廟宇文化', en: 'Three temple stories in Bangka' },
    description: {
      zh: '依序認識廣州街、貴陽街與康定路的三個宗教場所，閱讀各自的創建與建築故事。這是文化停靠點順序；實際步行動線請使用外部導航，參訪範圍依現場公告。',
      en: 'Discover three religious places on Guangzhou, Guiyang and Kangding streets through their founding and architecture. This is an editorial sequence of cultural stops. Use external directions for actual walking paths and follow each location’s access guidance.',
    },
    districtLabels: ['萬華區'], theme: 'heritage',
    stops: [
      {
        organizationId: 'org-83-1arg2kq', organizationName: '財團法人台北市艋舺龍山寺', district: '萬華區', address: '廣州街211號',
        title: { zh: '廣州街的龍山寺', en: 'Lungshan Temple on Guangzhou Street' },
        description: {
          zh: '內政部文化資產介紹記錄龍山寺創建於1738年，建築由前殿、正殿、後殿與左右護龍組成。從此處開始閱讀艋舺廟宇的歷史與空間。',
          en: 'The Ministry of the Interior dates Lungshan Temple’s founding to 1738 and describes front, main and rear halls with side wings. Begin here with the history and spatial organization of Bangka’s temples.',
        },
        sourceReferences: [lungshan],
      },
      {
        organizationId: 'org-21-1bs6r0m', organizationName: '艋舺青山宮', district: '萬華區', address: '貴陽街2段218號',
        title: { zh: '貴陽街的青山宮', en: 'Qingshan Temple on Guiyang Street' },
        description: {
          zh: '內政部資料記載青山宮於1856年在現址建廟、1859年竣工。三川門與正殿之間以廊道圍繞中庭，呈現廟宇的院落關係。',
          en: 'The Ministry of the Interior records construction at this site in 1856 and completion in 1859. Corridors between the entrance hall and main hall surround a courtyard, illustrating the relationship between halls and open space.',
        },
        sourceReferences: [qingshan],
      },
      {
        organizationId: 'org-294-ypjbe6', organizationName: '財團法人艋舺清水巖祖師廟', district: '萬華區', address: '康定路81號',
        title: { zh: '康定路的清水巖', en: 'Qingshui Temple on Kangding Road' },
        description: {
          zh: '內政部資料記錄清水巖於1787年起造、1790年落成，後經損毀與重建；現存建築保存清領時期的廟宇特色。此處與前兩站提供不同的建築歷史閱讀角度。',
          en: 'The Ministry of the Interior records construction beginning in 1787 and completion in 1790, followed by damage and rebuilding. The surviving temple retains architectural features from the Qing period, offering another perspective alongside the first two stops.',
        },
        sourceReferences: [qingshui],
      },
    ],
    lastReviewed: reviewed, editorialReviewStatus: 'internal-reviewed',
  },
  {
    id: 'dadaocheng-faith-and-community',
    title: { zh: '大稻埕的教會與城隍廟', en: 'A church and a City God temple in Dadaocheng' },
    description: {
      zh: '從貴德街走向迪化街，認識兩個相鄰街區的基督教與道教登記場所。兩站分別呈現教會建築與地方廟宇的歷史；參訪不代表可隨時進入室內或參與宗教活動。',
      en: 'Move from Guide Street toward Dihua Street to learn about registered Christian and Taoist places in neighboring blocks. The stops introduce church-building and local-temple histories. A visit does not imply unrestricted interior access or participation in religious activities.',
    },
    districtLabels: ['大同區'], theme: 'multi-faith',
    stops: [
      {
        organizationId: 'org-335-mdesof', organizationName: '財團法人台北市李春生紀念基督長老教會', district: '大同區', address: '貴德街44號',
        title: { zh: '李春生紀念教會', en: 'Lee Chun-sheng Memorial Church' },
        description: {
          zh: '長老教會官方資料列出此堂會於1935年設立，會址為貴德街44號。內政部文化資產介紹記錄該處曾作為大稻埕郵便電信支局，見證公共建築轉為宗教場所的歷史。',
          en: 'The Presbyterian Church in Taiwan lists this congregation’s establishment in 1935 and its address as 44 Guide Street. The government heritage profile records the site’s earlier use as the Dadaocheng post and telegraph office, connecting public-building and religious-place histories.',
        },
        sourceReferences: [leeIdentity, leeHeritage],
      },
      {
        organizationId: 'org-109-1vaoeq', organizationName: '台北霞海城隍廟', district: '大同區', address: '迪化街1段61號',
        title: { zh: '迪化街的霞海城隍廟', en: 'Xia-Hai City God Temple on Dihua Street' },
        description: {
          zh: '內政部文化資產資料記錄霞海城隍廟於1859年建廟，位於迪化街一段61號。寺廟由正殿與拜亭構成，可與上一站的教會建築一起閱讀街區的多元信仰空間。',
          en: 'The Ministry of the Interior records the temple’s establishment in 1859 at 61 Dihua Street Section 1. Its main hall and worship pavilion offer a different religious spatial arrangement from the church at the preceding stop.',
        },
        sourceReferences: [xiahai],
      },
    ],
    lastReviewed: reviewed, editorialReviewStatus: 'internal-reviewed',
  },
];
