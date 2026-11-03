import type { PlaceProfile, SourceReference } from './placeProfileTypes';

// Curated separately from the generated government records. Sources were read on
// the review date; internal fact-checking does not imply community approval.
const reviewed = '2026-11-03';
const ciyouHistory: SourceReference = {
  id: 'ciyou-official-history',
  title: { zh: '松山慈祐宮：歷史沿革', en: 'Songshan Ciyou Temple: history' },
  url: 'https://www.ssjyg.org.tw/About.aspx?View=11',
  publisher: '財團法人台北市松山慈祐宮', verifiedAt: reviewed,
};
const ciyouArchitecture: SourceReference = {
  id: 'ciyou-tourism',
  title: { zh: '交通部觀光署：松山慈祐宮', en: 'Taiwan Tourism Administration: Songshan Ciyou Temple' },
  url: 'https://www.tad.gov.tw/m1.aspx?id=227&sNo=0001016',
  publisher: '交通部觀光署', verifiedAt: reviewed,
};
const lungshanHistory: SourceReference = {
  id: 'lungshan-wanhua',
  title: { zh: '萬華區公所：艋舺龍山寺', en: 'Wanhua District Office: Bangka Lungshan Temple' },
  url: 'https://whdo.gov.taipei/News_Content.aspx?n=2B790586BA4E1E7A&s=039849E84D5B9C7B&sms=15EB41D4C772E746',
  publisher: '臺北市萬華區公所', verifiedAt: reviewed,
};
const lungshanCraft: SourceReference = {
  id: 'lungshan-official-caisson',
  title: { zh: '艋舺龍山寺：三川藻井', en: 'Lungshan Temple: Sanchuan Hall caisson ceiling' },
  url: 'https://lungshan.org.tw/tw/03_2_2_art.php',
  publisher: '財團法人台北市艋舺龍山寺', verifiedAt: reviewed,
};
const mosqueGuide: SourceReference = {
  id: 'taipei-mosque-official-guide',
  title: { zh: '台北清真寺：歷史沿革與建築特色', en: 'Taipei Grand Mosque: history and architecture' },
  url: 'https://www.taipeimosque.org.tw/guided.php?lang=tw',
  publisher: '台北清真寺', verifiedAt: reviewed,
};
const zhongshanHeritage: SourceReference = {
  id: 'zhongshan-moi-heritage',
  title: { zh: '內政部宗教文化地圖：中山基督長老教會', en: 'Ministry of the Interior: Zhongshan Presbyterian Church heritage profile' },
  url: 'https://taiwangods.moi.gov.tw/html/cultural/3_0011.aspx?i=213',
  publisher: '內政部', verifiedAt: reviewed,
};
const zhongshanHistory: SourceReference = {
  id: 'zhongshan-presbytery-history',
  title: { zh: '七星中會：台北中山教會簡史', en: 'Seven Star Presbytery: Taipei Zhongshan Church history' },
  url: 'https://www.sevenstar.org.tw/church/c02004/',
  publisher: '台灣基督長老教會七星中會', verifiedAt: reviewed,
};

