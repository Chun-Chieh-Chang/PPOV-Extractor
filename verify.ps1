# SkillsBuilder Automated Software Validation (確效) Script
$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   SkillsBuilder Software Validation (確效)   " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Environment Mocking for CI (if running in GitHub Actions)
if ($env:GITHUB_ACTIONS -eq "true") {
    Write-Host "[CI DETECTED] Mocking Antigravity environment paths..." -ForegroundColor Yellow
    $mockPath = Join-Path $Home ".gemini\antigravity-ide"
    if (-not (Test-Path $mockPath)) {
        New-Item -ItemType Directory -Path $mockPath -Force | Out-Null
        Write-Host "[SUCCESS] Created mock Antigravity-ide directory at: $mockPath" -ForegroundColor Green
    }
}

# 2. Run the Main Installation & Sync Script
Write-Host "[STEP 1] Running INSTALL.ps1 Sync Engine..." -ForegroundColor Cyan
try {
    # Run in current session to propagate errors correctly
    . .\INSTALL.ps1
    Write-Host "[SUCCESS] INSTALL.ps1 completed with exit code 0!" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] INSTALL.ps1 failed: $_" -ForegroundColor Red
    exit 1
}

# 3. Verify Sync Artifact Integrity
Write-Host "[STEP 2] Verifying Sync Artifact Integrity..." -ForegroundColor Cyan
$pathsToVerify = @()
if (Test-Path "$HOME\.gemini\antigravity") { $pathsToVerify += "$HOME\.gemini\antigravity" }
if (Test-Path "$HOME\.gemini\antigravity-ide") { $pathsToVerify += "$HOME\.gemini\antigravity-ide" }

foreach ($p in $pathsToVerify) {
    Write-Host "[CHECK] Verifying installation path: $p" -ForegroundColor Gray
    $findSkillsPath = Join-Path $p "skills\find-skills\SKILL.md"
    $autoresearchPath = Join-Path $p "skills\autoresearch\SKILL.md"
    
    if (-not (Test-Path $findSkillsPath)) {
        Write-Host "[ERROR] find-skills SKILL.md not found in synced path!" -ForegroundColor Red
        exit 1
    }
    if (-not (Test-Path $autoresearchPath)) {
        Write-Host "[ERROR] autoresearch SKILL.md not found in synced path!" -ForegroundColor Red
        exit 1
    }
}
Write-Host "[SUCCESS] Sync artifact verification passed!" -ForegroundColor Green

# 4. Lint and Validate SKILL.md Frontmatter Formats
Write-Host "[STEP 3] Validating all Skill Metadata Frontmatter..." -ForegroundColor Cyan
$skillsFolders = Get-ChildItem -Path "skills" -Recurse -Filter "SKILL.md"

foreach ($skillFile in $skillsFolders) {
    Write-Host "[LINT] Checking skill formatting: $($skillFile.FullName)" -ForegroundColor Gray
    $content = Get-Content -Path $skillFile.FullName -Raw
    
    # Check that file starts with frontmatter separator
    if (-not ($content -match "^---[\s\S]*?---")) {
        Write-Host "[ERROR] Skill at $($skillFile.FullName) does not start with correct YAML frontmatter '---' separators!" -ForegroundColor Red
        exit 1
    }
    
    # Check for name and description keys
    if (-not ($content -match "name:\s*\S+")) {
        Write-Host "[ERROR] Skill at $($skillFile.FullName) is missing 'name' field in frontmatter!" -ForegroundColor Red
        exit 1
    }
    if (-not ($content -match "description:\s*\S+")) {
        Write-Host "[ERROR] Skill at $($skillFile.FullName) is missing 'description' field in frontmatter!" -ForegroundColor Red
        exit 1
    }
}
Write-Host "[SUCCESS] All skill metadata frontmatter is valid!" -ForegroundColor Green

# 5. Verify LLM Wiki & Schema
Write-Host "[STEP 4] Validating LLM Wiki Structure..." -ForegroundColor Cyan
if (-not (Test-Path "wiki/SCHEMA.md")) {
    Write-Host "[ERROR] wiki/SCHEMA.md is missing!" -ForegroundColor Red
    exit 1
}
if (-not (Test-Path "wiki/index.md")) {
    Write-Host "[ERROR] wiki/index.md is missing!" -ForegroundColor Red
    exit 1
}
Write-Host "[SUCCESS] LLM Wiki structure is valid!" -ForegroundColor Green

Write-Host "=========================================" -ForegroundColor Green
Write-Host "     100% SOFTWARE VALIDATION PASSED     " -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
exit 0
