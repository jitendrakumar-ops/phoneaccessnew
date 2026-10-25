# Android Build Instructions (Windows)

Due to Windows path length limits (`MAX_PATH` / CMake `CMAKE_OBJECT_PATH_MAX` 250 character limit) with native libraries like `react-native-nitro-modules` and `react-native-vision-camera`, Android native builds must be run from a shortened virtual drive `X:`.

### 1. Map virtual drive X: to project root
```powershell
subst X: "C:\Users\jiten\Desktop\maxify\phoneaccss\phoneaccess"
```
*(To unmount later when done: `subst X: /d`)*

### 2. Clean & Build Release APK
```powershell
cd X:\android
.\gradlew.bat clean
.\gradlew.bat assembleRelease
```

The compiled release APK will be generated at:
`android\app\build\outputs\apk\release\app-release.apk`