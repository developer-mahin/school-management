export const USER_ROLE = {
  admin: 'admin',
  supperAdmin: 'supperAdmin',
  school: 'school',
  manager: 'manager',
  teacher: 'teacher',
  parents: 'parents',
  student: 'student',
  schoolAdmin: 'schoolAdmin',
} as const;

export const USER_STATUS = {
  active: 'active',
  blocked: 'blocked',
} as const;

export const GENDER = {
  male: 'male',
  female: 'female',
  other: 'other',
} as const;
