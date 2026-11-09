import type { SourceReference } from '../faith-spaces/placeProfileTypes';
import type { CulturalRoute } from './routeTypes';

const reviewed = '2026-11-09';
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
const ciyou = source('route-ciyou-landscape', '內政部：松山慈祐宮宗教百景', 'Ministry of the Interior: Songshan Ciyou Temple',
  'https://taiwangods.moi.gov.tw/Religious_Culture/html/landscape/1_0011.aspx?i=2', '內政部');
const songshan = source('route-danlan-songshan', '淡蘭國家綠道：松山與錫口街', 'Danlan National Greenway: Songshan and old Xikou Street',
  'https://danlantrail.necoast-nsa.gov.tw/Towns-Content.aspx?a=3424&cat=3408&fromCnt=0&l=1&listid=3256', '交通部觀光署東北角及宜蘭海岸國家風景區管理處');
const fude = source('route-songshan-fude-memory', '國家文化記憶庫：松山福德宮', 'National Cultural Memory Bank: Songshan Fude Temple',
  'https://tcmb.culture.tw/zh-tw/detail?id=292340&indexCode=Culture_Place', '文化部國家文化記憶庫（松山區公所暨松山社區大學《松山區志》編撰團隊）');
const xinsheng = source('route-xinsheng-pictorial', '台北畫刊：大安天堂路朝聖之旅', 'Taipei Pictorial: A journey along Daan’s Paradise Road',
  'https://www.travel.taipei/file/34731/', '臺北市政府觀光傳播局');
const mosque = source('route-taipei-mosque-guide', '台北清真寺：歷史與建築導覽', 'Taipei Grand Mosque: History and architecture',
  'https://www.taipeimosque.org.tw/guided.php?lang=tw', '台北清真寺');
const graceHistory = source('route-grace-baptist-history', '台北懷恩堂：懷恩六十紀事', 'Grace Baptist Church: Sixtieth anniversary history',
  'https://www.gbc.org.tw/gbc60/', '台北懷恩堂');
const graceIdentity = source('route-grace-baptist-location', '台北懷恩堂：地點', 'Grace Baptist Church: Location',
  'https://www.gbc.org.tw/time-and-location/', '台北懷恩堂');

