import { DB } from '../infrastructure/db';
export class User { save() { new DB().save(); } }
