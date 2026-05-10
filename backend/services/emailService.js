const nodemailer = require('nodemailer');

const buildTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const emailBaseTemplate = (title, bodyHtml) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f0f12; color: #e2e8f0; margin: 0; padding: 0; }
    .wrapper { max-width: 560px; margin: 40px auto; background: #1a1a2e; border-radius: 16px; overflow: hidden; border: 1px solid #2d2d4e; }
    .header { background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 32px 40px; }
    .logo { font-size: 22px; font-weight: 800; color: #fff; letter-spacing: -0.5px; }
    .logo span { color: #a5b4fc; }
    .content { padding: 36px 40px; }
    h1 { font-size: 20px; color: #f1f5f9; margin: 0 0 12px; }
    p { color: #94a3b8; line-height: 1.7; margin: 0 0 16px; font-size: 15px; }
    .btn { display: inline-block; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #fff !important; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 600; font-size: 15px; margin: 8px 0 24px; }
    .footer { padding: 20px 40px; border-top: 1px solid #2d2d4e; text-align: center; color: #475569; font-size: 13px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo">Sprint<span>Forge</span></div>
    </div>
    <div class="content">
      <h1>${title}</h1>
      ${bodyHtml}
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} SprintForge · You received this because your email is registered with us.
    </div>
  </div>
</body>
</html>
`;

const dispatchVerificationEmail = async (recipientEmail, recipientName, verificationLink) => {
  const transporter = buildTransporter();
  const htmlBody = `
    <p>Hey ${recipientName},</p>
    <p>Welcome to <strong>SprintForge</strong>! Verify your email address to activate your account and start collaborating with your team.</p>
    <a class="btn" href="${verificationLink}">Verify Email Address</a>
    <p>This link expires in <strong>24 hours</strong>. If you didn't create an account, you can safely ignore this email.</p>
  `;
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: recipientEmail,
    subject: 'Verify your SprintForge account',
    html: emailBaseTemplate('Verify Your Email', htmlBody),
  });
};

const dispatchPasswordResetEmail = async (recipientEmail, recipientName, resetLink) => {
  const transporter = buildTransporter();
  const htmlBody = `
    <p>Hey ${recipientName},</p>
    <p>We received a request to reset your SprintForge password. Click the button below to set a new password.</p>
    <a class="btn" href="${resetLink}">Reset My Password</a>
    <p>This link expires in <strong>1 hour</strong>. If you didn't request this, please disregard this email — your account is safe.</p>
  `;
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: recipientEmail,
    subject: 'SprintForge — Password Reset Request',
    html: emailBaseTemplate('Reset Your Password', htmlBody),
  });
};

const dispatchProjectInviteEmail = async (recipientEmail, inviterName, projectName, inviteLink) => {
  const transporter = buildTransporter();
  const htmlBody = `
    <p><strong>${inviterName}</strong> has invited you to join the project <strong>"${projectName}"</strong> on SprintForge.</p>
    <a class="btn" href="${inviteLink}">Accept Invitation</a>
    <p>If you believe this was sent in error, you can ignore this email.</p>
  `;
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: recipientEmail,
    subject: `${inviterName} invited you to "${projectName}" on SprintForge`,
    html: emailBaseTemplate('Project Invitation', htmlBody),
  });
};

module.exports = {
  dispatchVerificationEmail,
  dispatchPasswordResetEmail,
  dispatchProjectInviteEmail,
};
