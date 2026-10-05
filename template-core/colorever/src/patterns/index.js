import catLevel from './cat.json';
import houseLevel from './house.json';
import {decorate as cat} from './cat.js';
import {decorate as house} from './house.js';
export const patterns={cat:{level:catLevel,decorate:cat},house:{level:houseLevel,decorate:house}};
