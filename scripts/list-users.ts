import { db } from '../src/db'
import { organizationUsers } from '../src/db/schema'

async function listUsers() {
  try {
    const users = await db.select().from(organizationUsers)

    console.log('\n📋 All Users in Database:')
    console.log('========================\n')

    if (users.length === 0) {
      console.log('❌ No users found in database')
    } else {
      users.forEach(user => {
        const statusIcon = user.status === 'active' ? '✅' :
                          user.status === 'pending' ? '⏳' :
                          user.status === 'inactive' ? '❌' : '⚠️'
        console.log(`${statusIcon} ${user.email}`)
        console.log(`   Stack User ID: ${user.stackUserId}`)
        console.log(`   Status: ${user.status}`)
        console.log(`   Role: ${user.role}`)
        console.log(`   Organization: ${user.organizationId}`)
        console.log(`   Created: ${user.createdAt}`)
        console.log(`   Accepted: ${user.acceptedAt || 'Not yet'}`)
        console.log('')
      })

      const pendingCount = users.filter(u => u.status === 'pending').length
      const activeCount = users.filter(u => u.status === 'active').length

      console.log('Summary:')
      console.log(`- Total users: ${users.length}`)
      console.log(`- Active: ${activeCount}`)
      console.log(`- Pending: ${pendingCount}`)
    }

    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

listUsers()
