# PowerShell script to fix button JSX closing tags

# List of files with JSX closing tag issues
$filesToFix = @(
    "c:\Apps\GearShift\src\components\DocumentView.tsx",
    "c:\Apps\GearShift\src\components\MaintenanceView.tsx",
    "c:\Apps\GearShift\src\components\calendar\ListView.tsx",
    "c:\Apps\GearShift\src\pages\Documents.tsx",
    "c:\Apps\GearShift\src\pages\ExpenseTracker.tsx",
    "c:\Apps\GearShift\src\pages\Login.tsx"
)

# Function to fix button tags in a file
function Fix-ButtonTags {
    param (
        [string]$FilePath
    )
    
    Write-Host "Processing $FilePath..."
    
    # Read file content
    $content = Get-Content -Path $FilePath -Raw
    
    # Import Button component if not already imported
    if ($content -notmatch 'import\s+{\s*Button\s*}\s+from\s+''[^'']*''') {
        $content = $content -replace '(import\s+[^;]*;\r?\n)', '$1import { Button } from ''../components'';\r\n'
        Write-Host "  Added Button import to $FilePath"
    }
    
    # Fix button opening and closing tags
    $content = $content -replace '<button(\s+[^>]*)>', '<Button$1 variant="default">'
    $content = $content -replace '</button>', '</Button>'
    
    # Write updated content back to file
    Set-Content -Path $FilePath -Value $content -NoNewline
    Write-Host "  Fixed button tags in $FilePath"
}

# Process each file
foreach ($file in $filesToFix) {
    Fix-ButtonTags -FilePath $file
}

Write-Host "Button JSX closing tag issues fixed."
