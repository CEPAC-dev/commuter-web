import type { RelatedPassenger } from '@/types/user';

export const mockRelatedPassengers: RelatedPassenger[] = [
  {
    id:       'rp-001',
    name:     'Mohamed Ashour',
    phone:    '01012345678',
    age:      22,
    gender:   'male',
    relation: 'Son',
  },
  {
    id:       'rp-002',
    name:     'Sara Ashour',
    phone:    '01098765432',
    age:      19,
    gender:   'female',
    relation: 'Daughter',
  },
];
