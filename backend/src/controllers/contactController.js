import nodemailer from 'nodemailer';

export const sendContactEmail = async (req, res) => {
  const { name, email, subject, message } = req.body;

  // 1. Validation
  if (!name || !name.trim()) {
    return res.status(400).json({ success: false, message: 'Name is required' });
  }
  if (!email || !email.trim()) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }
  // Basic email regex validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
  }
  if (!subject || !subject.trim()) {
    return res.status(400).json({ success: false, message: 'Subject is required' });
  }
  if (!message || !message.trim()) {
    return res.status(400).json({ success: false, message: 'Message is required' });
  }

  // 2. SMTP Transporter Check
  const host = process.env.EMAIL_HOST;
  const port = process.env.EMAIL_PORT;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!host || !user || !pass) {
    const errorMsg = 'SMTP Server is not configured. Please define EMAIL_HOST, EMAIL_PORT, EMAIL_USER, and EMAIL_PASS in the backend .env file.';
    console.error(`[Contact Service Error] ${errorMsg}`);
    return res.status(500).json({
      success: false,
      message: errorMsg
    });
  }

  try {
    // Configure Transporter
    const transporter = nodemailer.createTransport({
      host: host,
      port: parseInt(port || '587', 10),
      secure: port === '465', // true for 465, false for other ports
      auth: {
        user: user,
        pass: pass
      },
      tls: {
        rejectUnauthorized: false // Avoid SSL handshake failures on some setups
      }
    });

    // Verify SMTP connection config
    await transporter.verify();

    // Prepare Mail Options
    const mailOptions = {
      from: `"${name} via The Save Tube" <${user}>`,
      to: 'harmipagada4@gmail.com', // Configured recipient
      replyTo: email,
      subject: `[The Save Tube Contact] ${subject}`,
      text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\nMessage:\n${message}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #14291B; border-bottom: 2px solid #61D07A; padding-bottom: 8px;">The Save Tube Contact Form</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <div style="background-color: #f7fafc; padding: 15px; border-radius: 6px; margin-top: 15px; border-left: 4px solid #61D07A;">
            <p style="margin: 0; white-space: pre-wrap;">${message}</p>
          </div>
          <hr style="border: none; border-top: 1px solid #edf2f7; margin-top: 20px;" />
          <p style="font-size: 12px; color: #718096; text-align: center;">This message was securely transmitted via The Save Tube server proxy.</p>
        </div>
      `
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Contact Service] Email successfully sent: ${info.messageId}`);

    return res.status(200).json({
      success: true,
      message: 'Email delivered successfully.'
    });

  } catch (error) {
    console.error('[Contact Service Error] Email delivery failed:', error);
    return res.status(500).json({
      success: false,
      message: `Email delivery failed: ${error.message || error}`
    });
  }
};
