import type { HeritageStory } from './heritageTypes';
import { heritageReviewDate, heritageSources } from './historicalMilestones';

/** Reading sequences connect documented topics, not an invented shared historical cause. */
export const heritageStories: HeritageStory[] = [
  {
    id: 'bangka-building-layers',
    title: { zh: '艋舺廟宇的建築層次', en: 'Reading Bangka’s temple layers' },
    subtitle: { zh: '創建、營建與重建，是不同的年代', en: 'Founding, building and rebuilding have different dates' },
    introduction: {
      zh: '以龍山寺、清水巖與青山宮的公開文化資產記錄，分別閱讀創建、起造與重建。這是一條史料閱讀線索，不將三處場所的歷史合併成同一條發展軌跡。',
      en: 'Read founding, construction and rebuilding through published heritage records of Lungshan, Qingshui and Qingshan temples. This reading sequence keeps each place’s history distinct.',
    },
    theme: 'architecture',
    chapters: [
      {
        id: 'founding-is-a-milestone',
        title: { zh: '從創建記錄開始', en: 'Begin with a founding record' },
        content: {
          zh: '龍山寺的前殿、正殿、後殿與兩側護龍形成院落空間；官方歷史也記錄寺廟曾是地方集會的重心。把創建記錄與這些空間並讀，可以看見廟宇不只有單一殿堂，而不將所有現存構件都視為初創遺物。',
          en: 'Lungshan’s front, main and rear halls and side wings form courtyard spaces. Its published history also records a role in local gatherings. Read the founding record alongside this arrangement without treating every surviving element as original fabric.',
        },
        milestoneIds: ['lungshan-foundation-1738'], organizationIds: ['org-83-1arg2kq'], sources: [heritageSources.lungshan],
      },
      {
        id: 'a-building-range',
        title: { zh: '讀懂一段營建期間', en: 'Read a construction interval' },
        content: {
          zh: '清水巖的文化資產介紹記錄兩殿、廊道、中庭與兩側護龍相連的格局，並指出其清領時期建築特色。起造、落成與後續修築，共同提醒我們：今天閱讀的建築，不只是一個創建年份。',
          en: 'Qingshui’s heritage profile describes two halls linked by corridors around a courtyard, with side wings, and identifies Qing-period architectural characteristics. Construction, completion and later repairs invite a reading of the building beyond a single founding year.',
        },
        milestoneIds: ['qingshui-construction-1787-1790'], organizationIds: ['org-294-ypjbe6'], sources: [heritageSources.qingshui],
      },
      {
        id: 'rebuilding-and-renaming',
        title: { zh: '重建留下另一層歷史', en: 'Rebuilding adds another historical layer' },
        content: {
          zh: '青山王館重建後改稱青山宮；文化資產介紹指出，三川門、正殿與環繞中庭的檐廊，仍大致保持昭和年間改建的風格。名稱與院落一起留下建築變遷的線索，與早期建廟記錄分屬不同層次。',
          en: 'After rebuilding, Qingshan Wangguan became Qingshan Temple. The heritage profile says the entrance hall, main hall and courtyard corridors broadly retain the Shōwa-period rebuilding style. Name and spatial form reveal a later layer distinct from the earlier building record.',
        },
        milestoneIds: ['qingshan-construction-1856-1859', 'qingshan-rebuilding-1934-1938'], organizationIds: ['org-21-1bs6r0m'], sources: [heritageSources.qingshan],
      },
    ],
    routeIds: ['wanhua-temple-heritage'],
    sources: [heritageSources.lungshan, heritageSources.qingshui, heritageSources.qingshan],
    lastReviewed: heritageReviewDate, editorialReviewStatus: 'internal-reviewed',
  },
  {
    id: 'buildings-and-communities',
    title: { zh: '建築與群體的不同年代', en: 'Buildings and communities: different dates' },
    subtitle: { zh: '教堂、舊址與清真寺的史料閱讀', en: 'Reading church, earlier-site and mosque histories' },
    introduction: {
      zh: '從中山教會與台北清真寺的公開歷史，分開閱讀建築完工、堂會成立、場所遷移與古蹟指定。這些例子彼此並列，不推定兩個群體具有未記載的歷史關係。',
      en: 'Read building completion, congregation establishment, relocation and heritage designation through Zhongshan Church and Taipei Grand Mosque records. These examples are placed alongside each other without inferring an undocumented relationship between their communities.',
    },
    theme: 'multi-faith',
    chapters: [
      {
        id: 'building-and-congregation',
        title: { zh: '一棟教堂，兩種日期', en: 'A church building and a congregation' },
        content: {
          zh: '中山教堂的十字形平面、尖拱窗與鐘樓，見於教會及政府的建築介紹。這棟原供聖公會使用的教堂，戰後轉為長老教會場所；建築的年代與堂會成立，因此不能混為一談。',
          en: 'Church and government accounts describe Zhongshan’s cross-shaped plan, pointed windows and bell tower. The building first served an Anglican congregation and became Presbyterian after the war, so its building history and congregation establishment are distinct.',
        },
        milestoneIds: ['zhongshan-building-1937', 'zhongshan-congregation-1947'], organizationIds: ['org-387-1o20pm9'], sources: [heritageSources.zhongshanHistory, heritageSources.zhongshanHeritage],
      },
      {
        id: 'an-earlier-unmapped-place',
        title: { zh: '舊場所不等於現今座標', en: 'An earlier place is not today’s coordinates' },
        content: {
          zh: '文化資產介紹記錄，麗水街的一棟日式房舍調整內部後成為禮拜場所，外觀與庭院當時未改動。這段由住居轉作宗教空間的歷史，屬於先前場所；新生南路的目前登記座標不能代替舊址。',
          en: 'The heritage account describes a Japanese-style house on Lishui Street adapted internally for worship while its exterior and garden remained unchanged. This history of a home becoming a religious space belongs to the earlier site, not today’s Xinsheng South Road coordinates.',
        },
        milestoneIds: ['lishui-prayer-space-1948'], organizationIds: [], sources: [heritageSources.mosqueHeritage],
      },
      {
        id: 'completion-and-designation',
        title: { zh: '落成以後，文化資產的記錄', en: 'Completion, then heritage recognition' },
        content: {
          zh: '新生南路清真寺以圓頂、拱廊與喚拜塔構成鮮明的建築輪廓，官方導覽也介紹中央無柱的禮拜大殿。從建築落成走向古蹟指定，是另一種年代閱讀；文化示意場景仍不代表這座真實建築的重建。',
          en: 'The Xinsheng South Road mosque combines a dome, arcades and minarets; its official guide also describes a column-free prayer hall. Completion and later designation offer different dates through which to read this architecture. The cultural scene remains an illustration, not a reconstruction.',
        },
        milestoneIds: ['taipei-mosque-completion-1960', 'taipei-mosque-designation-1999'], organizationIds: ['org-530-nftfoh'], sources: [heritageSources.mosqueHistory, heritageSources.mosqueHeritage],
      },
    ],
    sources: [heritageSources.zhongshanHistory, heritageSources.zhongshanHeritage, heritageSources.mosqueHistory, heritageSources.mosqueHeritage],
    lastReviewed: heritageReviewDate, editorialReviewStatus: 'internal-reviewed',
  },
];
