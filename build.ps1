$CURRENT_PATH = Get-Location
Set-Location -Path ".\distribution\"
try {
    mvn clean install
} finally {
    Set-Location -Path $CURRENT_PATH
}
