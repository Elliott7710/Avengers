from pathlib import Path

import fitz


source = Path("attached_assets/Domain_2_1792726447836.pdf")
output_dir = Path(".agents/outputs/domain-assignment")
output_dir.mkdir(parents=True, exist_ok=True)

document = fitz.open(source)
for page_number, page in enumerate(document, start=1):
    pixmap = page.get_pixmap(matrix=fitz.Matrix(0.7, 0.7), alpha=False)
    pixmap.save(output_dir / f"page-{page_number:02d}.png")

print(f"Rendered {document.page_count} pages to {output_dir}")
