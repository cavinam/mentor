import nodemailer from 'nodemailer';
import { config } from '../config/env';
import { prisma } from '../config/database';
import {
    MeetingEmailData,
    meetingCreatedTemplate,
    sectionHeadApprovedTemplate,
    hrgaApprovedTemplate,
    meetingCanceledTemplate,
    meetingRejectedTemplate,
} from '../utils/email.templates';

// Type alias for user roles
type UserRoleType = 'ADMIN' | 'SECTION_HEAD' | 'HRGA_MANAGER' | 'USER';

// Debug: Log SMTP configuration (without password)
console.log('📧 SMTP Configuration:');
console.log('   Host:', config.smtp.host);
console.log('   Port:', config.smtp.port);
console.log('   User:', config.smtp.user);
console.log('   Pass:', config.smtp.pass ? '***configured***' : '⚠️ NOT SET');

// Create nodemailer transporter
const transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: config.smtp.user && config.smtp.pass ? {
        user: config.smtp.user,
        pass: config.smtp.pass,
    } : undefined,
    tls: {
        rejectUnauthorized: false, // For self-signed certificates
    },
    connectionTimeout: 10000, // 10 seconds timeout
    greetingTimeout: 10000,
});

// Helper function to send email
async function sendEmail(to: string | string[], subject: string, html: string): Promise<boolean> {
    try {
        const recipients = Array.isArray(to) ? to.join(', ') : to;

        const info = await transporter.sendMail({
            from: `"${config.smtp.fromName}" <${config.smtp.fromEmail}>`,
            to: recipients,
            subject,
            html,
        });

        console.log(`✉️ Email sent successfully to ${recipients}: ${info.messageId}`);
        return true;
    } catch (error) {
        console.error('❌ Error sending email:', error);
        return false;
    }
}

// Helper function to get meeting email data
async function getMeetingEmailData(meetingId: string): Promise<MeetingEmailData | null> {
    const meeting = await prisma.meeting.findUnique({
        where: { id: meetingId },
        include: {
            user: true,
            meetingRoom: true,
            department: true,
        },
    });

    if (!meeting) return null;

    return {
        meetingId: meeting.id,
        agenda: meeting.agenda,
        gtimName: meeting.gtimName,
        visitorName: meeting.visitorName,
        companyName: meeting.companyName,
        startDate: meeting.startDate.toISOString().split('T')[0],
        endDate: meeting.endDate.toISOString().split('T')[0],
        startTime: meeting.startTime,
        endTime: meeting.endTime,
        meetingRoom: meeting.meetingRoom?.name || null,
        isGenbaVisit: meeting.isGenbaVisit,
        creatorName: meeting.user.fullName,
        creatorEmail: meeting.user.email,
        departmentName: meeting.department.name,
        request: meeting.request,
    };
}

// Helper to get role display name
function getRoleDisplayName(role: UserRoleType): string {
    switch (role) {
        case 'SECTION_HEAD':
            return 'Section Head';
        case 'HRGA_MANAGER':
            return 'HRGA Manager';
        case 'ADMIN':
            return 'Admin';
        default:
            return 'User';
    }
}

