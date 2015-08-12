rm -rf ./plugins/com.latincoin.BitsharesPlugin/
mkdir ./plugins/com.latincoin.BitsharesPlugin/
cp -r ../cordova-plugin-bitwallet/ ./plugins/com.latincoin.BitsharesPlugin/ 

rm -rf ./platforms/ios/LimeWallet/Plugins/com.latincoin.BitsharesPlugin/
mkdir ./platforms/ios/LimeWallet/Plugins/com.latincoin.BitsharesPlugin/
cp -r ../cordova-plugin-bitwallet/src/ios/*.* ./platforms/ios/LimeWallet/Plugins/com.latincoin.BitsharesPlugin/
cp  ../cordova-plugin-bitwallet/src/ios/src/*.* ./platforms/ios/LimeWallet/Plugins/com.latincoin.BitsharesPlugin/
cp  ../cordova-plugin-bitwallet/src/ios/src/RNCryptor/*.* ./platforms/ios/LimeWallet/Plugins/com.latincoin.BitsharesPlugin/
cp  ../cordova-plugin-bitwallet/src/ios/src/RNOpenSSLCryptor/*.* ./platforms/ios/LimeWallet/Plugins/com.latincoin.BitsharesPlugin/
rm ./platforms/ios/LimeWallet/Plugins/com.latincoin.BitsharesPlugin/test.m
rm -rf ./platforms/ios/LimeWallet/Plugins/com.latincoin.BitsharesPlugin/TestPlugin/
# cp ../cordova-plugin-bitwallet/www/BitsharesPlugin.js ./www/BitsharesPlugin.js
# cp ../cordova-plugin-bitwallet/src/BitsharesPlugin_impl.h
# BitsharesPlugin_impl.m
# BitsharesPlugin.h
# BitsharesPlugin.m
# skip32.c
