// backend/api/auth/authController.js
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../../models/User.js';
import Otp from '../../models/Otp.js';
import PasswordResetToken from '../../models/PasswordResetToken.js';
import { sendEmail } from '../../utils/emailService.js';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const SALT_ROUNDS = Number(process.env.SALT_ROUNDS) || 10;

function signToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// --------------------------------------------------------------------------
// REGISTER (Create account + Send OTP + Token link)
// --------------------------------------------------------------------------
export async function register(req, res) {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    // Check existing user
    const existingEmail = await User.findOne({ email });
    if (existingEmail) return res.status(409).json({ message: "Email already registered" });

    // Check existing phone if provided
    if (phone) {
      const existingPhone = await User.findOne({ phone });
      if (existingPhone) return res.status(409).json({ message: "Phone number already registered" });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user (unverified)
    const user = new User({
      name,
      email,
      phone,
      password: hashed,
      isVerified: false
    });
    await user.save();

    // Generate 6-digit OTP and token for link verification
    const code = String(Math.floor(100000 + Math.random() * 900000)); // 6-digit
    const codeExpiresAt = new Date(Date.now() + 1000 * 60 * 15); // 15 minutes for code
    const token = crypto.randomBytes(24).toString('hex'); // token for link
    const tokenExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours for link

    // Remove any existing otp docs for this email/purpose then insert new
    await Otp.deleteMany({ email, purpose: 'verify-email' });
    await Otp.create({
      email,
      code,
      token,
      purpose: 'verify-email',
      expiresAt: tokenExpiresAt
    });

    // Build verification link to frontend
    const frontendBase = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verifyLink = `${frontendBase}/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

    const html = `
      <p>Hello <strong>${name}</strong>,</p>
      <p>Welcome to Dealmate — please verify your email address.</p>
      <p><strong>One-click verification</strong>: <a href="${verifyLink}">Verify my email</a></p>
      <p>Or enter this verification code in the app (valid 15 minutes):</p>
      <h2 style="letter-spacing:3px">${code}</h2>
      <p>If you didn't request this, ignore this email.</p>
    `;

    try {
      await sendEmail(email, "Verify your Dealmate account", html);
      console.log("OTP & link email sent to:", email);
    } catch (err) {
      console.error("Failed to send OTP email:", err);
      // Option: keep user created but warn client
      return res.status(500).json({
        message: "Account created but failed to send verification email. Please contact support."
      });
    }

    return res.status(201).json({ message: "Registered successfully. Verification email sent." });
  } catch (err) {
    console.error("register error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}

// --------------------------------------------------------------------------
// LOGIN
// --------------------------------------------------------------------------
export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

    // unify email/phone login
    const identifier = email; // frontend sends 'email' key but it can be phone

    const user = await User.findOne({
      $or: [{ email: identifier }, { phone: identifier }]
    });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return res.status(401).json({ message: "Invalid credentials" });

    if (!user.isVerified) {
      return res.status(403).json({
        message: "Email not verified. Please check your email for OTP or verification link."
      });
    }

    const token = signToken(user);

    return res.json({
      message: "Login successful",
      token,
      user: user.toJSON()
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
}

// --------------------------------------------------------------------------
// GOOGLE LOGIN
// --------------------------------------------------------------------------
import { OAuth2Client } from 'google-auth-library';
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function googleLogin(req, res) {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: "Token is required" });

    // Verify token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    const { email, name, picture } = payload;

    // Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
      // Create new user
      // We set a random password because they are using Google
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const hashed = await bcrypt.hash(randomPassword, SALT_ROUNDS);

      user = new User({
        name,
        email,
        password: hashed,
        isVerified: true, // Google verified
        avatar: picture
      });
      await user.save();
    } else {
      // Logic for existing user
      // If user exists but wasn't verified, we can mark them verified now since they logged in with Google?
      // Strict security might say no, but for many apps it's acceptable if email matches.
      if (!user.isVerified) {
        user.isVerified = true;
        await user.save();
      }
    }

    const jwtToken = signToken(user);

    return res.json({
      message: "Google login successful",
      token: jwtToken,
      user: user.toJSON()
    });

  } catch (err) {
    console.error("Google login error:", err);
    return res.status(500).json({ message: "Google login failed" });
  }
}
