import { sendEmail } from "./email";
import { UserRole, BookingStatus } from "@prisma/client";

// Helper function to format full meeting details as HTML for email
export function formatMeetingDetailsHTML(meeting: any): string {
  const equipmentList = meeting.meetingEquipments
    ? meeting.meetingEquipments
        .map(
          (me: any) =>
            `<li>${me.equipment?.name || "Unknown"} (Qty: ${me.quantity})</li>`
        )
        .join("")
    : "<li>None</li>";

  return `
    <ul>
      <li><strong>Agenda:</strong> ${meeting.agenda || "-"}</li>
      <li><strong>GTIM Name:</strong> ${meeting.gtimName || "-"}</li>
      <li><strong>Visitor Name:</strong> ${meeting.visitorName || "-"}</li>
      <li><strong>Company Name:</strong> ${meeting.companyName || "-"}</li>
      <li><strong>Start Date & Time:</strong> ${
        meeting.startDate
          ? new Date(meeting.startDate).toLocaleDateString()
          : "-"
      } ${meeting.startTime || ""}</li>
      <li><strong>End Date & Time:</strong> ${
        meeting.endDate ? new Date(meeting.endDate).toLocaleDateString() : "-"
      } ${meeting.endTime || ""}</li>
      <li><strong>Meeting Room:</strong> ${
        meeting.meetingRoom?.name ||
        (meeting.isGenbaVisit ? "Genba Visit" : "-")
      }</li>
      <li><strong>Department:</strong> ${meeting.department?.name || "-"}</li>
      <li><strong>Equipment:</strong> <ul>${equipmentList}</ul></li>
      <li><strong>Request:</strong> ${meeting.request || "-"}</li>
      <li><strong>Status:</strong> ${meeting.overallStatus || "-"}</li>
    </ul>
  `;
}

// Send email for new meeting booking approval request
export async function sendNewMeetingApprovalEmail(
  meeting: any,
  approvers: any[]
): Promise<void> {
  for (const approver of approvers) {
    if (
      approver.role === UserRole.SECTION_HEAD ||
      approver.role === UserRole.HRGA_MANAGER
    ) {
      const subject = "New Meeting Booking Approval Needed";
      const html = `
            <p>Dear ${approver.fullName},</p>
            <p>A new meeting booking requires your approval.</p>
            <p>Meeting Details:</p>
            ${formatMeetingDetailsHTML(meeting)}
            <p>Please <a href="http://mentor.gtim.local:8080/approvals">log in to the system</a> to review and approve the booking.</p>
            <p>Thank you.</p>
          `;
      try {
        await sendEmail(approver.email, subject, html);
      } catch (error) {
        console.error("Failed to send approval email to", approver.email);
      }
    }
  }
}

// Send email for meeting update approval request
export async function sendMeetingUpdateApprovalEmail(
  updatedMeeting: any,
  existingMeeting: any,
  changedFields: string[],
  shouldResetToPending: boolean,
  isTimeOrRoomChanged: boolean,
  approvers: any[],
  userRole?: string
): Promise<void> {
  // Determine email content based on the type of update
  let subject = "Meeting Updated Notification";
  let updateType = "General update";

  if (shouldResetToPending) {
    subject = "Meeting Updated - Re-approval Required";
    updateType = isTimeOrRoomChanged
      ? "Time/Room Change"
      : "Status Reset Required";
  } else if (isTimeOrRoomChanged) {
    updateType = "Time or Room Modified";
  } else {
    updateType = "Meeting Details Updated";
  }

  for (const approver of approvers) {
    if (
      approver.role === UserRole.SECTION_HEAD ||
      approver.role === UserRole.HRGA_MANAGER ||
      approver.role === UserRole.ADMIN
    ) {
      const html = `
            <p>Dear ${approver.fullName},</p>
            <p>A meeting booking has been updated. Here are the details:</p>
            <p><strong>Meeting Information:</strong></p>
            <ul>
              <li><strong>Agenda:</strong> ${updatedMeeting.agenda}</li>
              <li><strong>Updated by:</strong> ${userRole} user</li>
              <li><strong>Previous Status:</strong> ${
                existingMeeting.overallStatus
              }</li>
              <li><strong>Current Status:</strong> ${
                updatedMeeting.overallStatus
              }</li>
              <li><strong>Update Type:</strong> ${updateType}</li>
              ${
                changedFields.length > 0
                  ? `<li><strong>Modified Fields:</strong> ${changedFields.join(
                      ", "
                    )}</li>`
                  : ""
              }
              ${
                shouldResetToPending
                  ? `<li><strong>Action Required:</strong> Please review and approve the updated booking</li>`
                  : ""
              }
            </ul>
            <p>Please <a href="http://mentor.gtim.local:8080/approvals">log in to the system</a> to review the updated booking.</p>
            <p>Thank you.</p>
          `;

      try {
        await sendEmail(approver.email, subject, html);
      } catch (error) {
        console.error(`❌ Failed to send email to ${approver.email}:`, error);
      }
    }
  }
}

