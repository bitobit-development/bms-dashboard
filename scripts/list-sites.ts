import { db } from '../src/db';
import { sql } from 'drizzle-orm';

async function main() {
  const result: any[] = await db.execute(sql`SELECT id, name, city FROM sites ORDER BY name`);
  console.log('| # | Site Name | Location |');
  console.log('|---|-----------|----------|');
  result.forEach((s: any, i: number) => {
    console.log(`| ${i + 1} | ${s.name} | ${s.city || 'N/A'} |`);
  });
  console.log(`\nTotal: ${result.length} sites`);
  process.exit(0);
}
main();
