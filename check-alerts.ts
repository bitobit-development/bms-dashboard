import { db } from '@/src/db'
import { alerts } from '@/src/db/schema'
import { eq, and, count } from 'drizzle-orm'

async function checkAlerts() {
  console.log('\n=== All Alerts ===')
  const allAlerts = await db.select().from(alerts)
  console.log('Total alerts in database:', allAlerts.length)

  if (allAlerts.length > 0) {
    console.log('\nAlert Details:')
    allAlerts.forEach(alert => {
      console.log('- ID:', alert.id, 'Severity:', alert.severity, 'Status:', alert.status, 'Title:', alert.title)
    })
  }

  console.log('\n=== Active Alerts by Severity ===')

  const criticalResult = await db
    .select({ count: count() })
    .from(alerts)
    .where(
      and(
        eq(alerts.severity, 'critical'),
        eq(alerts.status, 'active')
      )
    )

  const errorResult = await db
    .select({ count: count() })
    .from(alerts)
    .where(
      and(
        eq(alerts.severity, 'error'),
        eq(alerts.status, 'active')
      )
    )

  const warningResult = await db
    .select({ count: count() })
    .from(alerts)
    .where(
      and(
        eq(alerts.severity, 'warning'),
        eq(alerts.status, 'active')
      )
    )

  const critical = criticalResult[0]?.count || 0
  const error = errorResult[0]?.count || 0
  const warning = warningResult[0]?.count || 0

  console.log('Critical (active):', critical)
  console.log('Error (active):', error)
  console.log('Warning (active):', warning)
  console.log('Total active alerts:', Number(critical) + Number(error) + Number(warning))

  process.exit(0)
}

checkAlerts().catch(console.error)
