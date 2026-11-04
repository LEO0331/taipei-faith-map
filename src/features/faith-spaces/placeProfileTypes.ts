import type { Language, ReligionType } from '../../types';

export type LocalizedText = Record<Language, string>;
export type EditorialReviewStatus = 'internal-reviewed' | 'community-reviewed' | 'pending';

export type SourceReference = {
  id: string;
  title: LocalizedText;
  url: string;
  publisher: string;
  verifiedAt: string;
};

export type VerifiedFact = {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  sources: SourceReference[];
};

/** Curated content is separate from the generated public-data record. */
export type PlaceProfile = {
  id: string;
  organizationId: string;
  organizationName: string;
  district: string;
  address: string;
  introduction: LocalizedText;
  sources: SourceReference[];
  facts: VerifiedFact[];
  lastReviewed: string;
  editorialReviewStatus: EditorialReviewStatus;
};

export type TraditionContent = {
  religion: ReligionType;
  title: LocalizedText;
  introduction: LocalizedText;
  sources: SourceReference[];
  concepts: VerifiedFact[];
  lastReviewed: string;
  editorialReviewStatus: EditorialReviewStatus;
};
