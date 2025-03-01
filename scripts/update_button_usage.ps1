# PowerShell script to update Button imports and usage

function Update-ButtonImportsAndUsage {
    param (
        [string]$BasePath
    )

    # Find all .tsx files
    $files = Get-ChildItem -Path $BasePath -Recurse -Include *.tsx

    foreach ($file in $files) {
        $content = Get-Content $file.FullName -Raw

        # Update import statements
        $content = $content -replace 'import Button from ''(\.\/|\.\.\/)?[^'']*''', 'import { Button } from ''../components'''
        
        # Replace button usage with new variant prop
        $content = $content -replace '<button\s+type="([^"]*)"([^>]*)>(.*?)</button>', '<Button type="$1" variant="primary"$2>$3</Button>'
        $content = $content -replace '<button\s+([^>]*)>(.*?)</button>', '<Button variant="default" $1>$2</Button>'

        # Write back the modified content
        Set-Content -Path $file.FullName -Value $content
    }
}

Update-ButtonImportsAndUsage -BasePath "c:\Apps\GearShift\src"
Write-Host "Button imports and usage updated across the project."