/** Editorial stop sequences, not surveyed pedestrian paths or access guarantees. */
export const culturalRoutes: CulturalRoute[] = [
  {
    id: 'wanhua-temple-heritage',
    title: { zh: '艋舺三處廟宇文化', en: 'Three temple stories in Bangka' },
    description: {
      zh: '沿著廣州街、貴陽街與康定路，從龍山寺的多殿格局、青山宮的院落，讀到清水巖重建後的兩殿。三站讓你比較艋舺廟宇如何安排空間，以及重建留下哪些線索。',
      en: 'Read three temple layouts across Guangzhou, Guiyang and Kangding streets. Compare Lungshan’s sequence of halls, Qingshan’s courtyards and the two halls at Qingshui after rebuilding.',
    },
    districtLabels: ['萬華區'], theme: 'heritage',
    stops: [
      {
        organizationId: 'org-83-1arg2kq', organizationName: '財團法人台北市艋舺龍山寺', district: '萬華區', address: '廣州街211號',
        title: { zh: '廣州街的龍山寺', en: 'Lungshan Temple on Guangzhou Street' },
        description: {
          zh: '內政部記錄龍山寺現貌主要來自1920年改建，並描述前殿、正殿、後殿與兩側護龍。先辨認沿中軸排列的殿堂，再到下一站比較殿堂之間的開放空間。',
          en: 'The Ministry of the Interior traces the temple’s present form largely to the 1920 rebuilding and describes three halls with side wings. Start by following the central sequence of halls, then compare the open space between halls at the next stop.',
        },
        sourceReferences: [lungshan],
      },
      {
        organizationId: 'org-21-1bs6r0m', organizationName: '艋舺青山宮', district: '萬華區', address: '貴陽街2段218號',
        title: { zh: '貴陽街的青山宮', en: 'Qingshan Temple on Guiyang Street' },
        description: {
          zh: '內政部將青山宮的格局描述為三落兩院，三川門與正殿以檐廊相接。與上一站的中軸相比，這裡可留意廊道如何連接殿堂與院落。',
          en: 'The Ministry of the Interior describes three building sections and two courtyards at Qingshan, with covered corridors joining the entrance and main halls. Compare how the corridors connect built and open spaces.',
        },
        sourceReferences: [qingshan],
      },
      {
        organizationId: 'org-294-ypjbe6', organizationName: '財團法人艋舺清水巖祖師廟', district: '萬華區', address: '康定路81號',
        title: { zh: '康定路的清水巖', en: 'Qingshui Temple on Kangding Road' },
        description: {
          zh: '內政部記載清水巖重建於1867年完成，原有三殿現僅餘兩殿。以殿堂數量回看三站，可以讀到重建如何改變廟宇格局。',
          en: 'The Ministry of the Interior records completion of rebuilding in 1867. Two of the original three halls remain. Compare the sequence here with the earlier stops to see how rebuilding changed a temple layout.',
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
      zh: '從貴德街曾作郵局的建築，讀到迪化街的城隍廟。兩站以不同方式留下信仰在街區落腳的線索，一處是建築用途的轉變，另一處是廟殿與拜亭的配置。',
      en: 'Start with a former post office on Guide Street and continue to the City God temple on Dihua Street. Compare the building’s change of use with the temple’s arrangement of hall and pavilion.',
    },
    districtLabels: ['大同區'], theme: 'multi-faith',
    stops: [
      {
        organizationId: 'org-335-mdesof', organizationName: '財團法人台北市李春生紀念基督長老教會', district: '大同區', address: '貴德街44號',
        title: { zh: '李春生紀念教會', en: 'Lee Chun-sheng Memorial Church' },
        description: {
          zh: '內政部記錄貴德街44號在1903至1923年間曾作郵便電信支局。長老教會的1935年資料指的是堂會設立。分開這兩段時間，就能讀出同一處建築的用途變化。',
          en: 'The heritage record describes 44 Guide Street’s use as a post and telegraph office from 1903 to 1923. The Presbyterian Church’s 1935 date refers to the congregation’s establishment. Read the two dates together to trace changes in how this site was used.',
        },
        sourceReferences: [leeIdentity, leeHeritage],
      },
      {
        organizationId: 'org-109-1vaoeq', organizationName: '台北霞海城隍廟', district: '大同區', address: '迪化街1段61號',
        title: { zh: '迪化街的霞海城隍廟', en: 'Xia-Hai City God Temple on Dihua Street' },
        description: {
          zh: '內政部記錄霞海城隍廟於1859年完工，並描述正殿與拜亭。從街道辨認拜亭與正殿的關係，和上一站的建築用途變化一起讀，能看出街區裡不同的信仰空間。',
          en: 'The Ministry of the Interior records completion of the temple in 1859 and describes its main hall and worship pavilion. Look at how the pavilion and hall meet the street, then compare this arrangement with the repurposed building at the previous stop.',
        },
        sourceReferences: [xiahai],
      },
    ],
    lastReviewed: reviewed, editorialReviewStatus: 'internal-reviewed',
  },
  {
    id: 'songshan-raohe-temples',
    title: { zh: '饒河街的兩座廟', en: 'Two temples around Raohe Street' },
    description: {
      zh: '從八德路的慈祐宮到饒河街的福德宮，認識舊錫口街一帶的兩座廟。先閱讀慈祐宮的多進廟殿，再看街道拓寬後，信徒如何在新址重建福德宮。',
      en: 'Explore two temples around old Xikou Street. Start with Ciyou’s sequence of halls on Bade Road, then learn how Raohe Street’s widening led Fude Temple’s supporters to rebuild at its current address.',
    },
    districtLabels: ['松山區'], theme: 'community',
    stops: [
      {
        organizationId: 'org-1-mtb4vg', organizationName: '財團法人台北市松山慈祐宮', district: '松山區', address: '八德路4段761號',
        title: { zh: '八德路的松山慈祐宮', en: 'Songshan Ciyou Temple on Bade Road' },
        description: {
          zh: '內政部描述慈祐宮入口五門、縱深三進，正殿有三層重簷。先從入口和屋頂辨認這座媽祖廟的空間，再到下一站看街道變動如何影響另一座廟。',
          en: 'The Ministry of the Interior describes five entrance doors, three successive halls and a three-tiered roof on the main hall. Read the entrance and roof of this Mazu temple before comparing the street changes behind the next stop.',
        },
        sourceReferences: [ciyou, songshan],
      },
      {
        organizationId: 'org-22-cu44hi', organizationName: '松山福德宮', district: '松山區', address: '饒河街92號',
        title: { zh: '饒河街的松山福德宮', en: 'Songshan Fude Temple on Raohe Street' },
        description: {
          zh: '《松山區志》編撰團隊記錄這座主祀福德正神的廟，原址因1982年道路拓寬拆除，信徒募資在饒河街92號重建。用這段遷建史理解廟宇如何延續街區的日常信仰。',
          en: 'The Songshan district history team records that road widening in 1982 displaced this temple dedicated to Fude Zhengshen. Supporters raised funds to rebuild at 92 Raohe Street. Its move offers a way to read continuity through street change.',
        },
        sourceReferences: [fude],
      },
    ],
    lastReviewed: reviewed, editorialReviewStatus: 'internal-reviewed',
  },
  {
    id: 'daan-xinsheng-faith-architecture',
    title: { zh: '新生南路的圓頂與屋簷', en: 'Domes and rooflines on Xinsheng South Road' },
    description: {
      zh: '從新生南路二段的清真寺到三段的懷恩堂，比較兩座禮拜建築如何以不同的外觀面向街道。圓頂、拱廊與傳統中式屋頂提供兩種閱讀大安信仰空間的線索。',
      en: 'Compare two places of worship on Xinsheng South Road, from the mosque in Section 2 to Grace Baptist Church in Section 3. Look at how a dome and arches, then a traditional Chinese roofline, give each building a different presence on the street.',
    },
    districtLabels: ['大安區'], theme: 'architecture',
    stops: [
      {
        organizationId: 'org-530-nftfoh', organizationName: '財團法人台北清真寺基金會', district: '大安區', address: '新生南路2段62號',
        title: { zh: '台北清真寺的圓頂與拱廊', en: 'The dome and arches of Taipei Grand Mosque' },
        description: {
          zh: '清真寺的官方導覽介紹新生南路現址及禮拜大殿。《台北畫刊》也以圓頂、拱廊和喚拜尖塔辨認其外觀。先觀察這些輪廓，再比較下一站的屋頂。',
          en: 'The mosque’s guide documents its current site and prayer hall. Taipei Pictorial identifies the dome, arches and minarets as exterior features. Start with that silhouette, then compare the roofline at the next stop.',
        },
        sourceReferences: [mosque, xinsheng],
      },
      {
        organizationId: 'org-345-5rclx6', organizationName: '財團法人台北市基督教浸信會懷恩堂', district: '大安區', address: '新生南路3段90號',
        title: { zh: '懷恩堂的中式屋頂', en: 'Grace Baptist Church’s Chinese roofline' },
        description: {
          zh: '懷恩堂的紀事將重建教堂採用的中式建築特色，解釋為表達基督教在地化的設計。與上一站並讀，可以比較同一條路上的禮拜空間如何透過建築表達各自的文化背景。',
          en: 'Grace Baptist Church’s anniversary history explains the use of traditional Chinese architectural forms in its rebuilt church as a local expression of Christianity. Compare that design choice with the mosque’s exterior on the same road.',
        },
        sourceReferences: [graceIdentity, graceHistory, xinsheng],
      },
    ],
    lastReviewed: reviewed, editorialReviewStatus: 'internal-reviewed',
  },
];
