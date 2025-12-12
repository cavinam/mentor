// Email templates for meeting notifications
import { config } from '../config/env';

export interface MeetingEmailData {
  meetingId: string;
  agenda: string;
  gtimName?: string | null;
  visitorName?: string | null;
  companyName?: string | null;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  meetingRoom?: string | null;
  isGenbaVisit: boolean;
  creatorName: string;
  creatorEmail: string;
  departmentName: string;
  request?: string | null;
  remark?: string | null;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function getMeetingDetailsTable(data: MeetingEmailData): string {
  return `
    <table cellpadding="0" cellspacing="0" style="width: 100%; border-collapse: collapse; margin: 12px 0;">
      <tr>
        <td style="padding: 8px 12px; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569; width: 110px; font-size: 13px;">Agenda</td>
        <td style="padding: 8px 12px; background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; color: #1e293b; font-size: 13px; font-weight: 600;">${data.agenda}</td>
      </tr>
      ${data.gtimName ? `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569; font-size: 13px;">Nama GTIM</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #334155; font-size: 13px;">${data.gtimName}</td>
      </tr>` : ''}
      ${data.visitorName ? `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569; font-size: 13px;">Nama Visitor</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #334155; font-size: 13px;">${data.visitorName}</td>
      </tr>` : ''}
      ${data.companyName ? `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569; font-size: 13px;">Perusahaan</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #334155; font-size: 13px;">${data.companyName}</td>
      </tr>` : ''}
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569; font-size: 13px;">Tanggal</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #334155; font-size: 13px;">${formatDate(data.startDate)}${data.startDate !== data.endDate ? ` - ${formatDate(data.endDate)}` : ''}</td>
      </tr>
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569; font-size: 13px;">Waktu</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #334155; font-size: 13px;">${data.startTime} - ${data.endTime}</td>
      </tr>
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569; font-size: 13px;">Lokasi</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #334155; font-size: 13px;">${data.isGenbaVisit ? 'Genba Visit' : (data.meetingRoom || '-')}</td>
      </tr>
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569; font-size: 13px;">Department</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #334155; font-size: 13px;">${data.departmentName}</td>
      </tr>
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569; font-size: 13px;">Dibuat oleh</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #334155; font-size: 13px;">${data.creatorName} (<a href="mailto:${data.creatorEmail}" style="color: #3b82f6;">${data.creatorEmail}</a>)</td>
      </tr>
      ${data.request ? `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569; font-size: 13px;">Request</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; color: #334155; font-size: 13px;">${data.request}</td>
      </tr>` : ''}
    </table>
  `;
}

// Get approval action buttons HTML with inline styles (works in all email clients)
function getApprovalActionButtons(meetingId: string): string {
  const approvalUrl = `${config.frontendUrl}/approvals?meetingId=${meetingId}`;
  return `
    <table cellpadding="0" cellspacing="0" style="width: 100%; margin: 16px 0;">
      <tr>
        <td align="center">
          <table cellpadding="0" cellspacing="0" style="border-collapse: separate;">
            <tr>
              <td align="center" bgcolor="#059669" style="border-radius: 8px; background-color: #059669; border: 2px solid #047857;">
                <a href="${approvalUrl}" target="_blank" style="display: inline-block; padding: 14px 28px; font-family: 'Segoe UI', Arial, sans-serif; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 6px;">
                  ✅ Approve / Reject Meeting
                </a>
              </td>
            </tr>
          </table>
          <p style="margin: 8px 0 0 0; font-size: 12px; color: #64748b;">
            Klik tombol di atas untuk memproses approval
          </p>
        </td>
      </tr>
    </table>
  `;
}

// Template: Meeting Created - Notify Section Head
export function meetingCreatedTemplate(data: MeetingEmailData, recipientName: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <table cellpadding="0" cellspacing="0" style="width: 100%; background-color: #f1f5f9; padding: 32px 16px;">
        <tr>
          <td align="center">
            <table cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px 24px; text-align: center;">
                  <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff;">📅 Permintaan Meeting Baru</h1>
                  <p style="margin: 8px 0 0 0; font-size: 15px; color: rgba(255,255,255,0.9);">Membutuhkan persetujuan Anda</p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 24px;">
                  <p style="margin: 0 0 16px 0; font-size: 16px; color: #334155;">
                    Halo <strong style="color: #1e293b;">${recipientName}</strong>,
                  </p>
                  <p style="margin: 0 0 24px 0; font-size: 15px; color: #475569; line-height: 1.6;">
                    Ada permintaan meeting baru yang membutuhkan persetujuan Anda:
                  </p>
                  
                  <!-- Status Badge -->
                  <table cellpadding="0" cellspacing="0" style="margin-bottom: 8px;">
                    <tr>
                      <td style="background-color: #fef3c7; color: #92400e; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600;">
                        ⏳ Menunggu Persetujuan
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Action Button (placed before details for visibility) -->
                  ${getApprovalActionButtons(data.meetingId)}
                  
                  <!-- Meeting Details -->
                  ${getMeetingDetailsTable(data)}
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; padding: 20px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b;">
                    Email ini dikirim otomatis oleh sistem Meeting Room Booking.
                  </p>
                  <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                    © ${new Date().getFullYear()} G-TIM. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// Template: Section Head Approved - Notify HRGA Manager
export function sectionHeadApprovedTemplate(data: MeetingEmailData, recipientName: string, approverName: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <table cellpadding="0" cellspacing="0" style="width: 100%; background-color: #f1f5f9; padding: 32px 16px;">
        <tr>
          <td align="center">
            <table cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%); padding: 32px 24px; text-align: center;">
                  <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff;">✅ Disetujui Section Head</h1>
                  <p style="margin: 8px 0 0 0; font-size: 15px; color: rgba(255,255,255,0.9);">Membutuhkan persetujuan HRGA Manager</p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 24px;">
                  <p style="margin: 0 0 16px 0; font-size: 16px; color: #334155;">
                    Halo <strong style="color: #1e293b;">${recipientName}</strong>,
                  </p>
                  <p style="margin: 0 0 24px 0; font-size: 15px; color: #475569; line-height: 1.6;">
                    Meeting berikut telah disetujui oleh Section Head <strong style="color: #059669;">${approverName}</strong> dan membutuhkan persetujuan final Anda:
                  </p>
                  
                  <!-- Status Badge -->
                  <table cellpadding="0" cellspacing="0" style="margin-bottom: 8px;">
                    <tr>
                      <td style="background-color: #dbeafe; color: #1e40af; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600;">
                        ⏳ Menunggu Persetujuan HRGA
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Action Button (placed before details for visibility) -->
                  ${getApprovalActionButtons(data.meetingId)}
                  
                  <!-- Meeting Details -->
                  ${getMeetingDetailsTable(data)}
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; padding: 20px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b;">
                    Email ini dikirim otomatis oleh sistem Meeting Room Booking.
                  </p>
                  <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                    © ${new Date().getFullYear()} G-TIM. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// Template: HRGA Approved - Notify Admin and User
export function hrgaApprovedTemplate(data: MeetingEmailData, recipientName: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <table cellpadding="0" cellspacing="0" style="width: 100%; background-color: #f1f5f9; padding: 32px 16px;">
        <tr>
          <td align="center">
            <table cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 32px 24px; text-align: center;">
                  <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff;">🎉 Meeting Disetujui!</h1>
                  <p style="margin: 8px 0 0 0; font-size: 15px; color: rgba(255,255,255,0.9);">Semua persetujuan telah lengkap</p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 24px;">
                  <p style="margin: 0 0 16px 0; font-size: 16px; color: #334155;">
                    Halo <strong style="color: #1e293b;">${recipientName}</strong>,
                  </p>
                  <p style="margin: 0 0 24px 0; font-size: 15px; color: #475569; line-height: 1.6;">
                    Meeting berikut telah <strong style="color: #16a34a;">disetujui sepenuhnya</strong> dan siap dilaksanakan:
                  </p>
                  
                  <!-- Status Badge -->
                  <table cellpadding="0" cellspacing="0" style="margin-bottom: 8px;">
                    <tr>
                      <td style="background-color: #dcfce7; color: #166534; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600;">
                        ✅ Disetujui
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Meeting Details -->
                  ${getMeetingDetailsTable(data)}
                  
                  <p style="margin: 24px 0 0 0; font-size: 14px; color: #475569; text-align: center;">
                    Silakan persiapkan meeting sesuai jadwal yang telah ditentukan.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; padding: 20px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b;">
                    Email ini dikirim otomatis oleh sistem Meeting Room Booking.
                  </p>
                  <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                    © ${new Date().getFullYear()} G-TIM. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// Template: Meeting Canceled - Notify Section Head
export function meetingCanceledTemplate(data: MeetingEmailData, recipientName: string, cancelRemark?: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <table cellpadding="0" cellspacing="0" style="width: 100%; background-color: #f1f5f9; padding: 32px 16px;">
        <tr>
          <td align="center">
            <table cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #64748b 0%, #475569 100%); padding: 32px 24px; text-align: center;">
                  <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff;">❌ Meeting Dibatalkan</h1>
                  <p style="margin: 8px 0 0 0; font-size: 15px; color: rgba(255,255,255,0.9);">User telah membatalkan meeting</p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 24px;">
                  <p style="margin: 0 0 16px 0; font-size: 16px; color: #334155;">
                    Halo <strong style="color: #1e293b;">${recipientName}</strong>,
                  </p>
                  <p style="margin: 0 0 24px 0; font-size: 15px; color: #475569; line-height: 1.6;">
                    Meeting berikut telah <strong style="color: #64748b;">dibatalkan</strong> oleh pemohon:
                  </p>
                  
                  <!-- Status Badge -->
                  <table cellpadding="0" cellspacing="0" style="margin-bottom: 8px;">
                    <tr>
                      <td style="background-color: #e2e8f0; color: #475569; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600;">
                        🚫 Dibatalkan
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Meeting Details -->
                  ${getMeetingDetailsTable(data)}
                  
                  ${cancelRemark ? `
                  <table cellpadding="0" cellspacing="0" style="width: 100%; margin-top: 16px; background-color: #fef2f2; border-radius: 8px;">
                    <tr>
                      <td style="padding: 16px;">
                        <p style="margin: 0 0 4px 0; font-size: 13px; font-weight: 600; color: #991b1b;">Alasan Pembatalan:</p>
                        <p style="margin: 0; font-size: 14px; color: #7f1d1d;">${cancelRemark}</p>
                      </td>
                    </tr>
                  </table>
                  ` : ''}
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; padding: 20px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b;">
                    Email ini dikirim otomatis oleh sistem Meeting Room Booking.
                  </p>
                  <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                    © ${new Date().getFullYear()} G-TIM. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// Template: Meeting Rejected - Notify User
export function meetingRejectedTemplate(data: MeetingEmailData, recipientName: string, rejectorName: string, rejectorRole: string, remark?: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <table cellpadding="0" cellspacing="0" style="width: 100%; background-color: #f1f5f9; padding: 32px 16px;">
        <tr>
          <td align="center">
            <table cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 32px 24px; text-align: center;">
                  <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff;">⛔ Meeting Ditolak</h1>
                  <p style="margin: 8px 0 0 0; font-size: 15px; color: rgba(255,255,255,0.9);">Permintaan meeting tidak disetujui</p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 24px;">
                  <p style="margin: 0 0 16px 0; font-size: 16px; color: #334155;">
                    Halo <strong style="color: #1e293b;">${recipientName}</strong>,
                  </p>
                  <p style="margin: 0 0 24px 0; font-size: 15px; color: #475569; line-height: 1.6;">
                    Mohon maaf, permintaan meeting Anda telah <strong style="color: #dc2626;">ditolak</strong> oleh <strong>${rejectorName}</strong> (${rejectorRole}):
                  </p>
                  
                  <!-- Status Badge -->
                  <table cellpadding="0" cellspacing="0" style="margin-bottom: 8px;">
                    <tr>
                      <td style="background-color: #fee2e2; color: #991b1b; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 600;">
                        ❌ Ditolak
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Meeting Details -->
                  ${getMeetingDetailsTable(data)}
                  
                  ${remark ? `
                  <table cellpadding="0" cellspacing="0" style="width: 100%; margin-top: 16px; background-color: #fef2f2; border-radius: 8px; border-left: 4px solid #dc2626;">
                    <tr>
                      <td style="padding: 16px;">
                        <p style="margin: 0 0 4px 0; font-size: 13px; font-weight: 600; color: #991b1b;">Alasan Penolakan:</p>
                        <p style="margin: 0; font-size: 14px; color: #7f1d1d;">${remark}</p>
                      </td>
                    </tr>
                  </table>
                  ` : ''}
                  
                  <p style="margin: 24px 0 0 0; font-size: 14px; color: #475569; text-align: center;">
                    Silakan hubungi approver untuk informasi lebih lanjut atau ajukan permintaan baru.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8fafc; padding: 20px 24px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0 0 4px 0; font-size: 12px; color: #64748b;">
                    Email ini dikirim otomatis oleh sistem Meeting Room Booking.
                  </p>
                  <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                    © ${new Date().getFullYear()} G-TIM. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}
