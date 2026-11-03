import type { ReligionType } from '../../types';
import type { SourceReference, TraditionContent } from './placeProfileTypes';

const reviewed = '2026-11-03';
const iktIntroduction: SourceReference = {
  id: 'ikt-foundation-introduction',
  title: { zh: '寶光紹興崇華聖道基金會：一貫道簡介', en: 'Baoguang Shaoxing Chonghua Foundation: introduction to I-Kuan Tao' },
  url: 'https://www.bgshchsty.org/about/',
  publisher: '財團法人一貫道寶光紹興崇華聖道基金會', verifiedAt: reviewed,
};
const taiwanReligion: SourceReference = {
  id: 'taiwan-religion-moit',
  title: { zh: '行政院國情簡介：宗教信仰在臺灣', en: 'Executive Yuan: religious beliefs in Taiwan' },
  url: 'https://www.ey.gov.tw/state/D00B53C98CD4F08F/0fe638e7-c0bf-401e-b9f2-3db11eecd508',
  publisher: '行政院（資料來源：內政部）', verifiedAt: reviewed,
};
const bahaiRelationships: SourceReference = {
  id: 'bahai-essential-relationships',
  title: { zh: '巴哈伊全球官方網站：基本關係', en: 'Worldwide Bahá’í Community: Essential Relationships' },
  url: 'https://www.bahai.org/beliefs/essential-relationships',
  publisher: 'Bahá’í International Community', verifiedAt: reviewed,
};
const tenrikyoIntroduction: SourceReference = {
  id: 'tenrikyo-america-introduction',
  title: { zh: '天理教美加傳道廳：天理教簡介', en: 'Tenrikyo Mission Headquarters in America & Canada: Introduction to Tenrikyo' },
  url: 'https://tenrikyoamericacanada.org/introduction-to-tenrikyo-2',
  publisher: 'Tenrikyo Mission Headquarters in America & Canada', verifiedAt: reviewed,
};

// Reviewed educational context only. The neutral gallery remains an illustration
// and does not depict any tradition's actual buildings or local arrangements.
export const traditionContent: TraditionContent[] = [
  {
    religion: '一貫道', title: { zh: '一貫道 · 生活中的文化', en: 'I-Kuan Tao · Culture in daily life' },
    introduction: {
      zh: '寶光紹興崇華聖道基金會的介紹，將一貫道與儒、釋、道的文化傳承及日常修養相連。這是傳統層級的簡介，並非所選場所的活動紀錄。',
      en: 'An I-Kuan Tao foundation’s introduction connects the tradition with Confucian, Buddhist and Taoist inheritances and everyday self-cultivation. This is tradition-level context, not a record of this location’s activities.',
    },
    sources: [iktIntroduction],
    concepts: [
      {
        id: 'learning-and-service', title: { zh: '讀經與社會服務', en: 'Learning and social service' },
        description: {
          zh: '內政部提供的臺灣宗教介紹，記錄一貫道推廣讀經與參與慈善救助。這不表示每個登記團體都提供相同服務。',
          en: 'The Ministry of the Interior’s account of religion in Taiwan notes I-Kuan Tao’s promotion of classics reading and charitable assistance. It does not establish identical services at every registered organization.',
        },
        sources: [taiwanReligion],
      },
    ],
    lastReviewed: reviewed, editorialReviewStatus: 'internal-reviewed',
  },
  {
    religion: '巴哈伊教', title: { zh: '巴哈伊信仰 · 人類一家', en: 'Bahá’í Faith · One human family' },
    introduction: {
      zh: '巴哈伊全球官方網站將人類一體視為信仰的核心原則，強調個人、社群與制度之間的和諧關係。',
      en: 'The worldwide Bahá’í community presents humanity’s oneness as a central principle and emphasizes harmonious relationships among individuals, communities and institutions.',
    },
    sources: [bahaiRelationships],
    concepts: [
      {
        id: 'unity-and-diversity', title: { zh: '多樣性中的合作', en: 'Cooperation amid diversity' },
        description: {
          zh: '該介紹以人體內不同細胞的合作作比喻，說明多樣角色可共同維持整體。此處不推定所選團體的聚會形式或建築符號。',
          en: 'The introduction compares society with a body whose diverse cells work together. This educational analogy does not establish the selected organization’s meeting arrangements or architectural symbols.',
        },
        sources: [bahaiRelationships],
      },
    ],
    lastReviewed: reviewed, editorialReviewStatus: 'internal-reviewed',
  },
  {
    religion: '天理教', title: { zh: '天理教 · 相互扶助', en: 'Tenrikyo · Mutual help' },
    introduction: {
      zh: '天理教美加傳道廳的介紹，以「陽氣生活」（Joyous Life）說明其重要理念：人們相互尊重、扶助並分享喜悅。',
      en: 'Tenrikyo’s mission headquarters in America and Canada explains the Joyous Life as an important ideal involving mutual respect, helping others and sharing joy.',
    },
    sources: [tenrikyoIntroduction],
    concepts: [
      {
        id: 'shared-joy', title: { zh: '共同的喜悅', en: 'Joy shared with others' },
        description: {
          zh: '該介紹將喜悅與他人的福祉相連，而非只追求個人快樂。這是文化閱讀內容，不是宗教實踐指導或在地活動說明。',
          en: 'The introduction relates joy to others’ well-being rather than personal enjoyment alone. This is cultural reading, not instruction in religious practice or a description of local activities.',
        },
        sources: [tenrikyoIntroduction],
      },
    ],
    lastReviewed: reviewed, editorialReviewStatus: 'internal-reviewed',
  },
];

export function getTraditionContent(religion: ReligionType): TraditionContent | undefined {
  return traditionContent.find(content => content.religion === religion && content.editorialReviewStatus !== 'pending');
}
