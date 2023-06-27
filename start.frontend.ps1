$CURRENT_PATH = Get-Location
Set-Location -Path ".\application\frontend\"
try {
    npm run start
} finally {
    Set-Location -Path $CURRENT_PATH
}
