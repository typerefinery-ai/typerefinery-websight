

# use 7zip to compile distribution/target/artifacts/* into distribution/cms.7z with 50mb split

# folder with files for cache 
$cacheFolder = "distribution/target/artifacts"
# folder for bin files
$binFolder = "distribution\tools\sling\bin"



# launcher jar
$launcherJar = "distribution\tools\sling\org.apache.sling.feature.launcher.jar"
$launcherJarOutputName = "org.apache.sling.feature.launcher.jar"

# check if launcher jar exists
if (-not (Test-Path $launcherJar)) {
    Write-Host "Launcher jar not found at $launcherJar"
    exit
} else {
    # resolve launcher jar path
    $launcherJar = Resolve-Path $launcherJar
    Write-Host "Launcher jar found at $launcherJar"
}

# create temp folder for architeve content
$tempFolder = "distribution/target/service-archive"
# move cache files to temp folder `cache` dir
$cacheDir = "$tempFolder/cache"
# move bin files to temp folder `bin` dir
$binDir = "$tempFolder/bin"
# move launcher jar to temp folder `bin` dir
$launcherJarDir = "$tempFolder"
# output archive name
$archiveName = "cms.7z"
# split size
$splitSize = "50m"

# 7zip path
$sevenZipPath = "distribution\tools\7zip\7z.exe"

# test if 7zip is installed
if (-not (Test-Path $sevenZipPath)) {
    Write-Host "7zip not found at $sevenZipPath"
    exit
} else {
    # resolve 7zip path
    $sevenZipPath = Resolve-Path $sevenZipPath
    Write-Host "7zip found at $sevenZipPath"
}

# check if temp folder exists
Write-Host "Checking if temp folder exists: $tempFolder"
if (Test-Path $tempFolder) {
    Write-Host "Temp folder exists, removing..."
    # remove temp folder
    Remove-Item -Recurse -Force $tempFolder | Out-Null
} else {
    Write-Host "Temp folder does not exist, creating..."
    New-Item -ItemType Directory -Path $tempFolder | Out-Null
}

# copy cache files into temp/cache dir
Write-Host "Copying cache files to $cacheDir"
New-Item -ItemType Directory -Path $cacheDir | Out-Null
Copy-Item -Path "$cacheFolder/*" -Destination $cacheDir -Recurse | Out-Null
# copy bin files into temp/bin dir
Write-Host "Copying bin files to $binDir"
New-Item -ItemType Directory -Path $binDir | Out-Null
Copy-Item -Path "$binFolder/*" -Destination $binDir -Recurse | Out-Null
# copy launcher jar into temp and rename it to launcherJarOutputName
Write-Host "Copying launcher jar to $launcherJarDir"
Copy-Item -Path $launcherJar -Destination "$launcherJarDir\$launcherJarOutputName" -Force | Out-Null

# create archive with 7zip using
Push-Location $tempFolder
#$sevenZipCommand = "$sevenZipPath a -v$splitSize -mx=9 -m0=lzma2 -mmt=on $outputArchiveSplit $tempFolder\*"
$sevenZipCommand = "& `"$sevenZipPath`" a -v$splitSize -mx=9 -m0=lzma2 -mmt=on `"$archiveName`" *"

Write-Host "Running command: $sevenZipCommand"
Invoke-Expression $sevenZipCommand

Pop-Location
