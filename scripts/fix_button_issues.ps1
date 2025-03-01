# PowerShell script to fix Button import and usage issues across the project

# Function to update Button imports and usage in a file
function Update-ButtonFile {
    param (
        [string]$FilePath
    )
    
    Write-Host "Processing $FilePath..."
    
    # Read file content
    $content = Get-Content -Path $FilePath -Raw
    
    # Fix imports
    if ($content -match 'import\s+{\s*Button\s*}\s+from\s+''\.\/Button''') {
        $content = $content -replace 'import\s+{\s*Button\s*}\s+from\s+''\.\/Button''', 'import { Button } from ''../components'''
        Write-Host "  Fixed Button import in $FilePath"
    }
    elseif ($content -match 'import\s+Button\s+from\s+''\.\/Button''') {
        $content = $content -replace 'import\s+Button\s+from\s+''\.\/Button''', 'import { Button } from ''../components'''
        Write-Host "  Fixed Button import in $FilePath"
    }
    
    # Remove unused Button imports
    if ($content -match 'import\s+{\s*Button\s*}\s+from' -and $content -notmatch '<Button') {
        $content = $content -replace 'import\s+{\s*Button\s*}\s+from\s+''[^'']*'';\r?\n', ''
        Write-Host "  Removed unused Button import in $FilePath"
    }
    
    # Replace native buttons with Button component
    $content = $content -replace '<button([^>]*)(variant="[^"]*")([^>]*)>', '<Button$1$3>'
    $content = $content -replace '</button>', '</Button>'
    
    # Fix duplicate variant attributes
    $content = $content -replace '(<Button[^>]*)(variant="[^"]*")([^>]*)(variant="[^"]*")([^>]*>)', '$1$2$3$5'
    
    # Write updated content back to file
    Set-Content -Path $FilePath -Value $content -NoNewline
}

# Function to fix the components/index.ts file
function Fix-ComponentsIndex {
    $indexPath = "c:\Apps\GearShift\src\components\index.ts"
    $content = Get-Content -Path $indexPath -Raw
    
    # Update export statement to use 'export type' for types
    $content = $content -replace 'export\s+{\s*Button,\s*ButtonProps,\s*ButtonVariant\s*}\s+from', 'export { Button } from'
    $content = "export type { ButtonProps, ButtonVariant } from './Button';" + [Environment]::NewLine + $content
    
    Set-Content -Path $indexPath -Value $content -NoNewline
    Write-Host "Fixed components/index.ts"
}

# Main script
$srcPath = "c:\Apps\GearShift\src"

# Get all TSX files
$tsxFiles = Get-ChildItem -Path $srcPath -Recurse -Include "*.tsx" | Where-Object { $_.FullName -ne "c:\Apps\GearShift\src\components\Button.tsx" }

# Process each file
foreach ($file in $tsxFiles) {
    Update-ButtonFile -FilePath $file.FullName
}

# Fix components/index.ts
Fix-ComponentsIndex

Write-Host "Button import and usage issues fixed across the project."
