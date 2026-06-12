export type ReligionType =
  | '道教'
  | '佛教'
  | '基督教'
  | '天主教'
  | '一貫道'
  | '回教'
  | '天德教'
  | '軒轅教'
  | '理教'
  | '巴哈伊教'
  | '天理教'
  | '其他'
  | '未分類';

export type ReligiousOrganization = {
  id: string;
  name: string;
  district: string;
  village?: string;
  religion: ReligionType;
  festivalDates: string[];
  phone?: string;
  address: string;
  originalX: number;
  originalY: number;
  longitude: number;
  latitude: number;
  source: string;
  isCoordinateOutlier?: boolean;
};

export type ReligiousSummary = {
  total: number;
  byReligion: Array<{
    religion: string;
    count: number;
  }>;
  byDistrict: Array<{
    district: string;
    count: number;
  }>;
  withFestivalDateCount: number;
  withoutFestivalDateCount: number;
};

export type Language = 'zh' | 'en';

export type FestivalFilter = 'all' | 'with';

export type Filters = {
  religion: '全部' | 'All' | ReligionType;
  district: string;
  village: string;
  hasFestivalDate: boolean;
  search: string;
};

export type NearbyResult = ReligiousOrganization & {
  distanceMeters: number;
};
