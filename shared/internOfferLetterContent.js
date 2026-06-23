const LETTER_FONT = "'Source Sans 3', 'Segoe UI', Calibri, 'Helvetica Neue', Arial, sans-serif"
const LETTER_COLOR = '#0f2744'

export function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function formatLetterDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(`${dateStr}T00:00:00`)
  if (Number.isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
}

export function getInternTaskArea(d) {
  if (d.taskArea) return d.taskArea
  const pos = d.position || ''
  const match = pos.match(/^(.+?)\s+Intern$/i)
  if (match) return match[1]
  const domain = d.internshipDomain || d.courseName || ''
  return domain.replace(/\s*Domain$/i, '') || ''
}

function getTaskPhrase(taskArea) {
  return taskArea ? `assigned ${taskArea} tasks` : 'assigned tasks'
}

function displayValue(value, fallback = '—') {
  const text = String(value || '').trim()
  return escapeHtml(text || fallback)
}

export function wrapTechackodeLetterhead(contentHtml, letterheadSrc) {
  return `
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700&display=swap">
    <style>
      @page { size: A4; margin: 0; }
      html, body { margin: 0; padding: 0; }
    </style>
    <div style="width:210mm;height:297mm;margin:0 auto;position:relative;background:#ffffff;box-sizing:border-box;overflow:hidden;page-break-after:avoid;page-break-inside:avoid;">
      <div style="position:absolute;inset:0;background-image:url('${letterheadSrc}');background-size:100% 100%;background-repeat:no-repeat;background-position:center top;pointer-events:none;z-index:0;"></div>
      <div style="position:relative;z-index:1;box-sizing:border-box;width:100%;height:100%;padding:43mm 22mm 78mm 24mm;font-family:${LETTER_FONT};font-size:10pt;line-height:1.45;letter-spacing:0.005em;color:${LETTER_COLOR};text-rendering:optimizeLegibility;-webkit-font-smoothing:antialiased;overflow:hidden;">
        ${contentHtml}
      </div>
    </div>`
}

export function buildInternOfferLetterBody(d) {
  const name = d.studentName || d.recipientName
  const domain = d.internshipDomain || d.courseName || ''
  const startDate = formatLetterDate(d.startDate)
  const endDate = formatLetterDate(d.endDate)
  const durationRange = startDate && endDate ? `${startDate} – ${endDate}` : startDate || endDate || ''
  const taskArea = getInternTaskArea(d)
  const taskPhrase = getTaskPhrase(taskArea)

  const p = 'margin:0 0 6pt;text-align:justify;'
  const section = `margin:8pt 0 3pt;font-size:10pt;font-weight:600;color:${LETTER_COLOR};`
  const list = `margin:0 0 6pt;padding-left:14pt;list-style-type:disc;list-style-position:outside;`
  const li = 'margin:0 0 2pt;padding-left:1pt;'

  return `
      <h2 style="text-align:center;font-size:11.5pt;font-weight:700;margin:0 0 10pt;text-decoration:underline;text-underline-offset:2px;letter-spacing:0.1em;color:${LETTER_COLOR};">OFFER LETTER</h2>
      <p style="${p}">Dear ${displayValue(name)},</p>
      <p style="${p}">We are pleased to appoint you as an <strong>Intern – ${displayValue(domain)}</strong> at <strong>Techackode</strong> for a duration of <strong>${displayValue(d.duration)}</strong>, from <strong>${displayValue(startDate)}</strong> to <strong>${displayValue(endDate)}</strong>.</p>
      <p style="${p}">During this internship, you will be working on ${escapeHtml(taskPhrase)} and live projects under the guidance of our team. You are required to maintain professionalism, follow instructions, and complete tasks within the given timelines.</p>
      <p style="${p}">This internship is designed to help you gain practical exposure, strengthen your technical and professional skills, and understand real-world project workflows. You are expected to stay responsive on the official communication platform, attend scheduled meetings, and share regular progress updates with your mentor.</p>
      <p style="${section}">Internship Details</p>
      <ul style="${list}">
        <li style="${li}"><strong>Position:</strong> ${displayValue(d.position)}</li>
        <li style="${li}"><strong>Duration:</strong> ${displayValue(durationRange)}</li>
        <li style="${li}"><strong>Work Mode:</strong> ${escapeHtml(d.workMode || 'Online')}</li>
        <li style="${li}"><strong>Communication Platform:</strong> ${escapeHtml(d.communicationPlatform || 'Google Chat')}</li>
        <li style="${li}"><strong>Reporting:</strong> You will report to the assigned mentor/coordinator and follow the task schedule shared at onboarding.</li>
        <li style="${li}">Top-performing interns may receive an <strong>Employment Offer</strong> from Techackode upon successful completion.</li>
      </ul>
      <p style="${section}">Certificate</p>
      <p style="${p}">A Certificate of Completion will be issued only after successfully completing the internship criteria and assigned work, including timely submission of tasks, active participation throughout the internship period, and satisfactory performance as reviewed by the mentor.</p>
      <p style="${section}">Terms &amp; Conditions</p>
      <ul style="${list}">
        <li style="${li}">All work, data, and code remain the property of Techackode.</li>
        <li style="${li}">Lack of participation or misconduct may lead to termination.</li>
        <li style="${li}">Confidentiality must be maintained for all project-related information.</li>
        <li style="${li}">Plagiarism or copying of work is strictly prohibited.</li>
        <li style="${li}">All official communication, submissions, and updates must be shared only through the assigned platform.</li>
      </ul>
      <p style="margin:0;text-align:justify;">We look forward to seeing your active participation and contribution during your internship period. Please acknowledge this offer and be ready to begin on the start date mentioned above. Welcome to <strong>Techackode!</strong></p>`
}