export const emailService = {
    /**
     * Send email notification when a meeting is created
     * Recipients: Section Head or HRGA Manager (for HRGA/Expatriate departments)
     */
    sendMeetingCreatedNotification: async (meetingId: string): Promise<void> => {
        console.log('\n📧 [EMAIL] Sending Meeting Created Notification...');
        console.log('   Meeting ID:', meetingId);
        try {
            const meetingData = await getMeetingEmailData(meetingId);
            if (!meetingData) {
                console.error('❌ Meeting not found for email notification:', meetingId);
                return;
            }
            console.log('   Agenda:', meetingData.agenda);

            // Get meeting to find department
            const meeting = await prisma.meeting.findUnique({
                where: { id: meetingId },
                include: {
                    department: { select: { name: true } }
                },
            });

            if (!meeting) return;

            // Check if department goes directly to HRGA Manager (HRGA or Expatriate)
            const deptName = meeting.department.name.toUpperCase();
            const isDirectToHRGA = deptName === 'HRGA' || deptName === 'EXPATRIATE';

            if (isDirectToHRGA) {
                // Send directly to HRGA Manager approvers
                const hrgaApprovers = await prisma.departmentApprover.findMany({
                    where: {
                        departmentId: meeting.departmentId,
                        approverRole: 'HRGA_MANAGER',
                    },
                    include: {
                        user: {
                            select: { email: true, fullName: true },
                        },
                    },
                });

                console.log('   📤 Sending directly to HRGA Manager (HRGA/Expatriate dept)');
                for (const approver of hrgaApprovers) {
                    console.log(`   → Sending to HRGA Manager: ${approver.user.fullName} <${approver.user.email}>`);
                    const html = meetingCreatedTemplate(meetingData, approver.user.fullName);
                    await sendEmail(
                        approver.user.email,
                        `[Approval Diperlukan] Permintaan Meeting Baru: ${meetingData.agenda}`,
                        html
                    );
                }
            } else {
                // Send to Section Head approvers
                const sectionHeadApprovers = await prisma.departmentApprover.findMany({
                    where: {
                        departmentId: meeting.departmentId,
                        approverRole: 'SECTION_HEAD',
                    },
                    include: {
                        user: {
                            select: { email: true, fullName: true },
                        },
                    },
                });

                console.log('   📤 Sending to Section Head approvers');
                for (const approver of sectionHeadApprovers) {
                    console.log(`   → Sending to Section Head: ${approver.user.fullName} <${approver.user.email}>`);
                    const html = meetingCreatedTemplate(meetingData, approver.user.fullName);
                    await sendEmail(
                        approver.user.email,
                        `[Approval Diperlukan] Permintaan Meeting Baru: ${meetingData.agenda}`,
                        html
                    );
                }
                console.log('✅ [EMAIL] Meeting Created Notification sent successfully');
            }
        } catch (error) {
            console.error('Error sending meeting created notification:', error);
        }
    },

    /**
     * Send email notification when Section Head approves
     * Recipients: HRGA Manager approvers for the department
     */
    sendSectionHeadApprovedNotification: async (
        meetingId: string,
        approverName: string
    ): Promise<void> => {
        console.log('\n📧 [EMAIL] Sending Section Head Approved Notification...');
        console.log('   Meeting ID:', meetingId);
        console.log('   Approved by:', approverName);
        try {
            const meetingData = await getMeetingEmailData(meetingId);
            if (!meetingData) return;
            console.log('   Agenda:', meetingData.agenda);

            // Get meeting to find department
            const meeting = await prisma.meeting.findUnique({
                where: { id: meetingId },
                select: { departmentId: true },
            });

            if (!meeting) return;

            // Get HRGA Manager approvers for this department
            const hrgaApprovers = await prisma.departmentApprover.findMany({
                where: {
                    departmentId: meeting.departmentId,
                    approverRole: 'HRGA_MANAGER',
                },
                include: {
                    user: {
                        select: { email: true, fullName: true },
                    },
                },
            });

            // Send email to each HRGA Manager
            console.log('   📤 Sending to HRGA Manager approvers');
            for (const approver of hrgaApprovers) {
                console.log(`   → Sending to HRGA Manager: ${approver.user.fullName} <${approver.user.email}>`);
                const html = sectionHeadApprovedTemplate(meetingData, approver.user.fullName, approverName);
                await sendEmail(
                    approver.user.email,
                    `[Approval Diperlukan] Meeting Disetujui Section Head: ${meetingData.agenda}`,
                    html
                );
            }
            console.log('✅ [EMAIL] Section Head Approved Notification sent successfully');
        } catch (error) {
            console.error('Error sending section head approved notification:', error);
        }
    },

    /**
     * Send email notification when HRGA Manager approves (meeting fully approved)
     * Recipients: The meeting creator only
     */
    sendHRGAApprovedNotification: async (meetingId: string): Promise<void> => {
        console.log('\n📧 [EMAIL] Sending HRGA Approved Notification...');
        console.log('   Meeting ID:', meetingId);
        try {
            const meetingData = await getMeetingEmailData(meetingId);
            if (!meetingData) return;
            console.log('   Agenda:', meetingData.agenda);

            // Get the meeting creator
            const meeting = await prisma.meeting.findUnique({
                where: { id: meetingId },
                include: {
                    user: {
                        select: { email: true, fullName: true },
                    },
                },
            });

            if (!meeting) return;

            // Send email to creator only
            console.log(`   📤 Sending to Creator: ${meeting.user.fullName} <${meeting.user.email}>`);
            const creatorHtml = hrgaApprovedTemplate(meetingData, meeting.user.fullName);
            await sendEmail(
                meeting.user.email,
                `[Disetujui] Meeting Anda Telah Disetujui: ${meetingData.agenda}`,
                creatorHtml
            );
            console.log('✅ [EMAIL] HRGA Approved Notification sent successfully');
        } catch (error) {
            console.error('Error sending HRGA approved notification:', error);
        }
    },

    /**
     * Send email notification when user cancels a meeting
     * Recipients: Section Head or HRGA Manager (for HRGA/Expatriate departments)
     */
    sendMeetingCanceledNotification: async (
        meetingId: string,
        cancelRemark?: string
    ): Promise<void> => {
        console.log('\n📧 [EMAIL] Sending Meeting Canceled Notification...');
        console.log('   Meeting ID:', meetingId);
        if (cancelRemark) console.log('   Cancel Remark:', cancelRemark);
        try {
            const meetingData = await getMeetingEmailData(meetingId);
            if (!meetingData) return;
            console.log('   Agenda:', meetingData.agenda);

            // Get meeting to find department
            const meeting = await prisma.meeting.findUnique({
                where: { id: meetingId },
                include: {
                    department: { select: { name: true } }
                },
            });

            if (!meeting) return;

            // Check if department goes directly to HRGA Manager (HRGA or Expatriate)
            const deptName = meeting.department.name.toUpperCase();
            const isDirectToHRGA = deptName === 'HRGA' || deptName === 'EXPATRIATE';

            const approverRole = isDirectToHRGA ? 'HRGA_MANAGER' : 'SECTION_HEAD';

            // Get appropriate approvers for this department
            const approvers = await prisma.departmentApprover.findMany({
                where: {
                    departmentId: meeting.departmentId,
                    approverRole: approverRole,
                },
                include: {
                    user: {
                        select: { email: true, fullName: true },
                    },
                },
            });

            // Send email to each approver
            console.log(`   📤 Sending to ${approverRole} approvers`);
            for (const approver of approvers) {
                console.log(`   → Sending to ${approverRole}: ${approver.user.fullName} <${approver.user.email}>`);
                const html = meetingCanceledTemplate(meetingData, approver.user.fullName, cancelRemark);
                await sendEmail(
                    approver.user.email,
                    `[Dibatalkan] Meeting Dibatalkan: ${meetingData.agenda}`,
                    html
                );
            }
            console.log('✅ [EMAIL] Meeting Canceled Notification sent successfully');
        } catch (error) {
            console.error('Error sending meeting canceled notification:', error);
        }
    },

    /**
     * Send email notification when a meeting is rejected
     * Recipients: The meeting creator
     */
    sendMeetingRejectedNotification: async (
        meetingId: string,
        rejectorId: string,
        rejectorRole: UserRoleType,
        remark?: string
    ): Promise<void> => {
        console.log('\n📧 [EMAIL] Sending Meeting Rejected Notification...');
        console.log('   Meeting ID:', meetingId);
        console.log('   Rejected by:', rejectorId, `(${rejectorRole})`);
        if (remark) console.log('   Remark:', remark);
        try {
            const meetingData = await getMeetingEmailData(meetingId);
            if (!meetingData) return;
            console.log('   Agenda:', meetingData.agenda);

            // Get the rejector info
            const rejector = await prisma.user.findUnique({
                where: { id: rejectorId },
                select: { fullName: true },
            });

            // Get the meeting creator
            const meeting = await prisma.meeting.findUnique({
                where: { id: meetingId },
                include: {
                    user: {
                        select: { email: true, fullName: true },
                    },
                },
            });

            if (!meeting || !rejector) return;

            const html = meetingRejectedTemplate(
                meetingData,
                meeting.user.fullName,
                rejector.fullName,
                getRoleDisplayName(rejectorRole),
                remark
            );

            console.log(`   📤 Sending rejection notice to Creator: ${meeting.user.fullName} <${meeting.user.email}>`);
            await sendEmail(
                meeting.user.email,
                `[Ditolak] Permintaan Meeting Ditolak: ${meetingData.agenda}`,
                html
            );
            console.log('✅ [EMAIL] Meeting Rejected Notification sent successfully');
        } catch (error) {
            console.error('Error sending meeting rejected notification:', error);
        }
    },

    /**
     * Verify email connection
     */
    verifyConnection: async (): Promise<boolean> => {
        try {
            await transporter.verify();
            console.log('✅ Email server connection verified');
            return true;
        } catch (error) {
            console.error('❌ Email server connection failed:', error);
            return false;
        }
    },
};
