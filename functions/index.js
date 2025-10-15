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

/* --------------------------- UTILITIES ---------------------------- */

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

function accountDeletedHtml({ name }) {
  return `
  <h2>Account Deleted ❌</h2>
  <p>Hello ${name || "Aspirant"}, your ${BRAND} account has been removed by the administrator.</p>
  <p>If you think this is a mistake, please contact support.</p>`;
}

async function sendMail({ to, subject, html }) {
  if (!GMAIL_USER || !GMAIL_PASS) {
    console.warn("⚠️ Gmail credentials missing; skipping email to", to);
    return;
  }
  const mail = { from: `${BRAND} <${GMAIL_USER}>`, to, subject, html };
  await transporter.sendMail(mail);
}

/* --------------------------- OTP FUNCTIONS ---------------------------- */

// 1️⃣ Request OTP
exports.requestSignupOtpV1 = functions.https.onCall(async (data, context) => {
  const uid = data && data.uid;
  if (!context.auth || context.auth.uid !== uid) {
    throw new functions.https.HttpsError("permission-denied", "Not allowed.");
  }

  const userRef = db.collection("users").doc(uid);
  const snap = await userRef.get();

  let email = "",
    name = "";
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

  await userRef.set(
    {
      email,
      name,
      isVerified: false,
      otpCode: code,
      otpExpiry: expiresAt,
      shouldSendAccountCreatedAtNextLogin: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  await sendMail({
    to: email,
    subject: `${BRAND} – Your OTP`,
    html: otpHtml({ name, otp: code }),
  });

  return { ok: true };
});

// 2️⃣ Verify OTP
exports.verifySignupOtpV1 = functions.https.onCall(async (data, context) => {
  const uid = data && data.uid;
  const code = String((data && data.code) || "");

  if (!context.auth || context.auth.uid !== uid) {
    throw new functions.https.HttpsError("permission-denied", "Not allowed.");
  }
  if (!code || code.length !== 6) {
    throw new functions.https.HttpsError("invalid-argument", "Invalid OTP.");
  }

  const ref = db.collection("users").doc(uid);
  const snap = await ref.get();
  if (!snap.exists)
    throw new functions.https.HttpsError("not-found", "User doc missing.");

  const d = snap.data();
  if (!d.otpCode || !d.otpExpiry) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "No OTP requested."
    );
  }

  const now = admin.firestore.Timestamp.now();
  if (now.toMillis() > d.otpExpiry.toMillis()) {
    throw new functions.https.HttpsError("deadline-exceeded", "OTP expired.");
  }
  if (String(d.otpCode) !== code) {
    throw new functions.https.HttpsError("invalid-argument", "Incorrect OTP.");
  }

  await ref.set(
    {
      isVerified: true,
      otpCode: admin.firestore.FieldValue.delete(),
      otpExpiry: admin.firestore.FieldValue.delete(),
      verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  return { ok: true, verified: true };
});

/* --------------------------- LOGIN EMAIL ---------------------------- */

exports.sendLoginEmailV1 = functions.https.onCall(async (data, context) => {
  const uid = data && data.uid;
  if (!context.auth || context.auth.uid !== uid) {
    throw new functions.https.HttpsError("permission-denied", "Not allowed.");
  }

  const ref = db.collection("users").doc(uid);
  const snap = await ref.get();
  if (!snap.exists)
    throw new functions.https.HttpsError("not-found", "User doc missing.");

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

  const updates = {
    lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
  };
  if (isFirstLogin) {
    updates.firstLoginAt = admin.firestore.FieldValue.serverTimestamp();
    updates.shouldSendAccountCreatedAtNextLogin = false;
  }
  await ref.set(updates, { merge: true });

  return { ok: true };
});

/* --------------------------- DELETE USER ---------------------------- */

exports.deleteUserAccount = functions.https.onCall(async (data, context) => {
  if (context.auth?.uid !== "cEqNmVzP17Y1EUt6JCZTDNpw5W93") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only admin can delete users."
    );
  }

  const uid = data && data.uid;
  if (!uid)
    throw new functions.https.HttpsError("invalid-argument", "Missing user ID");

  try {
    const ref = db.collection("users").doc(uid);
    const snap = await ref.get();
    let email = "",
      name = "";
    if (snap.exists) {
      const d = snap.data();
      email = d.email || "";
      name = d.name || "";
    } else {
      const authUser = await admin.auth().getUser(uid);
      email = authUser.email || "";
      name = authUser.displayName || "";
    }

    await admin.auth().deleteUser(uid);
    await ref.delete();

    if (email) {
      await sendMail({
        to: email,
        subject: `${BRAND} – Account Deleted`,
        html: accountDeletedHtml({ name }),
      });
    }

    return { success: true, message: `User ${uid} deleted successfully.` };
  } catch (error) {
    console.error("Error deleting user:", error);
    throw new functions.https.HttpsError("unknown", error.message, error);
  }
});

