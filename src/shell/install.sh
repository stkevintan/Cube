#!/bin/bash -e
echo "start installation,Please do NOT run in root!"
baseDir=$(cd "$(dirname "$0")"; pwd)
fileName="nwMusicBox.desktop"
filePath="$HOME/.local/share/applications/"
[[ -d "$filePath" ]] || mkdir -p "$filePath"
cp  -f  "$baseDir/$fileName" "$filePath"
sed -i "s@__Exec@$baseDir/nwMusicBox@g; s@__Icon@$baseDir/icon.svg@g" "$filePath/$fileName"
echo "installation completed!"