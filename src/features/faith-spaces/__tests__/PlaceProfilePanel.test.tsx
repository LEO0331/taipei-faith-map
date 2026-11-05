// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PlaceProfilePanel } from '../PlaceProfilePanel';
import { getPlaceProfile } from '../placeProfileLookup';
import type { PlaceProfile, SourceReference } from '../placeProfileTypes';
import type { ReligiousOrganization } from '../../../types';

vi.mock('../placeProfileLookup', () => ({ getPlaceProfile: vi.fn() }));
vi.mock('../../../components/RelatedCulturalContent', () => ({ RelatedCulturalContent: () => { throw new Error('Optional discovery chunk unavailable'); } }));

const organization: ReligiousOrganization = {
  id: 'example-place', name: '登記名稱', religion: '道教', district: '松山區', address: '登記地址1號',
  source: 'Government dataset', festivalDates: [], originalX: 0, originalY: 0, latitude: 25, longitude: 121,
};
const source: SourceReference = {
  id: 'institution-history', title: { zh: '機構沿革', en: 'Institutional history' },
  url: 'https://example.org/history', publisher: 'Example Institution', verifiedAt: '2026-11-03',
};
const profile: PlaceProfile = {
  id: 'curated-example', organizationId: organization.id, organizationName: organization.name,
  district: organization.district, address: organization.address,
  introduction: { zh: '有來源的場所介紹。', en: 'A sourced introduction to this place.' }, sources: [source],
  facts: [{ id: 'documented-detail', title: { zh: '經查證的細節', en: 'Documented detail' }, description: { zh: '此細節有相應資料來源。', en: 'This detail has its own supporting source.' }, sources: [{ ...source, id: 'detail-source', url: 'https://example.org/detail', title: { zh: '細節資料', en: 'Detail record' } }] }],
  lastReviewed: '2026-11-03', editorialReviewStatus: 'internal-reviewed',
};

beforeEach(() => vi.mocked(getPlaceProfile).mockReturnValue(profile));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe('verified place profile panel', () => {
  it('keeps the profile and its evidence readable when optional related content fails', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      const { rerender } = render(<PlaceProfilePanel organization={organization} organizations={[organization]} language="en" onNavigateRelated={vi.fn()} />);
      await screen.findByText('Related cultural content is unavailable. The place profile and sources remain available.');
      expect(screen.getByText(profile.introduction.en)).toBeTruthy();
      expect(screen.getByRole('link', { name: /Institutional history/ })).toBeTruthy();
      expect(screen.getByRole('region', { name: 'Public Open Data · Registration' })).toBeTruthy();
      rerender(<PlaceProfilePanel organization={organization} organizations={[organization]} language="zh" onNavigateRelated={vi.fn()} />);
      expect(screen.getByText('相關文化內容暫時無法載入，場所介紹與資料來源仍可閱讀。')).toBeTruthy();
      expect(screen.getByText(profile.introduction.zh)).toBeTruthy();
    } finally { spy.mockRestore(); }
  });
  it('keeps introduction and individual claims connected to evidence and labels editorial review', () => {
    const { container } = render(<PlaceProfilePanel organization={organization} language="en" />);
    expect(getPlaceProfile).toHaveBeenCalledWith(organization);
    expect(screen.getByRole('heading', { name: 'About This Place' })).toBeTruthy();
    expect(screen.getByText(profile.introduction.en)).toBeTruthy();
    const fact = container.querySelector('.place-fact')!;
    expect(within(fact as HTMLElement).getByRole('heading', { name: 'Documented detail' })).toBeTruthy();
    expect(within(fact as HTMLElement).getByRole('link', { name: /Detail record/ }).getAttribute('href')).toBe('https://example.org/detail');
    expect(screen.getByText(/Internal fact-check/)).toBeTruthy();
    expect(screen.getByText(/does not imply approval or endorsement/)).toBeTruthy();
    const openData = screen.getByRole('region', { name: 'Public Open Data · Registration' });
    expect(within(openData).getByText(organization.name)).toBeTruthy();
    expect(within(openData).getByText(organization.address)).toBeTruthy();
    expect(within(openData).getByText(organization.source)).toBeTruthy();
    expect(within(openData).queryByText(profile.facts[0].description.en)).toBeNull();
  });

  it('updates all presentation labels and content when the language changes', () => {
    const { rerender } = render(<PlaceProfilePanel organization={organization} language="en" />);
    rerender(<PlaceProfilePanel organization={organization} language="zh" />);
    expect(screen.getByRole('heading', { name: '認識這個場所' })).toBeTruthy();
    expect(screen.getByText(profile.introduction.zh)).toBeTruthy();
    expect(screen.getByText(profile.facts[0].description.zh)).toBeTruthy();
    expect(screen.getByText(/內部資料核對/)).toBeTruthy();
    expect(screen.getByRole('region', { name: '公開資料 · 登記資訊' })).toBeTruthy();
  });

  it('uses the explicit unprofiled notice without an empty sources section or leaking previous claims', () => {
    const { rerender } = render(<PlaceProfilePanel organization={organization} language="en" />);
    vi.mocked(getPlaceProfile).mockReturnValue(undefined);
    rerender(<PlaceProfilePanel organization={{ ...organization, id: 'unprofiled', name: '另一場所' }} language="en" />);
    expect(screen.getByText('No verified cultural profile is currently available for this location. You can still explore the general cultural scene.')).toBeTruthy();
    expect(screen.queryByText(profile.introduction.en)).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Sources' })).toBeNull();
    expect(screen.getByText('另一場所')).toBeTruthy();
    rerender(<PlaceProfilePanel organization={organization} language="zh" />);
    expect(screen.getByText('此場所目前尚無經查證的文化介紹，仍可探索一般宗教文化示意場景。')).toBeTruthy();
  });
});