/* --------------------------- REGISTRATION EMAIL TRIGGERS ---------------------------- */

// 5️⃣ Enrollment email when registered
exports.sendEnrollmentEmail = functions.firestore
  .document("registrations/{regId}")
  .onCreate(async (snap) => {
    const data = snap.data();
    if (!data) return null;

    const userEmail = data.email;
    const userName = data.name || "Aspirant";
    const roomTitle = data.title || "Study Room";
    const roomDate = data.date || "—";
    const roomTime = data.time || "—";

    const userHtml = `
      <div style="font-family:Arial,sans-serif; line-height:1.6; color:#222;">
        <h2>🎓 Registration Confirmed – ${roomTitle}</h2>
        <p>Hi ${userName},</p>
        <p>You have successfully registered for <b>${roomTitle}</b>.</p>
        <p><b>Date:</b> ${roomDate}<br/><b>Time:</b> ${roomTime}</p>
        <p>The meeting link will be active 5 minutes before the start time.</p>
        <hr/>
        <p style="font-size:13px;color:#888;">Regards,<br/>${BRAND} Team</p>
      </div>`;

    const adminHtml = `
      <div style="font-family:Arial,sans-serif; line-height:1.6; color:#222;">
        <h2>📢 New Study Room Registration</h2>
        <p><b>User:</b> ${userName}</p>
        <p><b>Email:</b> ${userEmail}</p>
        <p><b>Room:</b> ${roomTitle}</p>
        <p><b>Date:</b> ${roomDate}, <b>Time:</b> ${roomTime}</p>
        <hr/>
        <p style="font-size:13px;color:#888;">${BRAND} Admin Notification</p>
      </div>`;

    try {
      if (userEmail) {
        await sendMail({
          to: userEmail,
          subject: `${BRAND} – Registered for ${roomTitle}`,
          html: userHtml,
        });
      }

      await sendMail({
        to: "satyapath.upsc@gmail.com",
        subject: `${BRAND} – New Registration: ${roomTitle}`,
        html: adminHtml,
      });

      console.log("✅ Enrollment emails sent for:", roomTitle);
    } catch (err) {
      console.error("❌ Error sending enrollment email:", err);
    }

    return null;
  });

