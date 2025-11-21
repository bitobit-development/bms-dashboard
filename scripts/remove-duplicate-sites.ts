import { db } from '../src/db';
import { sites } from '../src/db/schema/sites';
import { networkTelemetry, networkDailyAggregates, networkMonthlyAggregates } from '../src/db/schema/network-telemetry';
import { eq, inArray, sql } from 'drizzle-orm';

const DUPLICATE_SITE_IDS = [137, 138, 139, 140, 122, 118, 109, 104, 102, 80, 79, 69, 67, 62];

async function removeDuplicateSites() {
  console.log('Removing duplicate sites:', DUPLICATE_SITE_IDS);
  console.log('---');

  // Delete from network_telemetry
  const telemetryResult = await db.delete(networkTelemetry)
    .where(inArray(networkTelemetry.siteId, DUPLICATE_SITE_IDS))
    .returning({ id: networkTelemetry.id });
  console.log(`Deleted ${telemetryResult.length} records from network_telemetry`);

  // Delete from network_daily_aggregates
  const dailyResult = await db.delete(networkDailyAggregates)
    .where(inArray(networkDailyAggregates.siteId, DUPLICATE_SITE_IDS))
    .returning({ id: networkDailyAggregates.id });
  console.log(`Deleted ${dailyResult.length} records from network_daily_aggregates`);

  // Delete from network_monthly_aggregates
  const monthlyResult = await db.delete(networkMonthlyAggregates)
    .where(inArray(networkMonthlyAggregates.siteId, DUPLICATE_SITE_IDS))
    .returning({ id: networkMonthlyAggregates.id });
  console.log(`Deleted ${monthlyResult.length} records from network_monthly_aggregates`);

  // Delete from sites table
  const sitesResult = await db.delete(sites)
    .where(inArray(sites.id, DUPLICATE_SITE_IDS))
    .returning({ id: sites.id, name: sites.name });
  console.log(`Deleted ${sitesResult.length} sites from sites table:`);
  sitesResult.forEach(s => console.log(`  - ${s.id}: ${s.name}`));

  // Get remaining sites count
  const remaining = await db.select({ count: sql<number>`count(*)` }).from(sites);
  console.log('---');
  console.log(`Remaining sites: ${remaining[0].count}`);

  // Get all remaining sites for the list
  const allSites = await db.select({ id: sites.id, name: sites.name, location: sites.location })
    .from(sites)
    .orderBy(sites.name);

  console.log('\n--- REMAINING SITES ---');
  allSites.forEach((s, i) => console.log(`${i + 1}. ${s.name} - ${s.location || 'N/A'}`));

  process.exit(0);
}

removeDuplicateSites().catch(e => {
  console.error(e);
  process.exit(1);
});
