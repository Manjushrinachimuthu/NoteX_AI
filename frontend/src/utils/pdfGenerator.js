import jsPDF from 'jspdf'

// Languages that need Unicode fonts — jsPDF helvetica can't render these
// For these we use browser print-to-PDF instead
const UNICODE_LANGS = new Set(['hi', 'ta', 'te', 'mr', 'bn', 'zh', 'ja', 'ar', 'ko'])

const JUNK_PATTERNS = [
  /^\[Set GROQ_API_KEY/i,
  /^\[Transcription unavailable/i,
  /^\[Whisper/i,
  /^\[Audio transcription/i,
  /^Transcription service unavailable/i,
  /^Could not transcribe/i,
]
const isJunk = (text) => JUNK_PATTERNS.some(p => p.test(text?.trim() || ''))

// ── Browser print PDF (for Unicode languages) ─────────────────
const printPDF = (meeting, notes, summaryText, languageLabel) => {
  const clean = (notes?.transcript || []).filter(e => e?.text && !isJunk(e.text))

  const rows = clean.map(entry => {
    const time = new Date(entry.timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    })
    return `
      <div class="entry">
        <div class="entry-meta">
          <span class="speaker">${entry.speaker || 'You'}</span>
          <span class="time">${time}</span>
        </div>
        <p class="entry-text">${entry.text}</p>
      </div>`
  }).join('')

  const summaryHtml = summaryText ? `
    <div class="section">
      <h2 class="section-title">AI Summary</h2>
      <div class="summary-box">
        <p>${summaryText.replace(/\n/g, '<br>')}</p>
      </div>
    </div>` : ''

  const transcriptHtml = clean.length > 0 ? `
    <div class="section">
      <h2 class="section-title">
        Meeting Transcript
        ${languageLabel ? `<span class="lang-badge">${languageLabel}</span>` : ''}
      </h2>
      ${rows}
    </div>` : ''

  const dateStr = new Date(meeting?.createdAt).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${meeting?.title || 'Meeting Notes'}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;600;700&family=Noto+Sans+SC&family=Noto+Sans+JP&family=Noto+Sans+Devanagari&family=Noto+Sans+Telugu&family=Noto+Sans+Tamil&family=Noto+Sans+Bengali&family=Noto+Naskh+Arabic&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Noto Sans', 'Noto Sans SC', 'Noto Sans JP',
                   'Noto Sans Devanagari', 'Noto Sans Telugu',
                   'Noto Sans Tamil', 'Noto Sans Bengali',
                   'Noto Naskh Arabic', Arial, sans-serif;
      font-size: 11pt;
      color: #1a1030;
      line-height: 1.6;
    }

    .header {
      background: linear-gradient(135deg, #7c3aed, #06b6d4);
      color: white;
      padding: 20px 30px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .header-logo { font-size: 20pt; font-weight: 700; }
    .header-sub  { font-size: 9pt; opacity: 0.85; margin-top: 2px; }
    .header-date { font-size: 9pt; opacity: 0.85; text-align: right; }

    .body { padding: 24px 30px; }

    .meeting-title {
      font-size: 18pt; font-weight: 700;
      color: #1a1030; margin-bottom: 4px;
    }
    .meeting-date { font-size: 9pt; color: #888; margin-bottom: 6px; }

    .translated-badge {
      display: inline-block;
      background: #ede9fe; color: #6d28d9;
      font-size: 8pt; font-weight: 600;
      padding: 2px 10px; border-radius: 20px;
      margin-bottom: 16px;
    }

    hr { border: none; border-top: 1.5px solid #7c3aed; margin: 12px 0 20px; }

    .section { margin-bottom: 24px; }
    .section-title {
      font-size: 12pt; font-weight: 700;
      color: #7c3aed; margin-bottom: 10px;
      display: flex; align-items: center; gap: 8px;
    }
    .lang-badge {
      font-size: 8pt; font-weight: 500;
      color: #7c3aed; background: #ede9fe;
      padding: 1px 8px; border-radius: 10px;
    }

    .summary-box {
      background: #f8f6ff; border-left: 3px solid #7c3aed;
      padding: 12px 16px; border-radius: 4px;
      font-size: 10pt; color: #2a1e3c; line-height: 1.7;
    }

    .entry {
      padding: 8px 10px; margin-bottom: 4px;
      border-radius: 4px;
    }
    .entry:nth-child(odd)  { background: #f8f6ff; }
    .entry:nth-child(even) { background: #ffffff; }

    .entry-meta {
      display: flex; justify-content: space-between;
      margin-bottom: 3px;
    }
    .speaker { font-weight: 700; color: #7c3aed; font-size: 9pt; }
    .time    { color: #aaa; font-size: 8pt; }
    .entry-text { font-size: 10pt; color: #2a1e3c; }

    .footer {
      text-align: center; font-size: 8pt; color: #bbb;
      margin-top: 30px; padding-top: 10px;
      border-top: 1px solid #eee;
    }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="header-logo">NoteX AI</div>
      <div class="header-sub">Smart Meeting Assistant</div>
    </div>
    <div class="header-date">${dateStr}</div>
  </div>

  <div class="body">
    <div class="meeting-title">${meeting?.title || 'Meeting Notes'}</div>
    <div class="meeting-date">${dateStr}</div>
    ${languageLabel ? `<div class="translated-badge">Translated to ${languageLabel}</div>` : ''}
    <hr>

    ${summaryHtml}
    ${transcriptHtml}

    <div class="footer">
      NoteX AI &nbsp;•&nbsp; ${meeting?.title || 'Meeting Notes'}
      ${languageLabel ? ` &nbsp;•&nbsp; ${languageLabel}` : ''}
    </div>
  </div>

  <script>
    // Wait for Google Fonts to load then print
    document.fonts.ready.then(() => {
      setTimeout(() => { window.print(); }, 800)
    })
  </script>
</body>
</html>`

  const win = window.open('', '_blank')
  win.document.write(html)
  win.document.close()
}

// ── jsPDF (Latin/English languages) ──────────────────────────
const addPage = (doc) => { doc.addPage(); return 20 }
const checkPageBreak = (doc, y, needed = 20) => {
  if (y + needed > 275) return addPage(doc)
  return y
}

const jsPdfGenerate = (meeting, notes, summaryText, languageLabel) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW   = doc.internal.pageSize.getWidth()
  const margin  = 20
  const contentW = pageW - margin * 2
  let y = 0

  // Header bar
  doc.setFillColor(124, 58, 237)
  doc.rect(0, 0, pageW, 38, 'F')
  doc.setFontSize(22); doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('NoteX AI', margin, 18)
  doc.setFontSize(10); doc.setFont('helvetica', 'normal')
  doc.setTextColor(220, 210, 255)
  doc.text('Smart Meeting Assistant', margin, 26)
  doc.setFontSize(9)
  const dateStr = new Date(meeting?.createdAt).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })
  doc.text(dateStr, pageW - margin, 18, { align: 'right' })

  y = 50
  doc.setFontSize(20); doc.setFont('helvetica', 'bold')
  doc.setTextColor(20, 10, 40)
  doc.text(meeting?.title || 'Meeting Notes', margin, y)
  y += 8

  doc.setDrawColor(124, 58, 237); doc.setLineWidth(0.5)
  doc.line(margin, y, pageW - margin, y)
  y += 6

  if (languageLabel && languageLabel !== 'English') {
    doc.setFontSize(9); doc.setFont('helvetica', 'normal')
    doc.setFillColor(237, 233, 254); doc.setTextColor(109, 40, 217)
    const badgeText = `Translated to ${languageLabel}`
    const badgeW = doc.getTextWidth(badgeText) + 8
    doc.roundedRect(margin, y, badgeW, 7, 2, 2, 'F')
    doc.text(badgeText, margin + 4, y + 5)
    y += 12
  } else { y += 6 }

  if (summaryText) {
    y = checkPageBreak(doc, y, 20)
    doc.setFontSize(13); doc.setFont('helvetica', 'bold')
    doc.setTextColor(124, 58, 237)
    doc.text('AI Summary', margin, y); y += 7
    doc.setFontSize(10); doc.setFont('helvetica', 'normal')
    doc.setTextColor(40, 30, 60)
    doc.splitTextToSize(summaryText, contentW).forEach(line => {
      y = checkPageBreak(doc, y, 6)
      doc.text(line, margin, y); y += 5.5
    })
    y += 8
  }

  const clean = (notes?.transcript || []).filter(e => e?.text && !isJunk(e.text))
  if (clean.length > 0) {
    y = checkPageBreak(doc, y, 20)
    doc.setFontSize(13); doc.setFont('helvetica', 'bold')
    doc.setTextColor(124, 58, 237)
    doc.text(
      languageLabel && languageLabel !== 'English'
        ? `Meeting Transcript (${languageLabel})` : 'Meeting Transcript',
      margin, y
    ); y += 7

    clean.forEach((entry, idx) => {
      const timeStr = new Date(entry.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      })
      const textLines = doc.splitTextToSize(entry.text, contentW - 30)
      const blockH = 6 + textLines.length * 5 + 4
      y = checkPageBreak(doc, y, blockH)
      if (idx % 2 === 0) {
        doc.setFillColor(248, 246, 255)
        doc.rect(margin - 2, y - 4, contentW + 4, blockH, 'F')
      }
      doc.setFontSize(9); doc.setFont('helvetica', 'bold')
      doc.setTextColor(124, 58, 237)
      doc.text(entry.speaker || 'You', margin, y)
      doc.setFont('helvetica', 'normal'); doc.setTextColor(150, 140, 170)
      doc.text(timeStr, pageW - margin, y, { align: 'right' }); y += 5
      doc.setFontSize(10); doc.setFont('helvetica', 'normal')
      doc.setTextColor(40, 30, 60)
      textLines.forEach(line => { doc.text(line, margin, y); y += 5 })
      y += 4
    })
  }

  const totalPages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i); doc.setFontSize(8); doc.setTextColor(180, 170, 200)
    doc.text(
      `NoteX AI  •  ${meeting?.title || 'Meeting Notes'}  •  Page ${i} of ${totalPages}`,
      pageW / 2, 290, { align: 'center' }
    )
  }

  const blob = doc.output('blob')
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `${(meeting?.title || 'Meeting_Notes').replace(/[^a-z0-9_\-\s]/gi, '_')}.pdf`
  document.body.appendChild(a); a.click(); document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

// ── Main export ───────────────────────────────────────────────
export const generateMeetingPDF = (meeting, notes, summaryOverride, languageLabel, langCode) => {
  const summaryText = summaryOverride || notes?.generatedSummary || ''

  // Use browser print for Unicode languages (Chinese, Hindi, Telugu, etc.)
  if (langCode && UNICODE_LANGS.has(langCode)) {
    printPDF(meeting, notes, summaryText, languageLabel)
  } else {
    jsPdfGenerate(meeting, notes, summaryText, languageLabel)
  }
}
