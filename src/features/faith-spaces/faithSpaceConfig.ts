import type { Language, ReligionType } from '../../types';

export type SceneId = 'taoist' | 'buddhist' | 'christian' | 'catholic' | 'islamic' | 'generic';
export type Localized = Record<Language, string>;
export type Hotspot = { id: string; title: Localized; body: Localized; x: number; y: number };
export type FaithSpaceConfig = {
  id: SceneId;
  title: Localized;
  introduction: Localized;
  etiquette: Localized;
  hotspots: Hotspot[];
};

const text = (zh: string, en: string): Localized => ({ zh, en });

export const sceneConfigs: Record<SceneId, FaithSpaceConfig> = {
  taoist: {
    id: 'taoist',
    title: text('簷下的文化風景', 'Beneath the temple eaves'),
    introduction: text('從屋脊、燈籠與院落，欣賞臺灣道教廟宇的建築語彙。各廟的奉祀對象與空間配置並不相同。', 'Explore architectural ideas found in Taiwanese Taoist temples through rooflines, lanterns and courtyards. Deities and layouts differ between temples.'),
    etiquette: text('放低音量，勿擋住出入口。拍照、進入殿內或參與活動前，請先詢問現場人員並遵守公告。', 'Speak softly and keep entrances clear. Ask staff before photographing, entering halls or joining activities, and follow posted guidance.'),
    hotspots: [
      { id: 'roof', x: 50, y: 27, title: text('屋脊與工藝', 'Rooflines and craftsmanship'), body: text('臺灣傳統廟宇可見上翹的屋脊與豐富裝飾，展現匠師技藝。裝飾題材與做法因年代、地方及建築而異。', 'Some traditional Taiwanese temples feature upturned rooflines and rich ornament, reflecting the craft of their makers. Motifs and techniques vary by period, region and building.') },
      { id: 'lantern', x: 23, y: 48, title: text('燈籠的文化意義', 'The cultural life of lanterns'), body: text('燈籠兼具照明與節慶裝飾功能，也可寄託祝福。不同場合的燈籠有不同用途，不能僅從外觀判定某座廟的信仰內容。', 'Lanterns provide light and festive decoration and can express good wishes. Their uses vary by occasion; their appearance alone does not identify a temple’s beliefs.') },
      { id: 'courtyard', x: 65, y: 72, title: text('院落與參訪', 'Courtyards and visiting'), body: text('院落串連不同建築，也為人們留出停步的空間。參訪時留意動線與現場公告，讓正在進行的活動保有空間。', 'Courtyards connect buildings and offer space to pause. Follow local routes and notices, leaving room for activities already taking place.') },
    ],
  },
  buddhist: {
    id: 'buddhist',
    title: text('蓮花與靜謐之間', 'A space of lotus and stillness'),
    introduction: text('以蓮花、木構與坐墊認識佛教空間的部分視覺元素。佛教傳統多元，本場景不代表所有寺院或修行方式。', 'Discover selected visual elements of Buddhist spaces through lotus forms, timber and cushions. Buddhist traditions are diverse; this scene does not represent every temple or practice.'),
    etiquette: text('保持安靜，尊重正在使用空間的人。鞋履、攝影及開放區域請依現場規定；不確定時可先詢問。', 'Keep quiet and respect people using the space. Follow local rules on footwear, photography and access; ask when unsure.'),
    hotspots: [
      { id: 'lotus', x: 50, y: 56, title: text('蓮花的意象', 'The lotus motif'), body: text('蓮花在佛教藝術中常與清淨、覺悟相連。這裡以簡化花形呈現文化意象，不代表該場所擁有此物件。', 'In Buddhist art, the lotus is often associated with purity and awakening. This simplified flower is a cultural motif, not a claim about an object at this location.') },
      { id: 'hall', x: 25, y: 32, title: text('木構與光線', 'Timber and light'), body: text('本示意以木構、柔和光線與開放地面營造安靜的廳堂。實際佛教場所可能有很不一樣的材料、尺度與使用方式。', 'Timber, soft light and an open floor create a quiet illustrative hall. Real Buddhist spaces may use very different materials, scales and arrangements.') },
      { id: 'cushions', x: 70, y: 74, title: text('坐墊與停歇', 'Cushions and a moment to pause'), body: text('部分禪修空間使用坐墊，也有座椅或其他安排。你可使用下方的靜心計時器，自由停歇片刻；這不是宗教儀式或修行指導。', 'Some meditation spaces use cushions; others offer chairs or different arrangements. Use the reflection timer below for an optional pause. It is not a religious ceremony or instruction in practice.') },
    ],
  },
  christian: {
    id: 'christian',
    title: text('光線中的相聚', 'Gathering in the light'),
    introduction: text('以簡樸的座席、窗光與十字架，介紹基督宗教聚會空間的一種可能樣貌。資料中的「基督教」分類無法確認個別團體的宗派。', 'Simple seating, window light and a cross suggest one possible Christian gathering space. The dataset’s Christianity category does not establish an organization’s denomination.'),
    etiquette: text('留意聚會與開放時間，尊重參與者的安靜與隱私。拍照或加入活動前請詢問，無須因參訪而參與任何儀式。', 'Check visiting and gathering times, and respect participants’ quiet and privacy. Ask before photographing or joining activities; visiting does not require taking part in a rite.'),
    hotspots: [
      { id: 'windows', x: 25, y: 35, title: text('窗與自然光', 'Windows and natural light'), body: text('窗戶讓光線進入聚會空間。本圖採用簡潔的窗形；不同教會的建築可能從日常室內空間到專門興建的禮拜堂，十分多樣。', 'Windows bring light into gathering spaces. This illustration uses simple windows; church architecture ranges from everyday interiors to purpose-built worship buildings.') },
      { id: 'congregation', x: 50, y: 48, title: text('會眾與共同聚會', 'Congregation and shared worship'), body: text('基督宗教的聚會可包括共同敬拜與彼此關懷。十字架是重要的信仰象徵，但其呈現與聚會形式隨傳統和團體而異。', 'Christian gatherings can include shared worship and mutual care. The cross is an important symbol of faith, while its display and forms of gathering vary among traditions and communities.') },
      { id: 'seating', x: 70, y: 73, title: text('座席與靜心角落', 'Seating and a quiet corner'), body: text('座席為共同聚會與個人停歇提供空間。此處的靜心片刻完全自願，也不會儲存或傳送你的活動。', 'Seating makes room for gathering and individual pauses. Quiet reflection here is entirely optional, and your reflection activity is never stored or transmitted.') },
    ],
  },
  catholic: {
    id: 'catholic',
    title: text('彩光中的建築故事', 'Architecture in coloured light'),
    introduction: text('以彩繪玻璃意象、長椅與祭台區域認識天主教聖堂的部分建築元素。天主教屬於基督宗教；本地資料將其獨立分類。', 'Explore selected elements of Catholic church architecture through stained-glass-inspired panels, pews and an altar area. Catholicism is part of Christianity and has a separate category in this dataset.'),
    etiquette: text('請輕聲交談，尊重正在祈禱的人。祭台區域與其他限制空間，請依現場指引進入；拍攝前先確認規定。', 'Speak softly and respect people praying. Follow local guidance on access to the altar area and other restricted spaces, and check photography rules first.'),
    hotspots: [
      { id: 'glass', x: 28, y: 35, title: text('彩繪玻璃', 'Stained glass'), body: text('彩繪玻璃結合色彩與光線，有些作品傳達信仰故事，有些運用抽象圖案。本圖採用原創幾何色塊，不重現任何特定聖堂的玻璃畫。', 'Stained glass brings colour and light together. Some works convey faith stories; others use abstract patterns. These original geometric panels do not reproduce windows from a specific church.') },
      { id: 'altar', x: 50, y: 54, title: text('祭台區域', 'The altar area'), body: text('祭台在天主教彌撒中具有重要地位。此處僅以建築意象介紹空間，不模擬彌撒，也不表示該登記場所具有圖中配置。', 'The altar has an important role in the Catholic Mass. This architectural illustration does not simulate a Mass or establish the layout of the registered location.') },
      { id: 'pews', x: 72, y: 74, title: text('長椅與公共空間', 'Pews and shared space'), body: text('長椅是一種供會眾聚集的座席安排，實際座位形式可不同。在開放時段，訪客可依現場指引安靜停留。', 'Pews are one seating arrangement for a congregation; actual seating can differ. During visiting hours, guests can pause quietly in accordance with local guidance.') },
    ],
  },
  islamic: {
    id: 'islamic',
    title: text('幾何與拱門的秩序', 'Geometry, arches and space'),
    introduction: text('從幾何紋樣、拱形空間與朝向的概念，認識清真寺建築的部分特色。本圖不包含經文、神聖書法或禮拜模擬。', 'Explore selected ideas in mosque architecture through geometric patterns, arches and orientation. This illustration includes no Quranic text, sacred calligraphy or simulated formal prayer.'),
    etiquette: text('參訪前請確認開放時段、服裝與鞋履規定。尊重禮拜者，不跨越使用中的禮拜區；攝影與參觀動線請詢問現場人員。', 'Check visiting hours, dress and footwear guidance before entering. Respect worshippers and avoid crossing an active prayer area; ask staff about photography and visitor routes.'),
    hotspots: [
      { id: 'geometry', x: 25, y: 40, title: text('幾何裝飾', 'Geometric decoration'), body: text('重複的圓形、多邊形與星形，是伊斯蘭藝術中可見的裝飾語彙之一。這裡使用原創幾何構圖，不將文字當作裝飾。', 'Repeated circles, polygons and stars are one decorative vocabulary found in Islamic art. This scene uses original geometric designs rather than text as ornament.') },
      { id: 'qibla', x: 50, y: 45, title: text('朝向與米哈拉布', 'Qibla and the mihrab'), body: text('朝向（qibla）指禮拜時面向麥加的方向。許多清真寺以米哈拉布壁龕標示此方向。圖中拱形僅作文化示意，不能用作實際方向指引。', 'Qibla is the direction toward Mecca faced in prayer. Many mosques mark it with a mihrab niche. This illustrated arch is educational and cannot be used as an actual direction guide.') },
      { id: 'entry', x: 75, y: 72, title: text('參訪與禮拜空間', 'Visiting a prayer space'), body: text('清真寺的空間安排與參訪規範各有不同。先確認可進入的區域與時間，並為正在禮拜的人保留安靜與通行空間。', 'Mosque layouts and visiting arrangements differ. Check accessible areas and times, and preserve quiet and clear passage for people at prayer.') },
    ],
  },
  generic: {
    id: 'generic',
    title: text('多元信仰的文化展間', 'A gallery of diverse traditions'),
    introduction: text('此教別的專屬文化場景尚未提供。這是中性的文化探索空間，不代表該團體的建築、信仰符號或宗教實踐。', 'A tradition-specific cultural scene is not yet available for this category. This neutral gallery does not represent the organization’s architecture, religious symbols or practices.'),
    etiquette: text('不同團體有不同參訪規範。行前查詢官方資訊，尊重現場公告，並在拍照或參與活動前詢問。', 'Visitor guidance differs between organizations. Consult official information, respect posted notices, and ask before photographing or joining activities.'),
    hotspots: [
      { id: 'diversity', x: 25, y: 40, title: text('看見多元', 'Recognizing diversity'), body: text('臺北的宗教生活包含許多不同傳統。未提供專屬場景並不代表其重要性較低；本展間保留空間，供未來加入經審核的文化介紹。', 'Taipei’s religious life includes many traditions. The absence of a dedicated scene does not imply lesser importance. This gallery leaves room for reviewed cultural introductions in future updates.') },
      { id: 'data', x: 50, y: 45, title: text('資料與文化的界線', 'Data and cultural context'), body: text('公開資料提供登記名稱、教別與地址等資訊，無法據此確認室內配置、神祇、宗派或活動時間。下方場所資料與本文化示意應分開閱讀。', 'Public records provide registered names, categories and addresses. They do not establish interiors, deities, denominations or schedules. Read location records separately from this cultural illustration.') },
      { id: 'visit', x: 75, y: 72, title: text('帶著尊重探索', 'Explore with respect'), body: text('不熟悉的傳統值得耐心了解。從團體自己的介紹與現場人員的指引開始，避免由名稱或外觀推斷他人的信仰。', 'Take time to learn about unfamiliar traditions. Begin with the organization’s own introduction and local guidance, and avoid inferring beliefs from a name or appearance.') },
    ],
  },
};

const religionScenes: Partial<Record<ReligionType, SceneId>> = {
  道教: 'taoist', 佛教: 'buddhist', 基督教: 'christian', 天主教: 'catholic', 回教: 'islamic',
};

export function getFaithSpaceConfig(religion: ReligionType): FaithSpaceConfig {
  return sceneConfigs[religionScenes[religion] ?? 'generic'];
}
