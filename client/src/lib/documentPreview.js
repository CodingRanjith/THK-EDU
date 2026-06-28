import { buildInternOfferLetterBody, buildInternExperienceLetterBody, buildInternshipCertificateBody, wrapTechackodeLetterhead } from '../../../shared/internOfferLetterContent.js'
import letterheadImg from '@/assets/head.png'

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function letterHeader(docNumber, date) {
  return `
    <div style="text-align:center;margin-bottom:24px;">
      <h1 style="margin:0;color:#1e3a8a;font-size:22px;">TECHACKODE</h1>
      <p style="margin:4px 0 0;color:#64748b;font-size:12px;">Edutech &amp; Professional Training</p>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:12px;color:#475569;margin-bottom:20px;">
      <span><strong>Ref:</strong> ${escapeHtml(docNumber)}</span>
      <span><strong>Date:</strong> ${escapeHtml(date)}</span>
    </div>`
}

function letterFooter() {
  return `
    <div style="margin-top:40px;border-top:1px solid #e2e8f0;padding-top:16px;font-size:12px;color:#64748b;">
      <p>This is a system-generated document from Techackode Document Center.</p>
      <p>Techackode Edutech | www.techackode.com | support@techackode.com</p>
    </div>`
}

const templates = {
  offer_letter: (d, num) => `
    <div style="font-family:Georgia,serif;max-width:700px;margin:0 auto;padding:40px;color:#1e293b;line-height:1.7;">
      ${letterHeader(num, d.issueDate)}
      <p><strong>To,</strong><br/>${escapeHtml(d.recipientName)}<br/>${escapeHtml(d.recipientAddress || '')}</p>
      <h2 style="text-align:center;color:#1e3a8a;margin:24px 0;">OFFER LETTER</h2>
      <p>Dear ${escapeHtml(d.recipientName)},</p>
      <p>We are pleased to offer you the position of <strong>${escapeHtml(d.position)}</strong> in the <strong>${escapeHtml(d.department)}</strong> department at Techackode, effective <strong>${escapeHtml(d.joiningDate)}</strong>.</p>
      <p>Your compensation will be <strong>${escapeHtml(d.salary)}</strong> per month. You will report to <strong>${escapeHtml(d.reportingTo)}</strong> at our <strong>${escapeHtml(d.location)}</strong> office.</p>
      <p>This offer is subject to verification of documents and successful completion of onboarding formalities. Please confirm your acceptance by <strong>${escapeHtml(d.acceptanceDeadline || d.joiningDate)}</strong>.</p>
      <p>We look forward to welcoming you to the Techackode team.</p>
      <p style="margin-top:32px;">Sincerely,<br/><strong>${escapeHtml(d.authorizedSignatory || 'HR Department')}</strong><br/>Techackode Edutech</p>
      ${letterFooter()}
    </div>`,

  intern_offer_letter: (d, num) => {
    const body = buildInternOfferLetterBody(d)
    return wrapTechackodeLetterhead(body, letterheadImg)
  },

  intern_experience_letter: (d, num) => {
    const body = buildInternExperienceLetterBody(d)
    return wrapTechackodeLetterhead(body, letterheadImg)
  },

  experience_letter: (d, num) => `
    <div style="font-family:Georgia,serif;max-width:700px;margin:0 auto;padding:40px;color:#1e293b;line-height:1.7;">
      ${letterHeader(num, d.issueDate)}
      <h2 style="text-align:center;color:#1e3a8a;margin:24px 0;">EXPERIENCE LETTER</h2>
      <p><strong>To Whom It May Concern,</strong></p>
      <p>This is to certify that <strong>${escapeHtml(d.recipientName)}</strong> was employed with Techackode as <strong>${escapeHtml(d.designation)}</strong> in the <strong>${escapeHtml(d.department)}</strong> department from <strong>${escapeHtml(d.startDate)}</strong> to <strong>${escapeHtml(d.endDate)}</strong>.</p>
      <p>During this period, ${escapeHtml(d.recipientName)} demonstrated professionalism and dedication. Key responsibilities included: ${escapeHtml(d.responsibilities)}.</p>
      <p>We wish ${escapeHtml(d.recipientName)} continued success in future endeavors.</p>
      <p style="margin-top:32px;">Sincerely,<br/><strong>${escapeHtml(d.authorizedSignatory || 'HR Department')}</strong><br/>Techackode Edutech</p>
      ${letterFooter()}
    </div>`,

  course_completion: (d, num) => `
    <div style="font-family:Georgia,serif;max-width:700px;margin:0 auto;padding:40px;color:#1e293b;line-height:1.7;text-align:center;">
      ${letterHeader(num, d.issueDate)}
      <h2 style="color:#1e3a8a;margin:24px 0;font-size:26px;">CERTIFICATE OF COMPLETION</h2>
      <p>This is to certify that</p>
      <h3 style="font-size:24px;color:#1e3a8a;margin:16px 0;">${escapeHtml(d.recipientName)}</h3>
      <p>has successfully completed the course</p>
      <h3 style="font-size:20px;margin:16px 0;">${escapeHtml(d.courseName)}</h3>
      <p>Duration: <strong>${escapeHtml(d.duration)}</strong> | Grade: <strong>${escapeHtml(d.grade)}</strong></p>
      <p>Completed on: <strong>${escapeHtml(d.completionDate)}</strong></p>
      <p style="margin-top:32px;">Authorized by<br/><strong>${escapeHtml(d.authorizedSignatory || 'Academic Director')}</strong><br/>Techackode Edutech</p>
      ${letterFooter()}
    </div>`,

  internship_certificate: (d, num) => {
    const body = buildInternshipCertificateBody(d)
    return wrapTechackodeLetterhead(body, letterheadImg)
  },

  appointment_letter: (d, num) => `
    <div style="font-family:Georgia,serif;max-width:700px;margin:0 auto;padding:40px;color:#1e293b;line-height:1.7;">
      ${letterHeader(num, d.issueDate)}
      <h2 style="text-align:center;color:#1e3a8a;margin:24px 0;">APPOINTMENT LETTER</h2>
      <p>Dear ${escapeHtml(d.recipientName)},</p>
      <p>With reference to your application and subsequent interviews, we are pleased to appoint you as <strong>${escapeHtml(d.position)}</strong> in the <strong>${escapeHtml(d.department)}</strong> department, effective <strong>${escapeHtml(d.effectiveDate)}</strong>.</p>
      <p>Your employment terms include a probation period of <strong>${escapeHtml(d.probationPeriod || '3 months')}</strong> and a compensation of <strong>${escapeHtml(d.salary)}</strong>.</p>
      <p>${escapeHtml(d.terms || 'You are expected to abide by all company policies and maintain confidentiality of organizational information.')}</p>
      <p style="margin-top:32px;">Sincerely,<br/><strong>${escapeHtml(d.authorizedSignatory || 'HR Department')}</strong><br/>Techackode Edutech</p>
      ${letterFooter()}
    </div>`,

  relieving_letter: (d, num) => `
    <div style="font-family:Georgia,serif;max-width:700px;margin:0 auto;padding:40px;color:#1e293b;line-height:1.7;">
      ${letterHeader(num, d.issueDate)}
      <h2 style="text-align:center;color:#1e3a8a;margin:24px 0;">RELIEVING LETTER</h2>
      <p>Dear ${escapeHtml(d.recipientName)},</p>
      <p>This is to confirm that you were employed with Techackode as <strong>${escapeHtml(d.designation)}</strong> in the <strong>${escapeHtml(d.department)}</strong> department.</p>
      <p>Your last working day with us was <strong>${escapeHtml(d.lastWorkingDay)}</strong>. You have been relieved of your duties effective from the same date.</p>
      <p>Reason: ${escapeHtml(d.reason || 'Resignation accepted as per company policy.')}</p>
      <p>We thank you for your contributions and wish you success in your future career.</p>
      <p style="margin-top:32px;">Sincerely,<br/><strong>${escapeHtml(d.authorizedSignatory || 'HR Department')}</strong><br/>Techackode Edutech</p>
      ${letterFooter()}
    </div>`,

  salary_certificate: (d, num) => `
    <div style="font-family:Georgia,serif;max-width:700px;margin:0 auto;padding:40px;color:#1e293b;line-height:1.7;">
      ${letterHeader(num, d.issueDate)}
      <h2 style="text-align:center;color:#1e3a8a;margin:24px 0;">SALARY CERTIFICATE</h2>
      <p><strong>To Whom It May Concern,</strong></p>
      <p>This is to certify that <strong>${escapeHtml(d.recipientName)}</strong>, holding the designation of <strong>${escapeHtml(d.designation)}</strong> in the <strong>${escapeHtml(d.department)}</strong> department, is a confirmed employee of Techackode.</p>
      <p>Salary details for the period <strong>${escapeHtml(d.period)}</strong>:</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:8px;border:1px solid #e2e8f0;">Gross Salary</td><td style="padding:8px;border:1px solid #e2e8f0;"><strong>${escapeHtml(d.grossSalary)}</strong></td></tr>
        <tr><td style="padding:8px;border:1px solid #e2e8f0;">Net Salary</td><td style="padding:8px;border:1px solid #e2e8f0;"><strong>${escapeHtml(d.netSalary)}</strong></td></tr>
      </table>
      <p>This certificate is issued upon request for official purposes only.</p>
      <p style="margin-top:32px;">Sincerely,<br/><strong>${escapeHtml(d.authorizedSignatory || 'Finance Department')}</strong><br/>Techackode Edutech</p>
      ${letterFooter()}
    </div>`,

  warning_letter: (d, num) => `
    <div style="font-family:Georgia,serif;max-width:700px;margin:0 auto;padding:40px;color:#1e293b;line-height:1.7;">
      ${letterHeader(num, d.issueDate)}
      <h2 style="text-align:center;color:#dc2626;margin:24px 0;">WARNING LETTER</h2>
      <p>Dear ${escapeHtml(d.recipientName)},</p>
      <p>This letter serves as an official warning regarding: <strong>${escapeHtml(d.issue)}</strong>.</p>
      <p>Details: ${escapeHtml(d.details || 'Despite prior verbal reminders, the issue has not been resolved to company standards.')}</p>
      <p>Warning Date: <strong>${escapeHtml(d.warningDate)}</strong></p>
      <p>Consequences: ${escapeHtml(d.consequences || 'Failure to improve may result in further disciplinary action as per company policy.')}</p>
      <p>We expect immediate corrective action and compliance going forward.</p>
      <p style="margin-top:32px;">Sincerely,<br/><strong>${escapeHtml(d.authorizedSignatory || 'HR Department')}</strong><br/>Techackode Edutech</p>
      ${letterFooter()}
    </div>`,

  policy_document: (d, num) => `
    <div style="font-family:Georgia,serif;max-width:700px;margin:0 auto;padding:40px;color:#1e293b;line-height:1.7;">
      ${letterHeader(num, d.issueDate)}
      <h2 style="text-align:center;color:#1e3a8a;margin:24px 0;">${escapeHtml(d.policyTitle)}</h2>
      <p><strong>Version:</strong> ${escapeHtml(d.policyVersion)} | <strong>Effective Date:</strong> ${escapeHtml(d.effectiveDate)} | <strong>Department:</strong> ${escapeHtml(d.department)}</p>
      <div style="margin-top:24px;white-space:pre-wrap;">${escapeHtml(d.content)}</div>
      <p style="margin-top:32px;">Approved by<br/><strong>${escapeHtml(d.authorizedSignatory || 'Management')}</strong><br/>Techackode Edutech</p>
      ${letterFooter()}
    </div>`,
}

export function renderDocumentPreview(documentType, formData, documentNumber = 'PREVIEW') {
  const template = templates[documentType]
  if (!template) return '<p>Unknown document type</p>'
  return template(formData, documentNumber)
}