// 6️⃣ Unenroll email when registration is deleted
exports.sendUnenrollEmail = functions.firestore
  .document("registrations/{regId}")
  .onDelete(async (snap) => {
    const data = snap.data();
    if (!data) return null;

    const userEmail = data.email;
    const userName = data.name || "Aspirant";
    const roomTitle = data.title || "Study Room";

    const userHtml = `
      <div style="font-family:Arial,sans-serif; line-height:1.6; color:#222;">
        <h2>❎ Unenrolled from ${roomTitle}</h2>
        <p>Hi ${userName},</p>
        <p>You have successfully unenrolled from <b>${roomTitle}</b>.</p>
        <p>If this was a mistake, you can rejoin anytime before the session starts.</p>
        <hr/>
        <p style="font-size:13px;color:#888;">Regards,<br/>${BRAND} Team</p>
      </div>`;

    const adminHtml = `
      <div style="font-family:Arial,sans-serif; line-height:1.6; color:#222;">
        <h2>📤 User Unenrolled</h2>
        <p><b>User:</b> ${userName}</p>
        <p><b>Email:</b> ${userEmail}</p>
        <p><b>Room:</b> ${roomTitle}</p>
        <p>This user has unenrolled from the study room.</p>
        <hr/>
        <p style="font-size:13px;color:#888;">${BRAND} Admin Notification</p>
      </div>`;

    try {
      if (userEmail) {
        await sendMail({
          to: userEmail,
          subject: `${BRAND} – Unenrolled from ${roomTitle}`,
          html: userHtml,
        });
      }

      await sendMail({
        to: "satyapath.upsc@gmail.com",
        subject: `${BRAND} – User Unenrolled: ${roomTitle}`,
        html: adminHtml,
      });

      console.log("✅ Unenroll emails sent for:", roomTitle);
    } catch (err) {
      console.error("❌ Error sending unenroll email:", err);
    }

    return null;
  });
/* --------------------------- PLAN SYNC TRIGGER ---------------------------- */
// 🔹 Auto-assign roomsLeft, maxRooms, planStart, planExpiry when user created or plan changes
exports.syncRoomsWithPlan = functions.firestore
  .document("users/{uid}")
  .onWrite(async (change, ctx) => {
    try {
      const after = change.after.exists ? change.after.data() : null;
      const before = change.before.exists ? change.before.data() : null;
      if (!after) return null;

      const plan = (after.plan || "lakshya").toLowerCase();

      // 🔸 Define plan → room & duration mapping
      const PLAN_CONFIG = {
        lakshya: { maxRooms: 1, days: 0 },
        safalta: { maxRooms: 8, days: 30 },
        shikhar: { maxRooms: 20, days: 60 },
        samarpan: { maxRooms: 60, days: 90 },
      };

      const config = PLAN_CONFIG[plan] || PLAN_CONFIG.lakshya;
      const maxRooms = config.maxRooms;
      const durationDays = config.days;

      // 🔸 Detect conditions to resync
      const planChanged = before?.plan !== after.plan;
      const missingFields =
        after.roomsLeft === undefined ||
        after.maxRooms === undefined ||
        after.planStart === undefined ||
        after.planExpiry === undefined;

      // 🔸 Detect mismatch: plan != rooms capacity
      const planRoomsMismatch =
        after.maxRooms !== maxRooms || after.roomsLeft > maxRooms;

      // Skip only if nothing changed and no mismatch
      if (!planChanged && !missingFields && !planRoomsMismatch) return null;

      // 🔸 Calculate new expiry
      const now = new Date();
      const expiryDate =
        durationDays > 0
          ? new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000)
          : null;

      // 🔸 Preserve used rooms if applicable (avoid over-reset)
      let newRoomsLeft = after.roomsLeft;
      if (planChanged || newRoomsLeft > maxRooms || newRoomsLeft === undefined)
        newRoomsLeft = maxRooms;

      const updates = {
        maxRooms,
        roomsLeft: newRoomsLeft,
        planStart: admin.firestore.FieldValue.serverTimestamp(),
        planExpiry: expiryDate
          ? admin.firestore.Timestamp.fromDate(expiryDate)
          : null,
      };

      await change.after.ref.set(updates, { merge: true });

      console.log(
        `✅ Synced plan for ${ctx.params.uid}: ${plan.toUpperCase()} (${newRoomsLeft}/${maxRooms})`
      );
    } catch (err) {
      console.error("❌ syncRoomsWithPlan error:", err);
    }
    return null;
  });
