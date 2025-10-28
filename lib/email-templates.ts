/**
 * Email templates for StartSpooling verification codes
 */

export interface EmailTemplate {
  text: string
  html: string
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

