const nodemailer = require('nodemailer');
let sendgrid = null;

// Optional SendGrid setup
try {
  if (process.env.SENDGRID_API_KEY) {
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    sendgrid = sgMail;
  }
} catch (e) {
  sendgrid = null;
}
// Brevo support removed

let transport;
// Fallback transport: log emails to console as JSON
transport = nodemailer.createTransport({ jsonTransport: true });

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function extractKeywords(text) {
  const t = String(text || '').toLowerCase();
  const tags = new Set();
  if (/(sad|down|low mood)/.test(t)) tags.add('sadness');
  if (/(stress|stressed|overwhelmed|pressure)/.test(t)) tags.add('stress');
  if (/(anxiety|anxious|worry|nervous)/.test(t)) tags.add('anxiety');
  if (/(depress|depressed|hopeless)/.test(t)) tags.add('depression');
  if (/(panic|panic attacks)/.test(t)) tags.add('panic');
  if (/(lonely|isolation|isolated)/.test(t)) tags.add('loneliness');
  if (/(sleep|insomnia|can\s*not\s*sleep|trouble\s*sleeping)/.test(t)) tags.add('sleep issues');
  if (/(anger|angry|irritable)/.test(t)) tags.add('anger');
  return Array.from(tags);
}

async function sendCounselingRequest({ counselorEmail, counselorName, userName, userEmail, reason, preferredTime }) {
  const fromAddress = process.env.MAIL_FROM || process.env.SMTP_USER || 'no-reply@example.com';
  const fromName = process.env.MAIL_FROM_NAME || 'Counseling Bot';
  const pref = preferredTime || '16:00-17:00';
  const subject = `Counseling Request • ${userName} • ${pref}`;
  let lastError = null;

  const text = `Dear ${counselorName},\n\n` +
    `You have a new counseling request:\n` +
    `• Name: ${userName}\n` +
    `• Email: ${userEmail}\n` +
    `• Preferred Time: ${pref}\n` +
    `• Reason: ${reason}\n\n` +
    `Reply to confirm the session.\n` +
    `— ${fromName}`;

  const keywords = extractKeywords(reason);
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Counseling Request</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif; color:#111; line-height:1.55;">
    <h2 style="margin:0 0 12px">New Counseling Request</h2>
    <p style="margin:0 0 12px">Dear ${escapeHtml(counselorName)},</p>
    <p style="margin:0 0 12px">You have a new counseling request with the following details:</p>
    <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%; max-width:640px; border-collapse:collapse;">
      <tr>
        <td style="padding:6px 0; width:180px; color:#555;">Name</td>
        <td style="padding:6px 0;">${escapeHtml(userName)}</td>
      </tr>
      <tr>
        <td style="padding:6px 0; width:180px; color:#555;">Email</td>
        <td style="padding:6px 0;">${escapeHtml(userEmail)}</td>
      </tr>
      <tr>
        <td style="padding:6px 0; width:180px; color:#555;">Preferred Time</td>
        <td style="padding:6px 0;">${escapeHtml(pref)}</td>
      </tr>
      ${keywords.length ? `
      <tr>
        <td style="padding:6px 0; width:180px; color:#555;">Reason Keywords</td>
        <td style="padding:6px 0;">${keywords.map(k => `<span style='display:inline-block;margin-right:6px;padding:2px 8px;border-radius:12px;background:#eef;border:1px solid #dde;'>${escapeHtml(k)}</span>`).join('')}</td>
      </tr>` : ''}
      <tr>
        <td style="padding:6px 0; width:180px; color:#555;">Reason Description</td>
        <td style="padding:6px 0;">${escapeHtml(reason)}</td>
      </tr>
    </table>
    <p style="margin:12px 0 0">You can reply directly to the user to confirm the session.</p>
    <p style="margin:16px 0 0">— ${escapeHtml(fromName)}</p>
  </body>
</html>`;

  // SendGrid is now the primary and only external provider
  if (sendgrid) {
    try {
      const msg = {
        to: { email: counselorEmail, name: counselorName },
        from: { email: fromAddress, name: fromName },
        subject,
        text,
        html,
        replyTo: { email: userEmail, name: userName },
      };
      const [resp] = await sendgrid.send(msg);
      const messageId = resp?.headers && (resp.headers['x-message-id'] || resp.headers['x-message-id']);
      return {
        success: true,
        provider: 'sendgrid',
        messageId: messageId || null,
        raw: resp,
        error: null,
      };
    } catch (err) {
      const details = err?.response?.body?.errors?.map(e => e?.message).join('; ') || err?.message || String(err);
      console.error('SendGrid send error:', details);
      lastError = details;
      // Fall through to JSON transport
    }
  }

  // If SendGrid is not configured or fails, use JSON transport to log email and avoid runtime errors
  try {
    const info = await transport.sendMail({
      from: { address: fromAddress, name: fromName },
      to: counselorEmail,
      subject,
      text,
      html,
      replyTo: { address: userEmail, name: userName },
    });
    return {
      success: false,
      provider: 'json',
      messageId: info?.messageId || null,
      raw: info,
      error: lastError || 'SendGrid not configured, logged to JSON',
    };
  } catch (jsonErr) {
    const errorMsg = jsonErr?.response || jsonErr?.message || String(jsonErr);
    return {
      success: false,
      provider: 'json',
      messageId: null,
      raw: jsonErr,
      error: errorMsg,
    };
  }
}

module.exports = { transport, sendCounselingRequest };