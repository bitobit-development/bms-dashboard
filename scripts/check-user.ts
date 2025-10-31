import { db } from '../src/db'
import { organizationUsers } from '../src/db/schema'
import { eq } from 'drizzle-orm'

async function checkUser() {
  try {
    const users = await db
      .select()
      .from(organizationUsers)
      .where(eq(organizationUsers.email, 'haim@bit2bit.co.za'))

    console.log('\n📋 User Information:')
    console.log('===================\n')

    if (users.length === 0) {
      console.log('❌ No user found with email: haim@bit2bit.co.za')
      console.log('\n💡 Solution: Sign up first, then run: pnpm user:approve-admin')
    } else {
      const user = users[0]
      console.log('✅ User found!')
      console.log('Email:', user.email)
      console.log('Stack User ID:', user.stackUserId)
      console.log('Role:', user.role)
      console.log('Status:', user.status)
      console.log('Organization ID:', user.organizationId)
      console.log('Created:', user.createdAt)
      console.log('Accepted:', user.acceptedAt)
    }

    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

checkUser()
