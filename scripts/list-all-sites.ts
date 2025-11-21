import { db } from '../src/db';
import { sites } from '../src/db/schema';
import { asc } from 'drizzle-orm';

async function main() {
  const allSites = await db.select({ name: sites.name, city: sites.city, state: sites.state }).from(sites).orderBy(asc(sites.name));
  allSites.forEach((s, i) => console.log(`${i+1}. ${s.name} - ${s.city}, ${s.state}`));
  process.exit(0);
}
main();
