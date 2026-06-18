export const DOCUMENT_TYPES = {
  offer_letter: { prefix: 'THK-OL', label: 'Offer Letter' },
  intern_offer_letter: { prefix: 'THK-IOL', label: 'Intern Offer Letter' },
  experience_letter: { prefix: 'THK-EL', label: 'Experience Letter' },
  course_completion: { prefix: 'THK-CCC', label: 'Course Completion Certificate' },
  internship_certificate: { prefix: 'THK-IC', label: 'Internship Certificate' },
  appointment_letter: { prefix: 'THK-AL', label: 'Appointment Letter' },
  relieving_letter: { prefix: 'THK-RL', label: 'Relieving Letter' },
  salary_certificate: { prefix: 'THK-SC', label: 'Salary Certificate' },
  warning_letter: { prefix: 'THK-WL', label: 'Warning Letter' },
  policy_document: { prefix: 'THK-PD', label: 'Policy Document' },
}

export function getDocumentTypeConfig(type) {
  return DOCUMENT_TYPES[type] || null
}

export function isValidDocumentType(type) {
  return type in DOCUMENT_TYPES
}
