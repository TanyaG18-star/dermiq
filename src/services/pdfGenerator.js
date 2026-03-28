import jsPDF from 'jspdf'

export const generatePDFReport = (result, image, user) => {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  // HEADER
  doc.setFillColor(16, 185, 129)
  doc.rect(0, 0, pageWidth, 40, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('DermIQ', 14, 18)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('AI Skin Care Assistant', 14, 26)
  doc.text('Skin Analysis Report', 14, 33)
  const date = new Date().toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric'
  })
  doc.text(date, pageWidth - 14, 26, { align: 'right' })

  // PATIENT INFO
  let y = 55
  doc.setTextColor(31, 41, 55)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Patient Information', 14, y)
  y += 8
  doc.setDrawColor(16, 185, 129)
  doc.line(14, y, pageWidth - 14, y)
  y += 8
  doc.setFontSize(10)

  const patientInfo = [
    ['Name:', user?.fullName || 'N/A', 'Age:', String(user?.age || 'N/A')],
    ['Gender:', user?.gender || 'N/A', 'City:', user?.city || 'N/A'],
    ['Email:', user?.email || 'N/A', 'Contact:', user?.contact || 'N/A'],
  ]

  patientInfo.forEach(row => {
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(31, 41, 55)
    doc.text(row[0], 14, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(75, 85, 99)
    doc.text(row[1], 40, y)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(31, 41, 55)
    doc.text(row[2], 110, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(75, 85, 99)
    doc.text(row[3], 135, y)
    y += 8
  })

  // DIAGNOSIS
  y += 5
  doc.setTextColor(31, 41, 55)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('AI Diagnosis Result', 14, y)
  y += 8
  doc.setDrawColor(16, 185, 129)
  doc.line(14, y, pageWidth - 14, y)
  y += 8

  const isHigh = result?.severity === 'high'
  if (isHigh) {
    doc.setFillColor(254, 242, 242)
    doc.setDrawColor(239, 68, 68)
  } else {
    doc.setFillColor(240, 253, 244)
    doc.setDrawColor(16, 185, 129)
  }
  doc.roundedRect(14, y, pageWidth - 28, 35, 3, 3, 'FD')

  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(isHigh ? 220 : 5, isHigh ? 38 : 150, isHigh ? 38 : 105)
  doc.text(result?.condition || 'Unknown', 20, y + 12)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(75, 85, 99)
  doc.text('Severity: ' + (result?.severity === 'high' ? 'HIGH' : 'LOW'), 20, y + 22)
  doc.text('AI Confidence: ' + (result?.confidence || 0) + '%', 20, y + 30)

  doc.setFillColor(229, 231, 235)
  doc.roundedRect(90, y + 25, 90, 6, 2, 2, 'F')
  doc.setFillColor(isHigh ? 239 : 16, isHigh ? 68 : 185, isHigh ? 68 : 129)
  const barWidth = (result?.confidence || 0) * 0.9
  doc.roundedRect(90, y + 25, barWidth, 6, 2, 2, 'F')
  y += 45

  if (result?.description) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(107, 114, 128)
    const descLines = doc.splitTextToSize(result.description, pageWidth - 28)
    doc.text(descLines, 14, y)
    y += descLines.length * 6 + 5
  }

  // SKINCARE ROUTINE
  if (result?.routine && result.routine.length > 0) {
    y += 5
    if (y > 250) { doc.addPage(); y = 20 }
    doc.setTextColor(31, 41, 55)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Recommended Skincare Routine', 14, y)
    y += 8
    doc.setDrawColor(16, 185, 129)
    doc.line(14, y, pageWidth - 14, y)
    y += 8

    result.routine.forEach((step, i) => {
      if (y > 260) { doc.addPage(); y = 20 }
      doc.setFillColor(240, 253, 244)
      doc.roundedRect(14, y - 4, pageWidth - 28, 10, 2, 2, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(16, 185, 129)
      doc.text((i + 1) + '.', 18, y + 3)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(55, 65, 81)
      const cleanStep = step.replace(/[^\x00-\x7F]/g, '').trim()
      const stepLines = doc.splitTextToSize(cleanStep, pageWidth - 50)
      doc.text(stepLines, 26, y + 3)
      y += stepLines.length > 1 ? stepLines.length * 6 + 4 : 12
    })
  }

  // MEDICINES
  if (result?.medicines && result.medicines.length > 0) {
    if (y > 240) { doc.addPage(); y = 20 }
    y += 5
    doc.setTextColor(31, 41, 55)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Recommended OTC Medicines', 14, y)
    y += 8
    doc.setDrawColor(16, 185, 129)
    doc.line(14, y, pageWidth - 14, y)
    y += 8

    result.medicines.forEach((med, i) => {
      if (y > 260) { doc.addPage(); y = 20 }
      doc.setFillColor(239, 246, 255)
      doc.roundedRect(14, y - 4, pageWidth - 28, 10, 2, 2, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(59, 130, 246)
      doc.text((i + 1) + '.', 18, y + 3)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(55, 65, 81)
      const cleanMed = med.replace(/[^\x00-\x7F]/g, '').trim()
      doc.text(cleanMed, 26, y + 3)
      y += 12
    })
  }

  // DISCLAIMER
  if (y > 250) { doc.addPage(); y = 20 }
  y += 10
  doc.setFillColor(254, 252, 232)
  doc.setDrawColor(234, 179, 8)
  doc.roundedRect(14, y, pageWidth - 28, 20, 3, 3, 'FD')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(161, 98, 7)
  doc.text('DISCLAIMER:', 18, y + 8)
  doc.setFont('helvetica', 'normal')
  doc.text(
    'This report is AI-generated for educational purposes only. Always consult a qualified dermatologist.',
    18, y + 15
  )

  // FOOTER
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFillColor(16, 185, 129)
    doc.rect(0, 285, pageWidth, 15, 'F')
    doc.setFontSize(8)
    doc.setTextColor(255, 255, 255)
    doc.text('DermIQ - AI Skin Care Assistant', 14, 293)
    doc.text('Page ' + i + ' of ' + pageCount, pageWidth - 14, 293, { align: 'right' })
  }

  // SAVE
  const fileName = 'DermIQ_Report_' + (user?.fullName?.replace(' ', '_') || 'Patient') + '_' + new Date().toLocaleDateString('en-IN').replace(/\//g, '-') + '.pdf'
  doc.save(fileName)
}