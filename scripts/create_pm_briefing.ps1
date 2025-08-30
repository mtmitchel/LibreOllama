# PowerShell Script to Create a Briefing Document for Product Managers

# This script gathers all relevant planning, roadmap, and UI audit documents
# into a single text file for easy hand-off to non-technical stakeholders.

# --- Configuration ---
$PSScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Resolve-Path -Path (Join-Path $PSScriptRoot "..")
$OutputFile = Join-Path $ProjectRoot "docs/product_manager_briefing.txt"

# Define the source files. Order matters here.
$SourceFiles = @(
    @{
        Path = "docs/roadmap/README.md";
        Title = "High-Level Project Roadmap"
    },
    @{
        Path = "docs/roadmap"; # This is a directory
        Title = "Detailed Feature Roadmaps"
    },
    @{
        Path = "docs/DESIGN_SYSTEM_AUDIT.md";
        Title = "Design System Implementation Audit"
    },
    @{
        Path = "design/system/overview.md";
        Title = "Core Design System Principles & Overview"
    }
)

# --- Script Execution ---

# Start with a clean file
if (Test-Path $OutputFile) {
    Remove-Item $OutputFile
}

# Add a header to the document
$header = @"
===================================================
    PRODUCT MANAGER BRIEFING DOCUMENT
===================================================

Generated: $(Get-Date)

This document contains a compilation of all relevant
project planning, roadmap, and status documents.
It is intended to provide a comprehensive overview
for decision-making and future planning.

"@
Add-Content -Path $OutputFile -Value $header

# Function to add a section divider
function Add-SectionDivider {
    param(
        [string]$Title
    )
    $divider = @"


---------------------------------------------------
--  $Title
---------------------------------------------------


"@
    Add-Content -Path $OutputFile -Value $divider
}

# Process each source file/directory
foreach ($source in $SourceFiles) {
    Add-SectionDivider -Title $source.Title
    $sourcePath = Join-Path $ProjectRoot $source.Path

    if (Test-Path $sourcePath) {
        if ((Get-Item $sourcePath).PSIsContainer) {
            # It's a directory, so get all .md files inside it
            $roadmapFiles = Get-ChildItem -Path $sourcePath -Filter "*.md" | Sort-Object Name
            foreach ($file in $roadmapFiles) {
                $fileHeader = @"

###
### FILE: $($file.Name)
###

"@
                Add-Content -Path $OutputFile -Value $fileHeader
                Add-Content -Path $OutputFile -Value (Get-Content -Raw -Path $file.FullName)
            }
        } else {
            # It's a single file
            Add-Content -Path $OutputFile -Value (Get-Content -Raw -Path $sourcePath)
        }
    } else {
        Add-Content -Path $OutputFile -Value "Source file not found: $($source.Path)"
    }
}

Write-Host "✅ Successfully created briefing document at:"
Write-Host $OutputFile -ForegroundColor Green 