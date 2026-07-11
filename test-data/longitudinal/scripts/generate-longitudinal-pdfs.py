from __future__ import annotations

import json
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / "expected.json").read_text(encoding="utf-8"))


def flag_label(flag: str) -> str:
    return {
        "low": "BAJO",
        "normal": "DENTRO",
        "high": "ALTO",
        "unknown": "SIN CLASIFICAR",
    }.get(flag, flag.upper())


def as_text(report: dict) -> str:
    lines = [
        "VITAMAP - DOCUMENTO SINTETICO LONGITUDINAL",
        "FICTICIO - NO CORRESPONDE A UNA PERSONA REAL",
        "NO USAR PARA DECISIONES MEDICAS",
        "",
        f"Laboratorio: {report['lab_name']}",
        f"Fecha de muestra: {report['observed_at']}",
        "",
        "ANALITICA DE SEGUIMIENTO",
        "",
        f"{'Parametro':28} {'Resultado':>10} {'Unidad':>12} {'Rango':>16} {'Indicador':>14}",
    ]
    for marker in report["markers"]:
        lines.append(
            f"{marker['name'][:28]:28} {marker['value']:>10} {marker['unit']:>12} "
            f"{marker['reference_range']:>16} {flag_label(marker['flag']):>14}"
        )
    lines.extend(
        [
            "",
            "Observacion:",
            "Documento creado exclusivamente para verificar el flujo tecnico de VitaMap.",
            "Todos los datos, fechas, valores y nombres de laboratorio son ficticios.",
        ]
    )
    return "\n".join(lines) + "\n"


def build_pdf(report: dict, destination: Path) -> None:
    doc = SimpleDocTemplate(
        str(destination),
        pagesize=A4,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=16 * mm,
        bottomMargin=16 * mm,
        pageCompression=1,
        title=f"{report['id']} - synthetic VitaMap fixture",
        author="VitaMap synthetic test suite",
    )
    styles = getSampleStyleSheet()
    story = [
        Paragraph("VITAMAP - DOCUMENTO SINTETICO LONGITUDINAL", styles["Title"]),
        Spacer(1, 3 * mm),
        Paragraph("FICTICIO - NO CORRESPONDE A UNA PERSONA REAL", styles["Heading2"]),
        Paragraph("NO USAR PARA DECISIONES MEDICAS", styles["Heading2"]),
        Spacer(1, 6 * mm),
        Paragraph(f"<b>Laboratorio:</b> {report['lab_name']}", styles["BodyText"]),
        Paragraph(f"<b>Fecha de muestra:</b> {report['observed_at']}", styles["BodyText"]),
        Spacer(1, 6 * mm),
        Paragraph("ANALITICA DE SEGUIMIENTO", styles["Heading2"]),
        Spacer(1, 2 * mm),
    ]

    rows = [["Parametro", "Resultado", "Unidad", "Rango", "Indicador"]]
    for marker in report["markers"]:
        rows.append(
            [
                marker["name"],
                str(marker["value"]),
                marker["unit"],
                marker["reference_range"],
                flag_label(marker["flag"]),
            ]
        )
    table = Table(rows, colWidths=[62 * mm, 25 * mm, 25 * mm, 31 * mm, 28 * mm], repeatRows=1)
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E8EEE4")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#263322")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 8.5),
                ("ALIGN", (1, 1), (1, -1), "RIGHT"),
                ("ALIGN", (2, 0), (-1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#AEB8A8")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F7F8F5")]),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    story.extend(
        [
            table,
            Spacer(1, 7 * mm),
            Paragraph("<b>Observacion</b>", styles["Heading3"]),
            Paragraph(
                "Documento creado exclusivamente para verificar el flujo tecnico de VitaMap. "
                "Todos los datos, fechas, valores y nombres de laboratorio son ficticios.",
                styles["BodyText"],
            ),
        ]
    )
    def paint_page(canvas, _doc) -> None:
        # Fondo explicito: evita que renderizadores con alfa compongan la pagina
        # transparente sobre negro durante la inspeccion visual.
        canvas.saveState()
        canvas.setFillColor(colors.white)
        canvas.rect(0, 0, A4[0], A4[1], fill=1, stroke=0)
        canvas.restoreState()

    doc.build(story, onFirstPage=paint_page, onLaterPages=paint_page)


def main() -> None:
    for report in DATA["reports"]:
        stem = report["id"]
        (ROOT / f"{stem}.txt").write_text(as_text(report), encoding="utf-8")
        build_pdf(report, ROOT / f"{stem}.pdf")
        print(f"generated {stem}.txt and {stem}.pdf")


if __name__ == "__main__":
    main()
