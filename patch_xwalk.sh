# copy x86
rm -rf platforms/android/CordovaLib/*
cp -a crosswalk-x86/framework/* platforms/android/CordovaLib
cp crosswalk-x86/VERSION platforms/android

# copy arm
cp -a crosswalk-arm/framework/xwalk_core_library/libs/armeabi-v7a platforms/android/CordovaLib/xwalk_core_library/libs/

# remove guava + jsr305
7z d -tzip platforms/android/CordovaLib/xwalk_core_library/libs/xwalk_core_library_java_library_part.jar com
7z d -tzip platforms/android/CordovaLib/xwalk_core_library/libs/xwalk_core_library_java_library_part.jar javax

# build cordova lib
android update project --subprojects --path platforms/android/CordovaLib --target "android-19" 
cd platforms/android/CordovaLib 
ant debug
