import type { ReligiousOrganization } from '../types';
import type { EditorialReviewStatus, LocalizedText, SourceReference } from '../features/faith-spaces/placeProfileTypes';
import { getSafeSourceUrl } from '../features/faith-spaces/culturalSources';

export type OrganizationIdentity = {
  organizationId: string;
  organizationName: string;
  district: string;
  address: string;
};

const normalizeIdentity = (value: string) => typeof value === 'string' ? value.normalize('NFC').trim().replace(/\s+/gu, ' ') : '';
export const nonempty = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;

export function matchesOrganizationDetails(identity: Pick<OrganizationIdentity, 'organizationName' | 'district' | 'address'>, organization: ReligiousOrganization) {
  const pairs = [[identity.organizationName, organization.name], [identity.district, organization.district], [identity.address, organization.address]];
  return pairs.every(([left, right]) => nonempty(left) && normalizeIdentity(left) === normalizeIdentity(right));
}

/** IDs alone are insufficient after a generated dataset has been refreshed. */
export function resolveOrganizationIdentity(identity: OrganizationIdentity, organizations: ReligiousOrganization[]): ReligiousOrganization | undefined {
  const ids = organizations.filter(item => item.id === identity.organizationId);
  if (ids.length !== 1 || !matchesOrganizationDetails(identity, ids[0])) return undefined;
  return organizations.filter(item => matchesOrganizationDetails(identity, item)).length === 1 ? ids[0] : undefined;
}

export function isValidDateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function checkLocalized(value: LocalizedText, path: string, errors: string[]) {
  for (const language of ['zh', 'en'] as const) {
    if (!nonempty(value?.[language])) errors.push(`${path}.${language} must be nonempty`);
  }
}

export function checkSources(sources: SourceReference[], path: string, errors: string[]) {
  if (!Array.isArray(sources) || sources.length === 0) {
    errors.push(`${path} must include source references`);
    return;
  }
  const ids = new Set<string>();
  for (const [index, source] of sources.entries()) {
    const sourcePath = `${path}[${index}]`;
    if (!source || typeof source !== 'object') { errors.push(`${sourcePath} must be a source reference`); continue; }
    if (!nonempty(source.id)) errors.push(`${sourcePath}.id must be nonempty`);
    else if (ids.has(source.id)) errors.push(`${sourcePath}.id duplicates a source reference`);
    ids.add(source.id);
    checkLocalized(source.title, `${sourcePath}.title`, errors);
    if (!nonempty(source.publisher)) errors.push(`${sourcePath}.publisher must be nonempty`);
    if (!getSafeSourceUrl(source.url)) errors.push(`${sourcePath}.url must be a safe absolute HTTP(S) URL`);
    if (!isValidDateOnly(source.verifiedAt)) errors.push(`${sourcePath}.verifiedAt must be a valid YYYY-MM-DD date`);
  }
}

export function checkEditorial(content: { lastReviewed: string; editorialReviewStatus: EditorialReviewStatus }, path: string, errors: string[]) {
  if (!isValidDateOnly(content.lastReviewed)) errors.push(`${path}.lastReviewed must be a valid YYYY-MM-DD date`);
  if (!['internal-reviewed', 'community-reviewed', 'pending'].includes(content.editorialReviewStatus)) errors.push(`${path}.editorialReviewStatus must be explicit`);
}
