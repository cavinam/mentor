// Email templates for meeting notifications

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

const baseStyles = `
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 15px 20px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 18px; }
    .header p { color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 13px; }
    .content { padding: 15px 20px; }
    .content p { margin: 8px 0; font-size: 14px; }
    .info-box { background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 10px 12px; margin: 12px 0; }
    .status-badge { display: inline-block; padding: 4px 10px; border-radius: 12px; font-weight: 600; font-size: 12px; margin-bottom: 8px; }
    .status-pending { background-color: #fff3cd; color: #856404; }
    .status-approved { background-color: #d4edda; color: #155724; }
    .status-rejected { background-color: #f8d7da; color: #721c24; }
    .status-canceled { background-color: #e2e3e5; color: #383d41; }
    .footer { background-color: #f8f9fa; padding: 12px; text-align: center; color: #6c757d; font-size: 11px; }
    .footer p { margin: 3px 0; }
    table { width: 100%; border-collapse: collapse; margin: 8px 0; }
    table td { padding: 5px 8px; border-bottom: 1px solid #eee; font-size: 13px; vertical-align: top; }
    table td:first-child { font-weight: 600; color: #555; width: 120px; white-space: nowrap; }
  </style>
`;

const emailFooter = `
  <div class="footer">
    <p>Email ini dikirim otomatis oleh sistem Meeting Room Booking.</p>
    <p>© ${new Date().getFullYear()} G-TIM. All rights reserved.</p>
  </div>
`;

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
    <table>
      <tr>
        <td>Agenda</td>
        <td>${data.agenda}</td>
      </tr>
      ${data.gtimName ? `<tr><td>Nama GTIM</td><td>${data.gtimName}</td></tr>` : ''}
      ${data.visitorName ? `<tr><td>Nama Visitor</td><td>${data.visitorName}</td></tr>` : ''}
      ${data.companyName ? `<tr><td>Perusahaan</td><td>${data.companyName}</td></tr>` : ''}
      <tr>
        <td>Tanggal</td>
        <td>${formatDate(data.startDate)}${data.startDate !== data.endDate ? ` - ${formatDate(data.endDate)}` : ''}</td>
      </tr>
      <tr>
        <td>Waktu</td>
        <td>${data.startTime} - ${data.endTime}</td>
      </tr>
      <tr>
        <td>Lokasi</td>
        <td>${data.isGenbaVisit ? 'Genba Visit' : (data.meetingRoom || '-')}</td>
      </tr>
      <tr>
        <td>Department</td>
        <td>${data.departmentName}</td>
      </tr>
      <tr>
        <td>Dibuat oleh</td>
        <td>${data.creatorName} (${data.creatorEmail})</td>
      </tr>
      ${data.request ? `<tr><td>Request Khusus</td><td>${data.request}</td></tr>` : ''}
    </table>
  `;
}

// Template: Meeting Created - Notify Section Head
export function meetingCreatedTemplate(data: MeetingEmailData, recipientName: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>${baseStyles}</head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🗓️ Permintaan Meeting Baru</h1>
          <p>Membutuhkan persetujuan Anda</p>
        </div>
        <div class="content">
          <p>Halo <strong>${recipientName}</strong>,</p>
          <p>Ada permintaan meeting baru yang membutuhkan persetujuan Anda:</p>
          
          <div class="info-box">
            <span class="status-badge status-pending">⏳ Menunggu Persetujuan</span>
            ${getMeetingDetailsTable(data)}
          </div>
          
          <p>Silakan login ke sistem untuk menyetujui atau menolak permintaan ini.</p>
        </div>
        ${emailFooter}
      </div>
    </body>
    </html>
  `;
}

