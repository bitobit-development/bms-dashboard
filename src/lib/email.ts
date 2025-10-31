/**
 * Email notification utility
 *
 * This is a placeholder implementation that logs emails to console.
 * To enable actual email sending, integrate with:
 * - Resend (https://resend.com) - Recommended for Next.js
 * - SendGrid
 * - AWS SES
 * - Postmark
 *
 * Environment variables needed:
 * - EMAIL_FROM: Sender email address
 * - EMAIL_API_KEY: API key for email service
 * - ADMIN_EMAILS: Comma-separated list of admin emails
 */

interface EmailOptions {
  to: string | string[]
  subject: string
  html?: string
  text?: string
}

/**
 * Send an email notification
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    const { to, subject, html, text } = options
    const recipients = Array.isArray(to) ? to : [to]

    // TODO: Replace with actual email service implementation
    // Example with Resend:
    //
    // import { Resend } from 'resend'
    // const resend = new Resend(process.env.EMAIL_API_KEY)
    //
    // const { data, error } = await resend.emails.send({
    //   from: process.env.EMAIL_FROM || 'noreply@example.com',
    //   to: recipients,
    //   subject,
    //   html,
    //   text,
    // })
    //
    // if (error) {
    //   throw error
    // }

    // For now, log to console
    console.log('📧 Email would be sent:')
    console.log(`  To: ${recipients.join(', ')}`)
    console.log(`  Subject: ${subject}`)
    console.log(`  Content: ${text || html}`)

    return { success: true }
  } catch (error) {
    console.error('Failed to send email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email'
    }
  }
}

/**
 * Notify admins about a new user signup
 */
export async function notifyAdminsNewUser(userEmail: string, userName?: string) {
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || []

  if (adminEmails.length === 0) {
    console.warn('No admin emails configured. Set ADMIN_EMAILS environment variable.')
    return { success: false, error: 'No admin emails configured' }
  }

  const subject = 'New User Signup - Pending Approval'
  const html = `
    <h2>New User Registration</h2>
    <p>A new user has signed up and is pending approval:</p>
    <ul>
      <li><strong>Name:</strong> ${userName || 'N/A'}</li>
      <li><strong>Email:</strong> ${userEmail}</li>
      <li><strong>Status:</strong> Pending</li>
    </ul>
    <p>Please log in to the admin panel to approve or reject this user.</p>
    <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/management/users/pending">View Pending Users</a></p>
  `

  const text = `
New User Registration

A new user has signed up and is pending approval:
- Name: ${userName || 'N/A'}
- Email: ${userEmail}
- Status: Pending

Please log in to the admin panel to approve or reject this user.
View pending users: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/management/users/pending
  `.trim()

  return sendEmail({
    to: adminEmails,
    subject,
    html,
    text,
  })
}

/**
 * Notify user that their account has been approved
 */
export async function notifyUserApproved(userEmail: string, userName?: string) {
  const subject = 'Your Account Has Been Approved'
  const html = `
    <h2>Welcome to BMS Dashboard!</h2>
    <p>Hi ${userName || 'there'},</p>
    <p>Great news! Your account has been approved and you now have full access to the BMS Dashboard.</p>
    <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard">Access Dashboard</a></p>
    <p>If you have any questions, please don't hesitate to reach out to our support team.</p>
  `

  const text = `
Welcome to BMS Dashboard!

Hi ${userName || 'there'},

Great news! Your account has been approved and you now have full access to the BMS Dashboard.

Access Dashboard: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard

If you have any questions, please don't hesitate to reach out to our support team.
  `.trim()

  return sendEmail({
    to: userEmail,
    subject,
    html,
    text,
  })
}

/**
 * Notify user that their account has been rejected
 */
export async function notifyUserRejected(userEmail: string, userName?: string) {
  const subject = 'Account Registration Update'
  const html = `
    <h2>Account Registration Update</h2>
    <p>Hi ${userName || 'there'},</p>
    <p>Thank you for your interest in the BMS Dashboard. Unfortunately, we are unable to approve your account at this time.</p>
    <p>If you believe this is an error or would like to discuss further, please contact our support team.</p>
  `

  const text = `
Account Registration Update

Hi ${userName || 'there'},

Thank you for your interest in the BMS Dashboard. Unfortunately, we are unable to approve your account at this time.

If you believe this is an error or would like to discuss further, please contact our support team.
  `.trim()

  return sendEmail({
    to: userEmail,
    subject,
    html,
    text,
  })
}
