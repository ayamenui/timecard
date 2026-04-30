export type Role = '会長' | '副会長' | '部長' | '役員' | '役員補佐';

export const ROLES: Role[] = ['会長', '副会長', '部長', '役員', '役員補佐'];

export type Bureau = '総務局' | 'クラブ局' | '行事局';

export const BUREAUS: Bureau[] = ['総務局', 'クラブ局', '行事局'];

export const OTHER_DEPARTMENT = 'その他';

export const BUREAU_DEPARTMENTS: Record<Bureau, string[]> = {
  総務局: ['会計部', '技術部', '渉外部'],
  クラブ局: [],
  行事局: ['運営部', '企画部', '飲食部', '広報部'],
};

export const GRADES = ['1年', '2年', '3年', '4年', '5年'] as const;
export type Grade = (typeof GRADES)[number];

export const CLASSES = ['CS', 'EE', 'ME', 'AD'] as const;

export interface Member {
  id: number;
  name: string;
  furigana?: string;
  grade?: Grade;
  classroom?: string;
  role: Role;
  bureau?: string;
  department?: string;
}

export interface MemberInput {
  name: string;
  furigana?: string;
  grade?: Grade | '';
  classroom?: string;
  role: Role;
  bureau?: string;
  department?: string;
}

export interface PunchRecord {
  id: number;
  memberId: number;
  inAt: number;
  outAt: number | null;
  autoClosed?: boolean;
}

export interface AppState {
  members: Member[];
  records: PunchRecord[];
  nextId: number;
}

export type TabKey = 'punch' | 'members' | 'history' | 'summary';
