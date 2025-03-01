# Find and replace Button imports across the project
Get-ChildItem -Path "c:\Apps\GearShift\src" -Recurse -Include *.tsx | ForEach-Object {
    $content = Get-Content $_.FullName -Raw

    # Replace various import patterns
    $content = $content -replace 'import Button from ''(\./|\.\./)?components/Button''', 'import { Button } from ''../components'''
    $content = $content -replace 'import Button from ''(\./|\.\./)?Button''', 'import { Button } from ''../components'''
    
    # Remove duplicate imports
    $content = $content -replace '(import { Button } from ''../components'';)\s*\1', '$1'

    # Ensure unique import
    if ($content -match 'import Button') {
        $content = $content -replace 'import Button', 'import { Button }'
    }

    # Write back the modified content
    Set-Content -Path $_.FullName -Value $content
}

Write-Host "Button import updates completed."