// Template: Section Head Approved - Notify HRGA Manager
export function sectionHeadApprovedTemplate(data: MeetingEmailData, recipientName: string, approverName: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>${baseStyles}</head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Meeting Disetujui Section Head</h1>
          <p>Membutuhkan persetujuan HRGA Manager</p>
        </div>
        <div class="content">
          <p>Halo <strong>${recipientName}</strong>,</p>
          <p>Meeting berikut telah disetujui oleh Section Head <strong>${approverName}</strong> dan membutuhkan persetujuan Anda:</p>
          
          <div class="info-box">
            <span class="status-badge status-pending">⏳ Menunggu Persetujuan HRGA</span>
            ${getMeetingDetailsTable(data)}
          </div>
          
          <p>Silakan login ke sistem untuk menyetujui atau menolak permintaan ini.</p>
        </div>
        ${emailFooter}
      </div>
    </body>
    </html>
  `;
}

// Template: HRGA Approved - Notify Admin and User
export function hrgaApprovedTemplate(data: MeetingEmailData, recipientName: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>${baseStyles}</head>
    <body>
      <div class="container">
        <div class="header" style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%);">
          <h1>🎉 Meeting Telah Disetujui</h1>
          <p>Semua persetujuan telah lengkap</p>
        </div>
        <div class="content">
          <p>Halo <strong>${recipientName}</strong>,</p>
          <p>Meeting berikut telah <strong>disetujui sepenuhnya</strong> dan siap dilaksanakan:</p>
          
          <div class="info-box" style="border-left-color: #28a745;">
            <span class="status-badge status-approved">✅ Disetujui</span>
            ${getMeetingDetailsTable(data)}
          </div>
          
          <p>Silakan persiapkan meeting sesuai jadwal yang telah ditentukan.</p>
        </div>
        ${emailFooter}
      </div>
    </body>
    </html>
  `;
}

// Template: Meeting Canceled - Notify Section Head
export function meetingCanceledTemplate(data: MeetingEmailData, recipientName: string, cancelRemark?: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>${baseStyles}</head>
    <body>
      <div class="container">
        <div class="header" style="background: linear-gradient(135deg, #6c757d 0%, #495057 100%);">
          <h1>❌ Meeting Dibatalkan</h1>
          <p>User telah membatalkan meeting</p>
        </div>
        <div class="content">
          <p>Halo <strong>${recipientName}</strong>,</p>
          <p>Meeting berikut telah <strong>dibatalkan</strong> oleh pemohon:</p>
          
          <div class="info-box" style="border-left-color: #6c757d;">
            <span class="status-badge status-canceled">🚫 Dibatalkan</span>
            ${getMeetingDetailsTable(data)}
            ${cancelRemark ? `<p style="margin-top: 15px;"><strong>Alasan:</strong> ${cancelRemark}</p>` : ''}
          </div>
        </div>
        ${emailFooter}
      </div>
    </body>
    </html>
  `;
}

// Template: Meeting Rejected - Notify User
export function meetingRejectedTemplate(data: MeetingEmailData, recipientName: string, rejectorName: string, rejectorRole: string, remark?: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>${baseStyles}</head>
    <body>
      <div class="container">
        <div class="header" style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);">
          <h1>⛔ Meeting Ditolak</h1>
          <p>Permintaan meeting tidak disetujui</p>
        </div>
        <div class="content">
          <p>Halo <strong>${recipientName}</strong>,</p>
          <p>Mohon maaf, permintaan meeting Anda telah <strong>ditolak</strong> oleh <strong>${rejectorName}</strong> (${rejectorRole}):</p>
          
          <div class="info-box" style="border-left-color: #dc3545;">
            <span class="status-badge status-rejected">❌ Ditolak</span>
            ${getMeetingDetailsTable(data)}
            ${remark ? `<p style="margin-top: 15px;"><strong>Alasan penolakan:</strong> ${remark}</p>` : ''}
          </div>
          
          <p>Silakan hubungi approver untuk informasi lebih lanjut atau ajukan permintaan baru.</p>
        </div>
        ${emailFooter}
      </div>
    </body>
    </html>
  `;
}
