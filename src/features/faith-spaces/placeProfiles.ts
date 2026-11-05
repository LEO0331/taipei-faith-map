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

// V1.4 additions were checked separately; earlier review dates remain unchanged.
const coverageReviewed = '2026-11-05';
const qingshanHeritage: SourceReference = {
  id: 'qingshan-profile-moi',
  title: { zh: '內政部：艋舺青山宮文化資產介紹', en: 'Ministry of the Interior: Bangka Qingshan Temple heritage' },
  url: 'https://taiwangods.moi.gov.tw/Religious_Culture/html/Cultural/3_0011.aspx?i=211',
  publisher: '內政部', verifiedAt: coverageReviewed,
};
const qingshuiHeritage: SourceReference = {
  id: 'qingshui-profile-moi',
  title: { zh: '內政部：艋舺清水巖祖師廟文化資產介紹', en: 'Ministry of the Interior: Bangka Qingshui Temple heritage' },
  url: 'https://taiwangods.moi.gov.tw/html/Cultural/3_0011.aspx?i=12',
  publisher: '內政部', verifiedAt: coverageReviewed,
};
const xiahaiHeritage: SourceReference = {
  id: 'xiahai-profile-moi',
  title: { zh: '內政部：大稻埕霞海城隍廟文化資產介紹', en: 'Ministry of the Interior: Dadaocheng Xia-Hai City God Temple heritage' },
  url: 'https://taiwangods.moi.gov.tw/Religious_Culture/html/Cultural/3_0011.aspx?i=58',
  publisher: '內政部', verifiedAt: coverageReviewed,
};
const leeChurchDirectory: SourceReference = {
  id: 'lee-church-profile-pct',
  title: { zh: '台灣基督長老教會：李春生紀念教會資料', en: 'Presbyterian Church in Taiwan: Lee Chun-sheng Memorial Church directory' },
  url: 'https://www.pct.org.tw/churchdata.aspx?strOrgNo=C03001',
  publisher: '台灣基督長老教會', verifiedAt: coverageReviewed,
};
const leeChurchHeritage: SourceReference = {
  id: 'lee-church-profile-moi',
  title: { zh: '內政部：李春生紀念教會與大稻埕郵便電信支局', en: 'Ministry of the Interior: Lee Chun-sheng Memorial Church and former post office' },
  url: 'https://taiwangods.moi.gov.tw/Religious_Culture/html/Cultural/3_0011.aspx?i=356',
  publisher: '內政部', verifiedAt: coverageReviewed,
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
  {
    id: 'bangka-qingshan',
    organizationId: 'org-21-1bs6r0m',
    organizationName: '艋舺青山宮',
    district: '萬華區', address: '貴陽街2段218號',
    introduction: {
      zh: '艋舺青山宮位於萬華區貴陽街，內政部文化資產介紹將其列為市定古蹟。',
      en: 'Bangka Qingshan Temple stands on Guiyang Street in Wanhua and is listed in the government heritage profile as a municipal historic monument.',
    },
    sources: [qingshanHeritage],
    facts: [
      {
        id: 'building-and-rebuilding', title: { zh: '建廟與重建的不同年代', en: 'Building and rebuilding' },
        description: {
          zh: '文化資產介紹記錄1856年在現址建廟、1859年竣工，當時稱青山王館；1934至1938年間重建後改稱青山宮。',
          en: 'The heritage account records building at this site from 1856 to 1859 as Qingshan Wangguan, followed by rebuilding from 1934 to 1938 and renaming as Qingshan Temple.',
        },
        sources: [qingshanHeritage],
      },
      {
        id: 'courtyard-corridors', title: { zh: '殿宇之間的中庭', en: 'A courtyard between halls' },
        description: {
          zh: '來源介紹三川門與正殿以檐廊相接、圍繞中庭，並指出這些部分仍大致保持昭和年間改建的風格。',
          en: 'The source describes corridors connecting the entrance and main halls around a courtyard, broadly retaining the style of the Shōwa-period rebuilding.',
        },
        sources: [qingshanHeritage],
      },
    ],
    lastReviewed: coverageReviewed, editorialReviewStatus: 'internal-reviewed',
  },
  {
    id: 'bangka-qingshui',
    organizationId: 'org-294-ypjbe6',
    organizationName: '財團法人艋舺清水巖祖師廟',
    district: '萬華區', address: '康定路81號',
    introduction: {
      zh: '艋舺清水巖祖師廟位於康定路81號，政府文化資產介紹記錄其歷次營建與保存的清領時期建築特色。',
      en: 'Bangka Qingshui Temple stands at 81 Kangding Road. Its government heritage profile documents its construction history and surviving Qing-period architectural features.',
    },
    sources: [qingshuiHeritage],
    facts: [
      {
        id: 'construction-interval', title: { zh: '起造、落成與重建', en: 'Construction, completion and rebuilding' },
        description: {
          zh: '文化資產資料記錄1787年起造、1790年落成；廟宇受損後，於1867年完成重建。這些年代屬於不同建築階段。',
          en: 'The heritage account records construction beginning in 1787, completion in 1790, and rebuilding completed in 1867 after damage. These dates describe distinct building stages.',
        },
        sources: [qingshuiHeritage],
      },
      {
        id: 'hall-and-courtyard', title: { zh: '兩殿與廊道的格局', en: 'Halls and connecting corridors' },
        description: {
          zh: '來源將現存格局描述為兩殿、兩廊與兩側護龍；兩殿之間的廊道共同圍出中庭。',
          en: 'The source describes two surviving halls, connecting corridors and side wings, with the corridors enclosing a courtyard between the halls.',
        },
        sources: [qingshuiHeritage],
      },
    ],
    lastReviewed: coverageReviewed, editorialReviewStatus: 'internal-reviewed',
  },
  {
    id: 'dadaocheng-xiahai',
    organizationId: 'org-109-1vaoeq',
    organizationName: '台北霞海城隍廟',
    district: '大同區', address: '迪化街1段61號',
    introduction: {
      zh: '台北霞海城隍廟位於大稻埕迪化街一段61號，文化資產介紹記錄其遷建歷史與廟宇空間。',
      en: 'Taipei Xia-Hai City God Temple is at 61 Dihua Street Section 1 in Dadaocheng. Its heritage profile documents relocation history and the temple’s spatial arrangement.',
    },
    sources: [xiahaiHeritage],
    facts: [
      {
        id: 'relocation-and-building', title: { zh: '遷至大稻埕後的建廟', en: 'Building after relocation to Dadaocheng' },
        description: {
          zh: '政府介紹記錄1853年遷至大稻埕，1856年開始建廟，1859年完工；遷移與建築落成並非同一日期。',
          en: 'The government account records relocation to Dadaocheng in 1853, construction beginning in 1856 and completion in 1859. Relocation and building completion are separate milestones.',
        },
        sources: [xiahaiHeritage],
      },
      {
        id: 'hall-and-pavilion', title: { zh: '正殿與拜亭', en: 'Main hall and worship pavilion' },
        description: {
          zh: '文化資產介紹記錄廟宇由正殿與拜亭構成，拜亭正面門楣上方的廟名匾額帶有八仙刺繡裝飾。',
          en: 'The heritage profile describes a main hall and worship pavilion, with an embroidered Eight Immortals decoration on the temple-name plaque above the pavilion’s front lintel.',
        },
        sources: [xiahaiHeritage],
      },
    ],
    lastReviewed: coverageReviewed, editorialReviewStatus: 'internal-reviewed',
  },
  {
    id: 'lee-chun-sheng-memorial',
    organizationId: 'org-335-mdesof',
    organizationName: '財團法人台北市李春生紀念基督長老教會',
    district: '大同區', address: '貴德街44號',
    introduction: {
      zh: '長老教會官方名錄列出李春生紀念教會會址為貴德街44號，並列明與本資料集相同的財團法人名稱。',
      en: 'The official Presbyterian directory gives Lee Chun-sheng Memorial Church’s address as 44 Guide Street and lists the same registered legal-entity name as this dataset.',
    },
    sources: [leeChurchDirectory],
    facts: [
      {
        id: 'congregation-establishment', title: { zh: '堂會的設立日期', en: 'The congregation’s establishment' },
        description: {
          zh: '官方名錄將堂會設立日期記為1935年5月5日。這是堂會紀錄，不能用來推定所有建築構件或現代法人的成立年代。',
          en: 'The official directory records the congregation’s establishment on 5 May 1935. This does not date every building element or establish the registration date of the modern legal entity.',
        },
        sources: [leeChurchDirectory],
      },
      {
        id: 'former-post-office-site', title: { zh: '郵便電信支局與教會的場所歷史', en: 'A site with postal and church histories' },
        description: {
          zh: '政府文化資產介紹指出，教堂所在地曾為大稻埕郵便電信支局，見證公共建築轉作宗教場所的歷史。',
          en: 'The government heritage profile identifies the church site as the former Dadaocheng post and telegraph office, documenting a change from public to religious use.',
        },
        sources: [leeChurchHeritage],
      },
    ],
    lastReviewed: coverageReviewed, editorialReviewStatus: 'internal-reviewed',
  },
];
