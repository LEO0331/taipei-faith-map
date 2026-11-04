import type { ReligiousOrganization } from '../../types';
import type { OrganizationIdentity } from '../../utils/curatedContent';
import type { EditorialReviewStatus, LocalizedText, SourceReference } from '../faith-spaces/placeProfileTypes';

export type CulturalRouteStop = OrganizationIdentity & {
  title: LocalizedText;
  description: LocalizedText;
  sourceReferences: SourceReference[];
};

export type CulturalRoute = {
  id: string;
  title: LocalizedText;
  description: LocalizedText;
  districtLabels: string[];
  theme: 'heritage' | 'multi-faith' | 'architecture' | 'community';
  stops: CulturalRouteStop[];
  lastReviewed: string;
  editorialReviewStatus: EditorialReviewStatus;
};

export type ResolvedCulturalRoute = {
  route: CulturalRoute;
  organizations: ReligiousOrganization[];
};
