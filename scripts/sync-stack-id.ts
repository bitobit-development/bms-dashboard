import { db } from '../src/db'
import { organizationUsers } from '../src/db/schema'
import { eq } from 'drizzle-orm'

async function syncStackId() {
  const email = 'haim@bit2bit.co.za'
  const newStackUserId = process.argv[2]

  if (!newStackUserId) {
    console.error('❌ Error: Please provide the Stack User ID as an argument')
    console.log('\nUsage: pnpm user:sync-stack-id <stack-user-id>')
    console.log('Example: pnpm user:sync-stack-id 12345-abcde-67890')
    process.exit(1)
  }

  try {
    console.log('\n🔄 Syncing Stack User ID...')
    console.log('=========================\n')
    console.log('Email:', email)
    console.log('New Stack User ID:', newStackUserId)
    console.log('')

    const result = await db
      .update(organizationUsers)
      .set({
        stackUserId: newStackUserId,
      })
      .where(eq(organizationUsers.email, email))
      .returning()

    if (result.length === 0) {
      console.log('❌ No user found with email:', email)
      process.exit(1)
    }

    const user = result[0]
    console.log('✅ Stack User ID updated successfully!')
    console.log('\nUpdated user:')
    console.log('- Email:', user.email)
    console.log('- Stack User ID:', user.stackUserId)
    console.log('- Role:', user.role)
    console.log('- Status:', user.status)
    console.log('\n✨ You should now be able to access the management platform!')

    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

syncStackId()