// Send email for meeting rejection
export async function sendMeetingRejectionEmail(
  meeting: any,
  remark: string,
  approverName: string
): Promise<void> {
  const userEmail = meeting.user?.email;
  const userName = meeting.user?.fullName || "User";
  const adminApprovers = meeting.approvals
    .filter((a: any) => a.approver.role === UserRole.ADMIN)
    .map((a: any) => a.approver.email);

  const subject = "Meeting Rejected Notification";
  const html = `
          <p>Dear ${userName},</p>
          <p>Your meeting booking with agenda "${
            meeting.agenda
          }" has been rejected by ${approverName}.</p>
          <p><strong>Reason:</strong> ${
            remark || "No specific reason provided"
          }</p>
          <p>If you have any questions about this rejection, please contact your supervisor or the meeting approver.</p>
          <p>You can view your meetings at <a href="http://mentor.gtim.local:8080/manage">http://mentor.gtim.local:8080/manage</a>.</p>
          <p>Thank you.</p>
        `;

  try {
    if (userEmail) {
      await sendEmail(userEmail, subject, html);
    }
    // Send email to admins
    for (const adminEmail of adminApprovers) {
      await sendEmail(adminEmail, subject, html);
    }
  } catch (error) {
    console.error("Failed to send immediate rejection email:", error);
  }
}

// Send email for meeting approval
export async function sendMeetingApprovalEmail(meeting: any): Promise<void> {
  // Use email from user data as receiver
  const userEmail = meeting.user?.email;
  const userName = meeting.user?.fullName || "User";
  const adminApprovers = meeting.approvals
    .filter((a: any) => a.approver.role === UserRole.ADMIN)
    .map((a: any) => a.approver.email);

  const subject = "Meeting Approved Notification";
  const html = `
          <p>Dear ${userName},</p>
          <p>Your meeting booking with agenda "${meeting.agenda}" has been fully approved.</p>
          <p>You can view your approved meetings at <a href="http://mentor.gtim.local:8080/manage">http://mentor.gtim.local:8080/manage</a>.</p>
          <p>Thank you.</p>
        `;

  try {
    if (userEmail) {
      // Send email to user
      await sendEmail(userEmail, subject, html);
    }
    // Send email to admins
    for (const adminEmail of adminApprovers) {
      await sendEmail(adminEmail, subject, html);
    }
  } catch (error) {
    console.error("Failed to send final approval email:", error);
  }
}

