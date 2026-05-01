// backend/routes/testEmail.js
import express from 'express';
import { sendEmail } from '../utils/emailService.js';
const router = express.Router();

router.post('/test-email', async (req, res) => {
  try {
    const { to } = req.body;
    if (!to) return res.status(400).json({ message: 'Provide "to" in body' });
    const info = await sendEmail(to, 'Test email from NepMart', `<p>Test sent at ${new Date().toISOString()}</p>`);
    return res.json({ ok: true, info });
  } catch (err) {
    console.error('test-email failed', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
});

export default router;
