const nodemailer = require('nodemailer');
const ics = require('ics');
require('dotenv').config({ path: '../.env' });

// Create a test account when the service starts
let transporter;

async function initTransporter() {
  try {
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      // Use real Gmail account if credentials are provided in .env
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
      console.log("Gmail Email Transporter Initialized.");
    } else {
      // Fallback to Ethereal test account if no credentials are provided
      let testAccount = await nodemailer.createTestAccount();

      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: testAccount.user, // generated ethereal user
          pass: testAccount.pass, // generated ethereal password
        },
      });
      console.log("Ethereal Test Email Transporter Initialized.");
    }
  } catch (error) {
    console.error("Failed to initialize Email Transporter:", error);
  }
}

// Initialize immediately
initTransporter();

/**
 * Sends an appointment calendar invite email
 * @param {Object} user 
 * @param {Object} doctor 
 * @param {Object} appointment 
 */
async function sendAppointmentCalendarInvite(user, doctor, appointment) {
  if (!transporter) {
    console.error("Transporter is not initialized yet.");
    return;
  }

  // Parse date and time to create the ICS event array
  // Assuming appointment.date is "YYYY-MM-DD" and appointment.time is "HH:mm"
  const [year, month, day] = appointment.date.split('-').map(Number);
  const [hour, minute] = appointment.time.split(':').map(Number);
  
  // Create duration object (assuming 30 minutes if not specified)
  const durationMinutes = appointment.duration || 30;

  const event = {
    start: [year, month, day, hour, minute],
    duration: { minutes: durationMinutes },
    title: `Medical Appointment with ${doctor.name}`,
    description: `Appointment reason: ${appointment.reason || 'General checkup'}\nNotes: ${appointment.notes || 'None'}`,
    location: doctor.hospital || 'Medical Center',
    url: 'http://localhost:5173', // Assuming frontend URL
    status: 'CONFIRMED',
    busyStatus: 'BUSY',
    organizer: { name: doctor.name, email: doctor.email || 'doctor@mediconnect.local' },
    attendees: [
      { name: user.name, email: user.email || user.username + '@mediconnect.local', rsvp: true, partstat: 'ACCEPTED', role: 'REQ-PARTICIPANT' }
    ],
    alarms: [
      {
        action: 'display',
        description: 'Reminder: Medical Appointment in 1 hour',
        trigger: { hours: 1, minutes: 0, before: true }
      }
    ]
  };

  ics.createEvent(event, async (error, value) => {
    if (error) {
      console.error("Error generating ICS file:", error);
      return;
    }

    try {
      const recipientEmail = user.email || 'test-user@ethereal.email';
      
      // Send mail with defined transport object
      let info = await transporter.sendMail({
        from: `"${process.env.EMAIL_FROM_NAME || 'MediConnect System'}" <${process.env.EMAIL_USER || 'noreply@mediconnect.local'}>`,
        to: recipientEmail,
        subject: `Appointment Confirmation: ${doctor.name}`,
        text: `Hello ${user.name},\n\nYour appointment with ${doctor.name} is confirmed for ${appointment.date} at ${appointment.time}.\n\nPlease find the attached calendar invitation.\n\nThank you,\nMediConnect Team`,
        html: `<p>Hello <b>${user.name}</b>,</p>
               <p>Your appointment with <b>${doctor.name}</b> is confirmed for <b>${appointment.date}</b> at <b>${appointment.time}</b>.</p>
               <p>Please find the attached calendar invitation. It includes a 1-hour reminder.</p>
               <br/>
               <p>Thank you,<br/>MediConnect Team</p>`,
        alternatives: [{
          contentType: 'text/calendar; charset="utf-8"; method=REQUEST',
          content: value.toString() // Send the exact ICS string as alternative part for Calendar apps
        }],
        attachments: [
          {
            filename: 'invite.ics',
            content: value.toString(),
            contentType: 'text/calendar'
          }
        ]
      });

      console.log("Message sent successfully: %s", info.messageId);
      if (!process.env.EMAIL_USER) {
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
      }
    } catch (err) {
      console.error("Failed to send calendar invite email:", err);
    }
  });
}

module.exports = {
  sendAppointmentCalendarInvite
};