export function buildInternExperienceLetterBody(d) {
  const name = d.studentName || d.recipientName
  const domain = d.internshipDomain || d.courseName || ''
  const startDate = formatLetterDate(d.startDate)
  const endDate = formatLetterDate(d.endDate)
  const durationRange = startDate && endDate ? `${startDate} – ${endDate}` : startDate || endDate || ''
  const taskArea = getInternTaskArea(d)
  const performance = d.performance || 'Satisfactory performance throughout the internship period.'
  const projectWork = d.projectTitle || d.responsibilities || getTaskPhrase(taskArea)

  const p = 'margin:0 0 6pt;text-align:justify;'
  const section = `margin:8pt 0 3pt;font-size:10pt;font-weight:600;color:${LETTER_COLOR};`
  const list = `margin:0 0 6pt;padding-left:14pt;list-style-type:disc;list-style-position:outside;`
  const li = 'margin:0 0 2pt;padding-left:1pt;'

  return `
      <h2 style="text-align:center;font-size:11.5pt;font-weight:700;margin:0 0 10pt;text-decoration:underline;text-underline-offset:2px;letter-spacing:0.1em;color:${LETTER_COLOR};">INTERN EXPERIENCE LETTER</h2>
      <p style="${p}"><strong>To Whom It May Concern,</strong></p>
      <p style="${p}">This is to certify that <strong>${displayValue(name)}</strong> has successfully completed an internship as <strong>${displayValue(d.position)}</strong> in the <strong>${displayValue(domain)}</strong> at <strong>Techackode</strong> for a duration of <strong>${displayValue(d.duration)}</strong>, from <strong>${displayValue(startDate)}</strong> to <strong>${displayValue(endDate)}</strong>.</p>
      <p style="${p}">During this internship, ${escapeHtml(name || 'the intern')} worked on ${escapeHtml(projectWork)} and live projects under the guidance of our team. ${escapeHtml(name || 'They')} completed assigned tasks within timelines and maintained professional conduct throughout the internship period.</p>
      <p style="${section}">Internship Details</p>
      <ul style="${list}">
        <li style="${li}"><strong>Position:</strong> ${displayValue(d.position)}</li>
        <li style="${li}"><strong>Duration:</strong> ${displayValue(durationRange)}</li>
        <li style="${li}"><strong>Work Mode:</strong> ${escapeHtml(d.workMode || 'Online')}</li>
        <li style="${li}"><strong>Project / Work:</strong> ${displayValue(d.projectTitle || projectWork)}</li>
      </ul>
      <p style="${section}">Scope of Work</p>
      <p style="${p}">During the internship, ${escapeHtml(name || 'the intern')} was involved in ${escapeHtml(getTaskPhrase(taskArea))}, project assignments, and team activities. ${escapeHtml(name || 'They')} gained practical exposure to real-world workflows and improved technical and professional skills.</p>
      <p style="${section}">Performance Summary</p>
      <p style="${p}">${escapeHtml(performance)}</p>
      <p style="${p}">We found ${escapeHtml(name || 'the intern')} to be sincere, dedicated, and cooperative. This letter is issued upon successful completion of the internship and may be used for academic or professional purposes.</p>
      <p style="margin:0;text-align:justify;">We wish ${escapeHtml(name || 'the intern')} continued success in all future endeavours.</p>`
}
