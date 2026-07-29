const nodemailer = require('nodemailer');

//creating email transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
};
// send welcome email
const sendWelcomeEmail = async (email, name, plan) => {
  try {
    const transporter = createTransporter();
    const mailOptions = {
      from: `"Your SaaS" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Welcome to Your Subscription!',
      html: `
                <h1>Welcome to Your SaaS!</h1>
                <p>Hi ${name},</p>
                <p>Thank you for subscribing to our <strong>${plan}</strong> plan!</p>
                <p>You now have full access to all features.</p>
                <p>If you have any questions, feel free to reply to this email.</p>
                <p>Thanks,<br>Your SaaS Team</p>
            `,
    };
const info = await transporter.sendMail(mailOptions);    console.log(`Welcome email sent to: ${email}`);
    return info;
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
}
//send paiment faile email
const sendPaymentFailedEmail = async (email, name, portalUrl) => {
  try {
    const transporter = createTransporter();
    const mailOptions = {
      from: `"Your SaaS" <${process.env.SMTP_USER}>`,
      to: email,
      subject: '⚠️ Payment Failed - Update Your Card',
      html: `
                <h1>Payment Failed</h1>
                <p>Hi ${name},</p>
                <p>We were unable to process your recent payment for your subscription.</p>
                <p>To keep your account active, please update your payment method:</p>
                <a href="${portalUrl}" style="background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
                    Update Payment Method
                </a>
                <p>If you have any questions, please contact us.</p>
                <p>Thanks,<br>Your SaaS Team</p>
            `,
    };
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Payment failed email sent to: ${email}`);
    return info;
  } catch (error) {
    console.error('Error sending payment failed email:', error);
    throw error;
  }
};
//send cancellation email

const sendCancellationEmail = async (email, name) => {
  try {
    const transporter = createTransporter();
    const mailOptions = {
      from: `"Your SaaS" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'We\'re Sorry to See You Go',
      html: `
                <h1>Your Subscription Has Been Canceled</h1>
                <p>Hi ${name},</p>
                <p>Your subscription has been canceled as requested.</p>
                <p>You will still have access until the end of your current billing period.</p>
                <p>We hope to see you again soon!</p>
                <p>Thanks,<br>Your SaaS Team</p>
            `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Cancellation email sent to: ${email}`);
    return info;

  } catch (error) {
    console.error('Error sending cancellation email:', error);
    throw error;
  }
}

module.exports = {
  sendPaymentFailedEmail,
  sendWelcomeEmail,
  sendCancellationEmail
};