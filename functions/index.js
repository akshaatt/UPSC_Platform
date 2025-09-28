/* functions/index.js */
const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();
const db = admin.firestore();

const GMAIL_USER = functions.config().gmail && functions.config().gmail.email;
const GMAIL_PASS = functions.config().gmail && functions.config().gmail.password;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: GMAIL_USER, pass: GMAIL_PASS },
});

const BRAND = "Satyapath";

function sixDigitOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function otpHtml({ name, otp }) {
  return `
  <div style="font-family:Arial,sans-serif; line-height:1.6;">
    <h2>Welcome to ${BRAND} 🎓</h2>
    <p>Use the OTP below to verify your account:</p>
    <div style="font-size:24px; font-weight:700; letter-spacing:3px; margin:12px 0;">${otp}</div>
    <p><b>Valid for 15 minutes.</b> Do not share this code.</p>
  </div>`;
}

function accountCreatedHtml({ name }) {
  return `
  <h2>Account Created 🎉</h2>
  <p>Hello ${name || "Aspirant"}, your ${BRAND} account is ready!</p>`;
}

function loginHtml({ name, when }) {
  return `
  <h2>Login Successful ✅</h2>
  <p>Hello ${name || "Aspirant"}, we noticed a login on <b>${when}</b>.</p>`;
}

async function sendMail({ to, subject, html }) {
  const mail = { from: `${BRAND} <${GMAIL_USER}>`, to, subject, html };
  await transporter.sendMail(mail);
}

// ---------------- FUNCTIONS ----------------

// 1) Request OTP
exports.requestSignupOtpV1 = functions.https.onCall(async (data, context) => {
  const uid = data && data.uid;
  if (!context.auth || context.auth.uid !== uid) {
    throw new functions.https.HttpsError("permission-denied", "Not allowed.");
  }

  const userRef = db.collection("users").doc(uid);
  const snap = await userRef.get();

  let email = "", name = "";
  if (snap.exists) {
    const d = snap.data();
    email = d.email;
    name = d.name || d.displayName || "";
  } else {
    const authUser = await admin.auth().getUser(uid);
    email = authUser.email;
    name = authUser.displayName || "";
  }

  const code = sixDigitOtp();
  const expiresAt = admin.firestore.Timestamp.fromDate(
    new Date(Date.now() + 15 * 60 * 1000)
  );

  await userRef.set({
    email,
    name,
    isVerified: false,
    otpCode: code,
    otpExpiry: expiresAt,
    shouldSendAccountCreatedAtNextLogin: true,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  await sendMail({
    to: email,
    subject: `${BRAND} – Your OTP`,
    html: otpHtml({ name, otp: code }),
  });

  return { ok: true };
});

// 2) Verify OTP
exports.verifySignupOtpV1 = functions.https.onCall(async (data, context) => {
  const uid = data && data.uid;
  const code = String(data && data.code || "");

  if (!context.auth || context.auth.uid !== uid) {
    throw new functions.https.HttpsError("permission-denied", "Not allowed.");
  }
  if (!code || code.length !== 6) {
    throw new functions.https.HttpsError("invalid-argument", "Invalid OTP.");
  }

  const ref = db.collection("users").doc(uid);
  const snap = await ref.get();
  if (!snap.exists) throw new functions.https.HttpsError("not-found", "User doc missing.");

  const d = snap.data();
  if (!d.otpCode || !d.otpExpiry) {
    throw new functions.https.HttpsError("failed-precondition", "No OTP requested.");
  }

  const now = admin.firestore.Timestamp.now();
  if (now.toMillis() > d.otpExpiry.toMillis()) {
    throw new functions.https.HttpsError("deadline-exceeded", "OTP expired.");
  }
  if (String(d.otpCode) !== code) {
    throw new functions.https.HttpsError("invalid-argument", "Incorrect OTP.");
  }

  // ✅ Mark verified
  await ref.set({
    isVerified: true,
    otpCode: admin.firestore.FieldValue.delete(),
    otpExpiry: admin.firestore.FieldValue.delete(),
    verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  return { ok: true, verified: true };
});

// 3) Send login email
exports.sendLoginEmailV1 = functions.https.onCall(async (data, context) => {
  const uid = data && data.uid;
  if (!context.auth || context.auth.uid !== uid) {
    throw new functions.https.HttpsError("permission-denied", "Not allowed.");
  }

  const ref = db.collection("users").doc(uid);
  const snap = await ref.get();
  if (!snap.exists) throw new functions.https.HttpsError("not-found", "User doc missing.");

  const d = snap.data();
  const email = d.email;
  const name = d.name || "";

  const when = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour12: true,
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const isFirstLogin = !d.firstLoginAt && d.isVerified;

  if (isFirstLogin && d.shouldSendAccountCreatedAtNextLogin) {
    await sendMail({
      to: email,
      subject: `${BRAND} – Account Created 🎉`,
      html: accountCreatedHtml({ name }),
    });
  }

  await sendMail({
    to: email,
    subject: `${BRAND} – Login Successful`,
    html: loginHtml({ name, when }),
  });

  const updates = { lastLoginAt: admin.firestore.FieldValue.serverTimestamp() };
  if (isFirstLogin) {
    updates.firstLoginAt = admin.firestore.FieldValue.serverTimestamp();
    updates.shouldSendAccountCreatedAtNextLogin = false;
  }
  await ref.set(updates, { merge: true });

  return { ok: true };
});
