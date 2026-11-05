import type { LocalizedText } from '../features/faith-spaces/placeProfileTypes';

export type RelatedCulturalTarget = {
  kind: 'milestone' | 'story' | 'route' | 'event';
  id: string;
  organizationId: string;
};

export type RelatedSelectionRequest = { target: RelatedCulturalTarget; token: number };

export type RelatedCulturalItem = {
  target: RelatedCulturalTarget;
  title: LocalizedText;
  detail?: LocalizedText;
};
