import { Resend } from 'resend'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const resend = new Resend(process.env.RESEND_API_KEY)

// Rate limiting store (in-memory, resets on deployment)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Validation schema
const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  company: z.string().max(200).optional(),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000),
  referral: z.string().max(200).optional(),
  honeypot: z.string().optional(), // Anti-spam honeypot field
})

// Rate limiting configuration
const RATE_LIMIT_MAX = 3 // Max submissions per window
const RATE_LIMIT_WINDOW = 60 * 60 * 1000 // 1 hour in milliseconds

/**
 * Check rate limit for IP address
 */
function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const record = rateLimitStore.get(ip)

  // Clean up expired entries
  if (record && now > record.resetTime) {
    rateLimitStore.delete(ip)
  }

  const current = rateLimitStore.get(ip)

  if (!current) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW })
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1 }
  }

  if (current.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0 }
  }

  current.count++
  return { allowed: true, remaining: RATE_LIMIT_MAX - current.count }
}

/**
 * Get client IP address
 */
function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  return forwarded?.split(',')[0] || realIP || 'unknown'
}

/**
 * Spam detection patterns
 */
function containsSpam(text: string): boolean {
  const spamPatterns = [
    /\b(viagra|cialis|casino|lottery|prize)\b/i,
    /\b(click here|buy now|limited time)\b/i,
    /(http|https):\/\/[^\s]+\.(ru|cn|tk)/i, // Suspicious TLDs
    /\b\d{10,}\b/, // Long number sequences
  ]

  return spamPatterns.some((pattern) => pattern.test(text))
}

/**
 * POST /api/contact
 * Handle contact form submissions with anti-spam protection
 */
export async function POST(request: Request) {
  try {
    // Get client IP for rate limiting
    const clientIP = getClientIP(request)

    // Check rate limit
    const rateLimit = checkRateLimit(clientIP)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Too many requests',
          message: 'You have exceeded the maximum number of submissions. Please try again later.',
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': RATE_LIMIT_MAX.toString(),
            'X-RateLimit-Remaining': '0',
          },
        },
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = contactSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: validationResult.error.issues[0].message,
        },
        { status: 400 },
      )
    }

    const { name, email, company, message, referral, honeypot } = validationResult.data

    // Honeypot check (bots fill this hidden field)
    if (honeypot) {
      console.log('[SPAM BLOCKED] Honeypot triggered:', { email, ip: clientIP })
      // Return success to not alert the bot
      return NextResponse.json({ success: true })
    }

    // Spam content detection
    if (containsSpam(message) || containsSpam(name)) {
      console.log('[SPAM BLOCKED] Spam pattern detected:', { email, ip: clientIP })
      return NextResponse.json(
        {
          error: 'Invalid content',
          message: 'Your message contains prohibited content.',
        },
        { status: 400 },
      )
    }

    // Get email configuration from environment variables
    const toEmail = process.env.CONTACT_FORM_TO_EMAIL
    const fromEmail = process.env.CONTACT_FORM_FROM_EMAIL || 'onboarding@resend.dev'
    const fromName = process.env.CONTACT_FORM_FROM_NAME || 'Contact Form'
    const ccEmails = process.env.CONTACT_FORM_CC_EMAILS?.split(',').map((e) => e.trim())

    if (!toEmail) {
      console.error('[CONFIG ERROR] CONTACT_FORM_TO_EMAIL not set')
      return NextResponse.json(
        {
          error: 'Configuration error',
          message: 'Contact form is not properly configured.',
        },
        { status: 500 },
      )
    }

    // Prepare email content
    const emailSubject = `New Contact Form Submission from ${name}`
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
            .field { margin-bottom: 15px; }
            .label { font-weight: bold; color: #555; }
            .value { margin-top: 5px; padding: 10px; background: white; border-radius: 4px; }
            .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #777; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>New Contact Form Submission</h2>
            </div>
            <div class="content">
              <div class="field">
                <div class="label">Name:</div>
                <div class="value">${name}</div>
              </div>
              <div class="field">
                <div class="label">Email:</div>
                <div class="value"><a href="mailto:${email}">${email}</a></div>
              </div>
              ${
                company
                  ? `
              <div class="field">
                <div class="label">Company/Website:</div>
                <div class="value">${company}</div>
              </div>
              `
                  : ''
              }
              <div class="field">
                <div class="label">Message:</div>
                <div class="value">${message.replace(/\n/g, '<br>')}</div>
              </div>
              ${
                referral
                  ? `
              <div class="field">
                <div class="label">How did they hear about you:</div>
                <div class="value">${referral}</div>
              </div>
              `
                  : ''
              }
              <div class="footer">
                <p>Submitted from: ${clientIP}</p>
                <p>Timestamp: ${new Date().toLocaleString()}</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `

    const emailText = `
New Contact Form Submission

Name: ${name}
Email: ${email}
${company ? `Company/Website: ${company}` : ''}

Message:
${message}

${referral ? `How did they hear about you: ${referral}` : ''}

---
Submitted from: ${clientIP}
Timestamp: ${new Date().toLocaleString()}
    `

    // Send email via Resend
    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: toEmail,
      cc: ccEmails,
      replyTo: email,
      subject: emailSubject,
      html: emailHtml,
      text: emailText,
    })

    if (error) {
      console.error('[RESEND ERROR]', error)
      return NextResponse.json(
        {
          error: 'Failed to send email',
          message: 'An error occurred while sending your message. Please try again later.',
        },
        { status: 500 },
      )
    }

    console.log('[EMAIL SENT]', { id: data?.id, to: toEmail, from: email })

    return NextResponse.json(
      {
        success: true,
        message: 'Your message has been sent successfully!',
      },
      {
        headers: {
          'X-RateLimit-Limit': RATE_LIMIT_MAX.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        },
      },
    )
  } catch (error) {
    console.error('[CONTACT API ERROR]', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'An unexpected error occurred. Please try again later.',
      },
      { status: 500 },
    )
  }
}
