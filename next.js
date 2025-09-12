import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Resend } from 'resend';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

const resend = new Resend(process.env.RESEND_API_KEY);

app.use(cors());
app.use(express.json());

app.post('/api/send-otp', async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required' });
  }

  try {
   const result= await resend.emails.send({
      from: 'Acme <onboarding@nitconnect.icu>', // Replace with your verified email/domain
      to: email,
      subject: 'Your OTP Code for NIT Connect',
      html: `
        <div style="font-family: sans-serif; line-height: 1.5;">
          <h2>🔐 Your OTP is: <span style="color: #4F46E5;">${otp}</span></h2>
          <p>This code is valid for 5 minutes. Do not share it with anyone.</p>
        </div>
      `,
    });
    
  console.log('Resend result:', result);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[Resend Error]', err);
    return res.status(500).json({ error: 'Failed to send OTP email' });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
