import { db } from '../src/db'
import { organizationUsers, organizations } from '../src/db/schema'
import { eq } from 'drizzle-orm'

async function approveAdmin() {
  try {
    // Ensure organization exists
    let org = await db.query.organizations.findFirst()

    if (!org) {
      console.log('Creating default organization...')
      const [newOrg] = await db.insert(organizations).values({
        name: 'Default Organization',
        slug: 'default',
        settings: {},
      }).returning()
      org = newOrg
    }

    console.log('Organization:', org.name)

    // Update admin user
    const result = await db.update(organizationUsers)
      .set({
        status: 'active',
        role: 'admin',
        acceptedAt: new Date(),
      })
      .where(eq(organizationUsers.email, 'haim@bit2bit.co.za'))
      .returning()

    if (result.length > 0) {
      console.log('✅ Admin approved successfully!')
      console.log('Email:', result[0].email)
      console.log('Role:', result[0].role)
      console.log('Status:', result[0].status)
    } else {
      console.log('❌ No user found with email haim@bit2bit.co.za')
      console.log('Creating user entry...')

      // Need to get Stack user ID - this would normally be done during sign-up
      console.log('⚠️  User needs to be created via the sign-up flow first')
    }

    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

approveAdmin()
