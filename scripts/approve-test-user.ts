import { db } from '../src/db'
import { organizationUsers } from '../src/db/schema'
import { eq } from 'drizzle-orm'

async function approveTestUser() {
  try {
    const result = await db.update(organizationUsers)
      .set({
        status: 'active',
        acceptedAt: new Date(),
      })
      .where(eq(organizationUsers.email, 'testuser+1761888082@example.com'))
      .returning()

    if (result.length > 0) {
      console.log('✅ Test user approved successfully!')
      console.log('Email:', result[0].email)
      console.log('Status:', result[0].status)
    } else {
      console.log('❌ No user found')
    }

    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

approveTestUser()