// Send email for meeting cancellation
export async function sendMeetingCancellationEmail(
  meetingDetails: any,
  remark: string | undefined,
  userRole: string
): Promise<void> {
  const cancelerName = meetingDetails.user?.fullName || "Unknown User";

  let notificationRecipients;
  let subject;
  let html;

  // Different notification logic based on who is cancelling
  if (userRole === UserRole.USER) {
    // When USER cancels meeting → send to ADMIN, HRGA MANAGER, and SECTION HEAD
    notificationRecipients = await import("../utils/prisma").then(
      ({ default: prisma }) =>
        prisma.user.findMany({
          where: {
            OR: [
              { role: UserRole.HRGA_MANAGER },
              { role: UserRole.ADMIN },
              {
                role: UserRole.SECTION_HEAD,
                departmentId: meetingDetails.departmentId,
              },
            ],
          },
          select: { id: true, email: true, fullName: true, role: true },
        })
    );

    subject = "Meeting Cancellation Notification";
    html = `
            <p>Dear Team,</p>
            <p>A meeting has been cancelled by a user in the system.</p>
            <p><strong>Meeting Details:</strong></p>
            <ul>
              <li><strong>Agenda:</strong> ${meetingDetails.agenda}</li>
              <li><strong>Department:</strong> ${
                meetingDetails.department?.name
              }</li>
              <li><strong>Cancelled by:</strong> ${cancelerName} (User)</li>
              <li><strong>Cancellation Date:</strong> ${new Date().toLocaleDateString()}</li>
              ${remark ? `<li><strong>Reason:</strong> ${remark}</li>` : ""}
            </ul>
            <p>Please update your records accordingly. You can view all meetings at <a href="http://mentor.gtim.local:8080/manage">http://mentor.gtim.local:8080/manage</a>.</p>
            <p>Thank you.</p>
          `;
  } else if (userRole === UserRole.SECTION_HEAD) {
    // When SECTION HEAD cancels meeting → send to ADMIN, HRGA MANAGER, and the USER who created the meeting
    notificationRecipients = await import("../utils/prisma").then(
      ({ default: prisma }) =>
        prisma.user.findMany({
          where: {
            OR: [
              { role: UserRole.HRGA_MANAGER },
              { role: UserRole.ADMIN },
              { id: meetingDetails.userId }, // The user who created the meeting
            ],
          },
          select: { id: true, email: true, fullName: true, role: true },
        })
    );

    subject = "Meeting Cancellation Notification";
    html = `
            <p>Dear Team,</p>
            <p>A meeting has been cancelled by the Section Head in the system.</p>
            <p><strong>Meeting Details:</strong></p>
            <ul>
              <li><strong>Agenda:</strong> ${meetingDetails.agenda}</li>
              <li><strong>Department:</strong> ${
                meetingDetails.department?.name
              }</li>
              <li><strong>Cancelled by:</strong> ${cancelerName} (Section Head)</li>
              <li><strong>Cancellation Date:</strong> ${new Date().toLocaleDateString()}</li>
              ${remark ? `<li><strong>Reason:</strong> ${remark}</li>` : ""}
            </ul>
            <p>Please update your records accordingly. You can view all meetings at <a href="http://mentor.gtim.local:8080/manage">http://mentor.gtim.local:8080/manage</a>.</p>
            <p>Thank you.</p>
          `;
  } else {
    // For ADMIN or HRGA_MANAGER, use the original logic
    notificationRecipients = await import("../utils/prisma").then(
      ({ default: prisma }) =>
        prisma.user.findMany({
          where: {
            OR: [
              { role: UserRole.HRGA_MANAGER },
              { role: UserRole.ADMIN },
              {
                role: UserRole.SECTION_HEAD,
                departmentId: meetingDetails.departmentId,
              },
            ],
          },
          select: { id: true, email: true, fullName: true, role: true },
        })
    );

    subject = "Meeting Cancellation Notification";
    html = `
            <p>Dear Team,</p>
            <p>A meeting has been cancelled in the system.</p>
            <p><strong>Meeting Details:</strong></p>
            <ul>
              <li><strong>Agenda:</strong> ${meetingDetails.agenda}</li>
              <li><strong>Department:</strong> ${
                meetingDetails.department?.name
              }</li>
              <li><strong>Cancelled by:</strong> ${cancelerName}</li>
              <li><strong>Cancellation Date:</strong> ${new Date().toLocaleDateString()}</li>
              ${remark ? `<li><strong>Reason:</strong> ${remark}</li>` : ""}
            </ul>
            <p>Please update your records accordingly. You can view all meetings at <a href="http://mentor.gtim.local:8080/manage">http://mentor.gtim.local:8080/manage</a>.</p>
            <p>Thank you.</p>
          `;
  }

  // Send email to all recipients
  for (const recipient of notificationRecipients) {
    try {
      await sendEmail(recipient.email, subject, html);
    } catch (emailError) {
      console.error(
        "Failed to send cancellation email to",
        recipient.email,
        emailError
      );
    }
  }
}
