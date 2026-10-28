param(
    [Parameter(Position = 0)]
    [ValidateSet("test", "api")]
    [string]$Target = "test"
)
$ErrorActionPreference = "Stop"
Set-Location (Split-Path $PSScriptRoot -Parent)
$env:PYTHONIOENCODING = "utf-8"
if ($Target -eq "test") {
    python -m pytest
} else {
    python -m uvicorn labs.pagination.server:create_app --factory --port 8090
}
