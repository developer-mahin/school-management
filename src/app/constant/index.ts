export const USER_ROLE = {
  admin: 'admin',
  supperAdmin: 'supper-admin',
  school: 'school',
  teacher: 'teacher',
  parents: 'parents',
  student: 'student',
} as const;

export const USER_STATUS = {
  active: 'active',
  blocked: 'blocked',
} as const;

export const GENDER = {
  male: 'male',
  female: 'female',
  others: 'others',
} as const;
