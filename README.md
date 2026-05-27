# PPOV Extractor

PPOV Extractor extracts molding/process reference parameters from PPOV PDF files and exports structured Excel or JSON data. The project supports two operating modes:

- **Local Flask app** for PDF folder selection, extraction, and native save dialogs.
- **Static GitHub Pages UI** for reviewing/importing existing master data and exporting formatted spreadsheets in the browser.

## Project Layout

```text
.
|-- app.py                  # Flask API and local web app entrypoint
|-- main.py                 # PDF extraction logic and native dialog helpers
|-- config.json             # Extraction field definitions
|-- index.html              # Static GitHub Pages entrypoint
|-- templates/index.html    # Flask-rendered UI template, kept in sync with index.html
|-- static/                 # Browser JavaScript and CSS
|-- docs/                   # Development and maintenance documentation
|-- .github/workflows/      # GitHub Pages deployment workflow
|-- TestData/               # Local-only sample PDFs and spreadsheets, ignored by Git
`-- output/                 # Local-only generated exports, ignored by Git
```

## Setup

Install Python 3.11+ and dependencies:

```powershell
python -m pip install -r requirements.txt
```

Run the local app:

```powershell
python app.py
```

Then open the printed local URL in a browser. For static preview, open `index.html` directly or use GitHub Pages after deployment.

## Verification

Use these checks before committing:

```powershell
node --check static\app.js
python -m py_compile main.py app.py verify_extraction.py
python verify_extraction.py
```

`verify_extraction.py` expects local sample files under `TestData/`, which are intentionally not tracked in Git.

## Deployment

The GitHub Actions workflow in `.github/workflows/deploy.yml` deploys the repository root to GitHub Pages on pushes to `main`.

The current restore baseline tag is:

```text
restore-baseline-20260527-1000
```

