$CURRENT_PATH = Get-Location
Set-Location -Path ".\environment\local\"
try {
    docker compose stop
} finally {
    Set-Location -Path $CURRENT_PATH
}
