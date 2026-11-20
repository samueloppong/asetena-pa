@echo off
REM Build ShelterGH debug APK (requires JDK 21 + Android SDK)
set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-21.0.11.10-hotspot"
set "ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk"
set "ANDROID_SDK_ROOT=%ANDROID_HOME%"
set "PATH=%JAVA_HOME%\bin;%PATH%"

cd /d "%~dp0"
call npm run build:web
if errorlevel 1 exit /b 1
call npx cap sync android
if errorlevel 1 exit /b 1
cd android
call gradlew.bat assembleDebug
if errorlevel 1 exit /b 1
cd ..
if not exist releases mkdir releases
copy /Y "android\app\build\outputs\apk\debug\app-debug.apk" "releases\ShelterGH-debug.apk"
echo.
echo APK ready: %~dp0releases\ShelterGH-debug.apk
