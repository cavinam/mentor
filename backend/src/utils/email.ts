import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "office.g-tim.co.id",
  port: 587,
  secure: false, // use TLS
  auth: {
    user: "notification@g-tim.co.id",
    pass: "Gt1mnot1f",
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export async function sendEmail(to: string, subject: string, html: string) {
  const mailOptions = {
    from: '"Meeting & Visitor Information" <notification@g-tim.co.id>',
    to,
    subject,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent: " + info.response);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}
