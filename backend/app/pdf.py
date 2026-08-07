import io
import datetime
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.units import inch

# Define clinical color scheme
PRIMARY_COLOR = colors.HexColor("#0f172a") # Deep Slate Navy
SECONDARY_COLOR = colors.HexColor("#0d9488") # Medical Teal
TEXT_DARK = colors.HexColor("#334155") # Dark Gray
LINE_COLOR = colors.HexColor("#cbd5e1") # Slate Border
BG_LIGHT = colors.HexColor("#f8fafc") # Card Background

def generate_pdf_report(analysis, patient) -> io.BytesIO:
    """
    Generates a professional clinical radiology report PDF using ReportLab
    and returns it as a bytes buffer.
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=45,
        leftMargin=45,
        topMargin=45,
        bottomMargin=45
    )
    
    styles = getSampleStyleSheet()
    
    # Custom professional styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=PRIMARY_COLOR
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=SECONDARY_COLOR
    )
    
    h1_style = ParagraphStyle(
        'SectionHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=PRIMARY_COLOR,
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'ReportBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=TEXT_DARK
    )
    
    body_bold_style = ParagraphStyle(
        'ReportBodyBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=PRIMARY_COLOR
    )
    
    footer_style = ParagraphStyle(
        'ReportFooter',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#64748b"),
        alignment=1 # Center
    )

    story = []

    # 1. Header (Banner / Title)
    header_data = [
        [
            Paragraph("MedVision AI", title_style),
            Paragraph("DECISION-SUPPORT IMAGING SYSTEM", subtitle_style)
        ]
    ]
    header_table = Table(header_data, colWidths=[3.5 * inch, 4.0 * inch])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('ALIGN', (1,0), (1,0), 'RIGHT'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(header_table)
    
    # Visual divider line
    story.append(Table([[""]], colWidths=[7.5 * inch], rowHeights=[2], style=TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), SECONDARY_COLOR),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
    ])))
    story.append(Spacer(1, 15))

    # 2. Patient Demographics & Study Info (2 Column Table)
    demo_left = [
        [Paragraph("<b>Patient Name:</b>", body_style), Paragraph(patient.name, body_style)],
        [Paragraph("<b>Patient ID:</b>", body_style), Paragraph(patient.id, body_style)],
        [Paragraph("<b>Age / Gender:</b>", body_style), Paragraph(f"{patient.age}y / {patient.gender}", body_style)],
    ]
    
    study_date_parsed = analysis.date
    try:
        # ISO string clean up for print
        dt = datetime.datetime.fromisoformat(analysis.date.replace("Z", "+00:00"))
        study_date_parsed = dt.strftime("%Y-%m-%d %H:%M UTC")
    except:
        pass
        
    demo_right = [
        [Paragraph("<b>Study ID:</b>", body_style), Paragraph(analysis.id, body_style)],
        [Paragraph("<b>Date & Time:</b>", body_style), Paragraph(study_date_parsed, body_style)],
        [Paragraph("<b>Study Type:</b>", body_style), Paragraph("Chest X-ray" if analysis.type == "chest" else f"Bone Fracture ({analysis.body_part})", body_style)],
    ]
    
    demo_left_table = Table(demo_left, colWidths=[1.2 * inch, 2.3 * inch])
    demo_right_table = Table(demo_right, colWidths=[1.2 * inch, 2.3 * inch])
    
    demo_left_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
    ]))
    demo_right_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
    ]))
    
    demo_block_data = [[demo_left_table, demo_right_table]]
    demo_block_table = Table(demo_block_data, colWidths=[3.75 * inch, 3.75 * inch])
    demo_block_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BACKGROUND', (0,0), (-1,-1), BG_LIGHT),
        ('BOX', (0,0), (-1,-1), 0.5, LINE_COLOR),
        ('PADDING', (0,0), (-1,-1), 10),
    ]))
    story.append(demo_block_table)
    story.append(Spacer(1, 15))

    # 3. AI Analysis Summary
    story.append(Paragraph("AI-Assisted Findings Summary", h1_style))
    
    findings_rows = [
        [
            Paragraph("<b>Condition / Pathology</b>", body_bold_style),
            Paragraph("<b>Inference Confidence Score</b>", body_bold_style)
        ]
    ]
    
    # List findings
    for idx, f in enumerate(analysis.findings):
        label_text = f.get("label", "")
        conf = f.get("confidence", 0)
        
        # Bold formatting for the primary finding
        is_primary = (label_text == analysis.primary)
        lbl_p = Paragraph(f"<b>{label_text}</b>" if is_primary else label_text, body_style)
        
        # Add visual confidence progress indicator text
        indicator = "█" * (conf // 10) + "░" * (10 - (conf // 10))
        val_p = Paragraph(f"<b>{conf}%</b> <font color='#64748b' face='Courier'>{indicator}</font>", body_bold_style if is_primary else body_style)
        
        findings_rows.append([lbl_p, val_p])
        
    findings_table = Table(findings_rows, colWidths=[3.25 * inch, 4.25 * inch])
    findings_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('LINEBELOW', (0,0), (-1,0), 1, SECONDARY_COLOR),
        ('LINEBELOW', (0,1), (-1,-1), 0.5, LINE_COLOR),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('TOPPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(findings_table)
    story.append(Spacer(1, 15))

    # 4. Detailed Structured Report Sections
    story.append(Paragraph("Radiology Study Details", h1_style))
    
    report_dict = analysis.report
    sec_findings = report_dict.get("findings", "")
    sec_impression = report_dict.get("impression", "")
    sec_recommendations = report_dict.get("recommendations", "")
    
    report_details_rows = [
        [Paragraph("<b>FINDINGS:</b>", body_bold_style)],
        [Paragraph(sec_findings, body_style)],
        [Spacer(1, 6)],
        [Paragraph("<b>IMPRESSION:</b>", body_bold_style)],
        [Paragraph(f"<b>{sec_impression}</b>", body_style)],
        [Spacer(1, 6)],
        [Paragraph("<b>RECOMMENDATIONS:</b>", body_bold_style)],
        [Paragraph(sec_recommendations, body_style)],
    ]
    
    if analysis.localization:
        report_details_rows.extend([
            [Spacer(1, 6)],
            [Paragraph("<b>LOCALIZATION DETAILS:</b>", body_bold_style)],
            [Paragraph(analysis.localization, body_style)]
        ])
        
    if analysis.notes:
        report_details_rows.extend([
            [Spacer(1, 6)],
            [Paragraph("<b>CLINICAL NOTES:</b>", body_bold_style)],
            [Paragraph(analysis.notes, body_style)]
        ])
        
    report_details_table = Table(report_details_rows, colWidths=[7.5 * inch])
    report_details_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('LINELEFT', (0,0), (-1,-1), 2, SECONDARY_COLOR),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('TOPPADDING', (0,0), (-1,-1), 2),
    ]))
    story.append(report_details_table)
    
    # 5. Page footer / Disclaimer
    story.append(Spacer(1, 35))
    disclaimer_text = (
        "CONFIDENTIAL AND PRIVILEGED MEDICAL REPORT.<br/>"
        "Disclaimer: This report was generated using an artificial intelligence clinical decision-support algorithm. "
        "It provides preliminary findings and must be reviewed, verified, and signed off by a licensed radiologist or medical professional. "
        "MedVision AI is not liable for clinical diagnoses or treatment plans made on the basis of this report."
    )
    story.append(Paragraph(disclaimer_text, footer_style))

    doc.build(story)
    buffer.seek(0)
    return buffer
