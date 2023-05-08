<<<<<<< HEAD
mvn clean install
=======
$CURRENT_PATH = Get-Location
Set-Location -Path ".\"
try {
    mvn clean install
} finally {
    Set-Location -Path $CURRENT_PATH
}
>>>>>>> develop
