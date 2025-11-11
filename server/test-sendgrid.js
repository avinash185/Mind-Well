require('dotenv').config();
const { sendCounselingRequest } = require('./utils/mailer');

(async () => {
  try {
    const toEmail = process.env.TEST_TO_EMAIL || process.env.MAIL_FROM;
    if (!process.env.SENDGRID_API_KEY) {
      console.error('Missing SENDGRID_API_KEY in .env');
      process.exit(1);
    }
    if (!toEmail) {
      console.error('Set TEST_TO_EMAIL or MAIL_FROM in .env to run this test');
      process.exit(1);
    }

    console.log('Sending test email via SendGrid...');
    const result = await sendCounselingRequest({
      counselorEmail: toEmail,
      counselorName: 'Counselor Test',
      userName: 'Test User',
      userEmail: 'test.user@example.com',
      reason: 'Debugging SendGrid delivery',
      preferredTime: '4-5 PM',
    });

    // @sendgrid/mail returns an HTTP response object when successful
    if (result.success && result.raw) {
      const resp = result.raw;
      console.log('SendGrid response:', {
        statusCode: resp.statusCode,
        headers: resp.headers,
      });
    }
    console.log('Test result:', result);
  } catch (err) {
    const details = err?.response?.body || err?.message || String(err);
    console.error('Test send error:', details);
    process.exit(1);
  }
})();