export const placeProfiles: PlaceProfile[] = [
  {
    id: 'songshan-ciyou',
    organizationId: 'org-1-mtb4vg',
    organizationName: '財團法人台北市松山慈祐宮',
    district: '松山區', address: '八德路4段761號',
    introduction: {
      zh: '松山慈祐宮位於八德路，舊稱錫口媽祖宮。',
      en: 'Songshan Ciyou Temple stands on Bade Road and was formerly known as Xikou Mazu Temple.',
    },
    sources: [ciyouHistory],
    facts: [
      {
        id: 'construction', title: { zh: '從錫口發展的廟宇', en: 'A temple rooted in Xikou' },
        description: {
          zh: '寺方沿革記載，1753年正式興建，1757年完工，成為錫口十三街庄居民的信仰中心。',
          en: 'The temple records construction beginning in 1753 and completion in 1757, serving the communities of Xikou’s thirteen settlements.',
        },
        sources: [ciyouHistory],
      },
      {
        id: 'roof-craft', title: { zh: '屋頂上的雕飾', en: 'Sculpture along the roof' },
        description: {
          zh: '觀光署介紹指出，慈祐宮屋頂有龍與人物等雕飾。',
          en: 'The Tourism Administration describes dragon and figure ornament on the temple roof.',
        },
        sources: [ciyouArchitecture],
      },
    ],
    lastReviewed: reviewed, editorialReviewStatus: 'internal-reviewed',
  },
  {
    id: 'bangka-lungshan',
    organizationId: 'org-83-1arg2kq',
    organizationName: '財團法人台北市艋舺龍山寺',
    district: '萬華區', address: '廣州街211號',
    introduction: {
      zh: '艋舺龍山寺位於萬華區廣州街，為國定古蹟。',
      en: 'Bangka Lungshan Temple, on Guangzhou Street in Wanhua, is a nationally designated historic monument.',
    },
    sources: [lungshanHistory],
    facts: [
      {
        id: 'foundation', title: { zh: '1738年的創建', en: 'Founded in 1738' },
        description: {
          zh: '萬華區公所記錄龍山寺創建於1738年，其建築由前殿、正殿、後殿與左右護龍組成。',
          en: 'The district office dates the temple’s founding to 1738 and describes a layout of front, main and rear halls with side wings.',
        },
        sources: [lungshanHistory],
      },
      {
        id: 'caisson', title: { zh: '三川殿的八角藻井', en: 'The octagonal caisson ceiling' },
        description: {
          zh: '寺方的藝術介紹記載，三川殿中央的八角形藻井，以八層斗栱交錯組成，下方另有八個木雕獅座。',
          en: 'The temple’s art guide describes the Sanchuan Hall’s octagonal caisson ceiling: eight interlocking tiers of brackets above eight carved wooden lion supports.',
        },
        sources: [lungshanCraft],
      },
    ],
    lastReviewed: reviewed, editorialReviewStatus: 'internal-reviewed',
  },
  {
    id: 'taipei-grand-mosque',
    organizationId: 'org-530-nftfoh',
    organizationName: '財團法人台北清真寺基金會',
    district: '大安區', address: '新生南路2段62號',
    introduction: {
      zh: '台北清真寺位於大安區新生南路，寺方公開介紹其遷建與建築歷史。',
      en: 'Taipei Grand Mosque stands on Xinsheng South Road in Da’an. Its official guide documents its relocation and architecture.',
    },
    sources: [mosqueGuide],
    facts: [
      {
        id: 'completion', title: { zh: '1960年落成', en: 'Completed in 1960' },
        description: {
          zh: '寺方記錄現址清真寺於1960年落成，並於1999年6月29日被指定為臺北市定古蹟。',
          en: 'The mosque records completion at this site in 1960 and designation as a Taipei municipal historic monument on 29 June 1999.',
        },
        sources: [mosqueGuide],
      },
      {
        id: 'prayer-hall', title: { zh: '無柱的圓頂大殿', en: 'A column-free domed hall' },
        description: {
          zh: '官方導覽介紹，禮拜大殿圓頂高15公尺、跨距15公尺，中央無樑柱支撐。',
          en: 'The official guide describes a prayer-hall dome 15 metres high with a 15-metre span and no central supporting columns.',
        },
        sources: [mosqueGuide],
      },
    ],
    lastReviewed: reviewed, editorialReviewStatus: 'internal-reviewed',
  },
  {
    id: 'zhongshan-presbyterian',
    organizationId: 'org-387-1o20pm9',
    organizationName: '財團法人台北市中山基督長老教會',
    district: '中山區', address: '林森北路62號',
    introduction: {
      zh: '中山基督長老教會位於林森北路，教堂原屬聖公會，戰後改為長老教會使用。',
      en: 'Zhongshan Presbyterian Church stands on Linsen North Road. Its church building served an Anglican congregation before becoming Presbyterian after the war.',
    },
    sources: [zhongshanHeritage],
    facts: [
      {
        id: 'building-history', title: { zh: '教堂與堂會的歷史', en: 'Building and congregation' },
        description: {
          zh: '七星中會記載教堂於1937年建成；1947年12月15日成立長老教會堂會。建築與堂會的年代應分開理解。',
          en: 'The presbytery records the church building’s completion in 1937 and the Presbyterian congregation’s establishment on 15 December 1947. These are distinct milestones.',
        },
        sources: [zhongshanHistory],
      },
      {
        id: 'gothic-features', title: { zh: '尖拱、扶壁與鐘樓', en: 'Pointed arches, buttresses and a bell tower' },
        description: {
          zh: '內政部文化資產介紹記錄其十字形平面、尖拱門窗、扶壁與三層鐘樓，呈現哥德式建築語彙。',
          en: 'The Ministry of the Interior’s heritage profile documents a cross-shaped plan, pointed doors and windows, buttresses and a three-storey bell tower with Gothic influences.',
        },
        sources: [zhongshanHeritage],
      },
    ],
    lastReviewed: reviewed, editorialReviewStatus: 'internal-reviewed',
  },
];
