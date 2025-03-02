# PowerShell script to apply Supabase migration

# Check if Supabase CLI is installed
$supabaseCLI = Get-Command supabase -ErrorAction SilentlyContinue

if (-not $supabaseCLI) {
    Write-Host "Supabase CLI is not installed. Please install it using:" -ForegroundColor Yellow
    Write-Host "npm install -g supabase-cli" -ForegroundColor Cyan
    exit 1
}

# Navigate to the project directory
Set-Location $PSScriptRoot

# Check if .env file exists
if (-not (Test-Path .env)) {
    Write-Host "No .env file found. Please configure your Supabase project." -ForegroundColor Red
    exit 1
}

# Load environment variables
$envContent = Get-Content .env
foreach ($line in $envContent) {
    if ($line -match "^([^=]+)=(.*)$") {
        $key = $matches[1]
        $value = $matches[2]
        [Environment]::SetEnvironmentVariable($key, $value)
    }
}

# Verify required environment variables
if (-not $env:SUPABASE_URL -or -not $env:SUPABASE_SERVICE_ROLE_KEY) {
    Write-Host "Missing Supabase URL or Service Role Key in .env file." -ForegroundColor Red
    exit 1
}

# Apply migration
try {
    supabase migration up
    Write-Host "Migration applied successfully!" -ForegroundColor Green
}
catch {
    Write-Host "Error applying migration: $_" -ForegroundColor Red
    exit 1
}
