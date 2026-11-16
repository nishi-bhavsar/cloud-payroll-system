
import calendar
from datetime import datetime
from decimal import Decimal
from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

COMPANY_NAME = "Cloud Payroll Management System"

PRIMARY = colors.HexColor("#1e3a8a")
LIGHT = colors.HexColor("#eff6ff")
BORDER = colors.HexColor("#cbd5e1")
RED = colors.HexColor("#dc2626")


def money(value):
    value = value if value is not None else Decimal("0.00")
    return f"Rs. {value:,.2f}"


def generate_payslip_pdf(payroll):

    buffer = BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=20 * mm,
        rightMargin=20 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
        title="Employee Payslip",
    )

    styles = getSampleStyleSheet()

    company_style = ParagraphStyle(
        "Company",
        parent=styles["Title"],
        fontSize=18,
        textColor=PRIMARY,
        alignment=1,
        spaceAfter=5,
    )

    sub_style = ParagraphStyle(
        "Sub",
        parent=styles["Normal"],
        alignment=1,
        fontSize=11,
        textColor=colors.HexColor("#475569"),
    )

    foot_style = ParagraphStyle(
        "Foot",
        parent=styles["Normal"],
        alignment=1,
        fontSize=8,
        textColor=colors.HexColor("#64748b"),
    )

    employee = payroll.employee

    department = (
        employee.department.name
        if employee.department
        else "-"
    )

    month_name = calendar.month_name[payroll.month]

    # Salary calculations
    basic = payroll.basic_salary or Decimal("0.00")
    allowance = payroll.allowance or Decimal("0.00")
    bonus = payroll.bonus or Decimal("0.00")

    normal_deduction = (
        payroll.deduction or Decimal("0.00")
    )

    unpaid_leave_deduction = (
        payroll.unpaid_leave_deduction or Decimal("0.00")
    )

    gross_salary = (
        payroll.gross_salary or Decimal("0.00")
    )

    total_deductions = (
        normal_deduction + unpaid_leave_deduction
    )

    net_salary = gross_salary - total_deductions

    story = [
        Paragraph(COMPANY_NAME, company_style),

        Paragraph(
            f"Payslip for {month_name} {payroll.year}",
            sub_style
        ),

        Spacer(1, 10 * mm),
    ]

    # Employee information
    details = Table(
        [
            [
                "Employee Name",
                f"{employee.first_name} {employee.last_name}",
                "Employee Code",
                employee.employee_code,
            ],
            [
                "Department",
                department,
                "Designation",
                employee.designation or "-",
            ],
            [
                "Date of Joining",
                employee.joining_date.strftime("%d %b %Y")
                if employee.joining_date else "-",
                "Pay Period",
                f"{month_name} {payroll.year}",
            ],
        ],
        colWidths=[
            34 * mm,
            54 * mm,
            32 * mm,
            50 * mm,
        ],
    )

    details.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (2, 0), (2, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("BOX", (0, 0), (-1, -1), 0.7, BORDER),
        ("INNERGRID", (0, 0), (-1, -1), 0.3, BORDER),
        ("BACKGROUND", (0, 0), (0, -1), LIGHT),
        ("BACKGROUND", (2, 0), (2, -1), LIGHT),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))

    story += [
        details,
        Spacer(1, 8 * mm),
    ]

    # Earnings and deductions
    salary_table = Table(
        [
            [
                "EARNINGS",
                "AMOUNT",
                "DEDUCTIONS",
                "AMOUNT",
            ],
            [
                "Basic Salary",
                money(basic),
                "Other Deductions",
                money(normal_deduction),
            ],
            [
                "Allowance",
                money(allowance),
                f"Unpaid Leave ({payroll.unpaid_leave_days} days)",
                money(unpaid_leave_deduction),
            ],
            [
                "Bonus",
                money(bonus),
                "",
                "",
            ],
            [
                "GROSS EARNINGS",
                money(gross_salary),
                "TOTAL DEDUCTIONS",
                money(total_deductions),
            ],
        ],
        colWidths=[
            42 * mm,
            43 * mm,
            42 * mm,
            43 * mm,
    ])

    salary_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), PRIMARY),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),

        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),

        ("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold"),

        ("BACKGROUND", (0, -1), (-1, -1), LIGHT),

        ("TEXTCOLOR", (2, 1), (2, -2), RED),

        ("FONTSIZE", (0, 0), (-1, -1), 8),

        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("ALIGN", (3, 0), (3, -1), "RIGHT"),

        ("BOX", (0, 0), (-1, -1), 0.7, BORDER),
        ("INNERGRID", (0, 0), (-1, -1), 0.3, BORDER),

        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),

        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))

    story += [
        salary_table,
        Spacer(1, 8 * mm),
    ]

    # Net salary
    net_table = Table(
        [
            [
                "NET SALARY PAYABLE",
                money(net_salary),
            ]
        ],
        colWidths=[85 * mm, 85 * mm],
    )

    net_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), PRIMARY),
        ("TEXTCOLOR", (0, 0), (-1, -1), colors.white),
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 12),
        ("ALIGN", (1, 0), (1, 0), "RIGHT"),
        ("TOPPADDING", (0, 0), (-1, -1), 12),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
    ]))

    story += [
        net_table,
        Spacer(1, 12 * mm),

        Paragraph(
            "Net Salary = Gross Earnings - Total Deductions",
            foot_style
        ),

        Spacer(1, 3 * mm),

        Paragraph(
            "This is a computer-generated payslip "
            "and does not require a signature.",
            foot_style
        ),

        Paragraph(
            f"Generated on {datetime.now():%d %b %Y, %I:%M %p}",
            foot_style
        ),
    ]

    doc.build(story)

    buffer.seek(0)

    return buffer
