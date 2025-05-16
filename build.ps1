$CURRENT_PATH = Get-Location
Set-Location -Path ".\"
try {
    mvn clean install
    ./compile.ps1
} finally {
    Set-Location -Path $CURRENT_PATH
}
