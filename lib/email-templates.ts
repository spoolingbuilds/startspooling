/**
 * Email templates for StartSpooling verification codes
 */

export interface EmailTemplate {
  text: string
  html: string
}

export interface ConfirmationEmailData {
  signupNumber: number
  totalSignups: number
  date: string
  timestamp: string
  completionPercentage: number
  crypticStatus: string
}

/**
 * Creates a verification code email template with both text and HTML versions
 * @param code - The 6-character verification code
 * @returns Object with both text and HTML versions
 */
export function verificationCodeTemplate(code: string): EmailTemplate {
  return {
    text: createPlainTextTemplate(code),
    html: createHtmlTemplate(code)
  }
}

/**
 * Creates plain text version of verification email
 */
function createPlainTextTemplate(code: string): string {
  return `your code: ${code}

expires: 15 minutes
attempts: 4

don't share this.
────────────────────

didn't request this? someone has your email.
change your password.`
}

/**
 * Creates HTML version of verification email
 * Minimal and mysterious design
 */
function createHtmlTemplate(code: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>your access code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #000000; font-family: Arial, sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #000000;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 600px; background-color: #000000;">
          
          <!-- Top Spacing -->
          <tr>
            <td style="height: 40px;"></td>
          </tr>
          
          <!-- Code Display -->
          <tr>
            <td align="center" style="padding: 0 0 30px 0;">
              <div style="background-color: #0a0a0a; border: 1px solid #333333; padding: 20px; display: inline-block;">
                <div style="font-family: monospace; font-size: 2.5rem; color: #00FFFF; letter-spacing: 0.3em; text-shadow: 0 0 20px rgba(0, 255, 255, 0.5); line-height: 1;">━━━━━━━━━━<br>&nbsp;&nbsp;${code}<br>━━━━━━━━━━</div>
              </div>
            </td>
          </tr>
          
          <!-- Expiration Info -->
          <tr>
            <td align="center" style="padding: 0 0 40px 0;">
              <div style="color: #999999; font-size: 0.9rem; line-height: 1.8;">
                expires in 15 minutes<br>
                4 attempts before lockout
              </div>
            </td>
          </tr>
          
          <!-- Security Warning -->
          <tr>
            <td align="center" style="padding: 0 0 60px 0;">
              <div style="color: #666666; font-size: 0.8rem;">
                don't share this.
              </div>
            </td>
          </tr>
          
          <!-- Separator and Footer -->
          <tr>
            <td align="center" style="padding: 0 0 20px 0;">
              <div style="border-top: 1px solid #222222; padding-top: 20px;">
                <div style="color: #444444; font-size: 0.75rem;">
                  didn't request this? someone has your email.<br>
                  change your password.
                </div>
              </div>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

/**
 * Creates a confirmation email template with both text and HTML versions
 * @param data - The confirmation email data
 * @returns Object with both text and HTML versions
 */
export function confirmationEmailTemplate(data: ConfirmationEmailData): EmailTemplate {
  const {
    signupNumber,
    date,
    timestamp,
    completionPercentage,
    crypticStatus,
  } = data

  // Calculate progress bar characters (20 characters total)
  const filledBars = Math.floor(completionPercentage / 5)
  const emptyBars = 20 - filledBars
  const progressBar = '█'.repeat(filledBars) + '░'.repeat(emptyBars)

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Archived</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Courier New', Courier, monospace; background-color: #000000; color: #ffffff;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #000000;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #000000;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center; border-top: 1px solid #333333; border-left: 1px solid #333333; border-right: 1px solid #333333;">
              <h1 style="margin: 0; font-size: 24px; font-weight: normal; letter-spacing: 2px; color: #00FFFF;">you're in.</h1>
            </td>
          </tr>
          
          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px; border-left: 1px solid #333333; border-right: 1px solid #333333;">
              <div style="border-top: 1px solid #333333; margin: 20px 0;"></div>
            </td>
          </tr>
          
          <!-- Body Text -->
          <tr>
            <td style="padding: 20px 40px; font-size: 14px; line-height: 1.8; border-left: 1px solid #333333; border-right: 1px solid #333333;">
              <p style="margin: 0 0 20px 0; color: #ffffff;">photobucket deleted everything in 2017.</p>
              <p style="margin: 0 0 20px 0; color: #ffffff;">forums went offline in 2019.</p>
              <p style="margin: 0 0 20px 0; color: #ffffff;">your instagram post has 6 likes.</p>
              <p style="margin: 40px 0 20px 0; text-align: center; font-size: 16px; color: #00FFFF;">we didn't forget.</p>
            </td>
          </tr>
          
          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px; border-left: 1px solid #333333; border-right: 1px solid #333333;">
              <div style="border-top: 1px solid #333333; margin: 20px 0;"></div>
            </td>
          </tr>
          
          <!-- Status Box -->
          <tr>
            <td style="padding: 30px 40px; background-color: #0a0a0a; border-left: 1px solid #333333; border-right: 1px solid #333333;">
              <table width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="padding: 5px 0; font-size: 13px; color: #888888;">signup:</td>
                  <td style="padding: 5px 0; font-size: 13px; text-align: right; color: #00FFFF;">#${signupNumber.toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; font-size: 13px; color: #888888;">archived:</td>
                  <td style="padding: 5px 0; font-size: 13px; text-align: right; color: #ffffff;">${date}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; font-size: 13px; color: #888888;">status:</td>
                  <td style="padding: 5px 0; font-size: 13px; text-align: right; color: #ffffff;">${crypticStatus}</td>
                </tr>
                <tr>
                  <td style="padding: 5px 0; font-size: 13px; color: #888888;">completion:</td>
                  <td style="padding: 5px 0; font-size: 13px; text-align: right; color: #00FFFF;">${completionPercentage}%</td>
                </tr>
              </table>
              <div style="margin-top: 20px; background-color: #1a1a1a; height: 4px; border-radius: 2px; overflow: hidden;">
                <div style="width: ${completionPercentage}%; height: 4px; background-color: #00FFFF;"></div>
              </div>
            </td>
          </tr>
          
          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px; border-left: 1px solid #333333; border-right: 1px solid #333333;">
              <div style="border-top: 1px solid #333333; margin: 0;"></div>
            </td>
          </tr>
          
          <!-- CTA Text -->
          <tr>
            <td style="padding: 30px 40px; font-size: 14px; line-height: 1.8; border-left: 1px solid #333333; border-right: 1px solid #333333;">
              <p style="margin: 0 0 15px 0; color: #ffffff;">things change when you're not looking.</p>
              <p style="margin: 0 0 15px 0; color: #ffffff;">check startspooling.com periodically.</p>
              <p style="margin: 0 0 15px 0; color: #888888;">the earlier you check, the more you see.</p>
              <p style="margin: 0; color: #00FFFF;">some things only appear once.</p>
            </td>
          </tr>
          
          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px; border-left: 1px solid #333333; border-right: 1px solid #333333;">
              <div style="border-top: 1px solid #333333; margin: 20px 0;"></div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px 40px 40px; text-align: center; font-size: 16px; border-bottom: 1px solid #333333; border-left: 1px solid #333333; border-right: 1px solid #333333;">
              <p style="margin: 0 0 20px 0; color: #00FFFF;">see you soon.</p>
              <a href="https://startspooling.com?utm_source=confirmation_email&utm_medium=email&utm_campaign=waitlist" style="color: #ffffff; text-decoration: none; font-size: 14px;">startspooling.com</a>
            </td>
          </tr>
          
          <!-- Timestamp -->
          <tr>
            <td style="padding: 20px 40px; text-align: center; font-size: 11px; color: #444444;">${timestamp}</td>
          </tr>
          
          <!-- Unsubscribe -->
          <tr>
            <td style="padding: 20px 40px 40px 40px; text-align: center; font-size: 10px; color: #333333;">
              <a href="https://startspooling.com/unsubscribe" style="color: #333333; text-decoration: none;">forget everything</a>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()

  const text = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

you're in.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

photobucket deleted everything in 2017.
forums went offline in 2019.
your instagram post has 6 likes.

we didn't forget.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

signup: #${signupNumber.toLocaleString()}
archived: ${date}
status: ${crypticStatus}
completion: ${completionPercentage}%

Progress: ${progressBar} ${completionPercentage}%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

things change when you're not looking.

check startspooling.com periodically.
the earlier you check, the more you see.
some things only appear once.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

see you soon.

https://startspooling.com?utm_source=confirmation_email&utm_medium=email&utm_campaign=waitlist

${timestamp}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

To unsubscribe: https://startspooling.com/unsubscribe
  `.trim()

  return { html, text }
}

