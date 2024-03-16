#!/bin/sh
pkg update -y && pkg upgrade -y
pkg install -y libjansson wget nano screen nodejs termux-api

if [ ! -d ~/ccminer ]
then
  mkdir ~/ccminer
fi
cd ~/ccminer

wget https://raw.githubusercontent.com/ehtisham94/Android-Mining/main/config.json -P ~/ccminer
wget https://raw.githubusercontent.com/ehtisham94/Android-Mining/main/sendBatteryStatus.js -P ~/ccminer

cat << EOF > ~/ccminer/start.sh
#!/bin/sh
#exit existing screens with the name CCminer
screen -S CCminer -X quit 1>/dev/null 2>&1
#wipe any existing (dead) screens)
screen -wipe 1>/dev/null 2>&1
#create new disconnected session CCminer
screen -dmS CCminer 1>/dev/null 2>&1
#stop uploading battery status
# pkill -f 'sendBatteryStatus.js'
# upload battery status
# nohup node ~/ccminer/sendBatteryStatus.js > /dev/null 2>&1 &
#run the miner
screen -S CCminer -X stuff "~/ccminer/ccminer -c ~/ccminer/config.json\n" 1>/dev/null 2>&1
printf '\nMining started.\n'
printf '===============\n'
printf '\nManual:\n'
printf 'start: ~/.ccminer/start.sh\n'
printf 'stop: screen -X -S CCminer quit\n'
printf '\nmonitor mining: screen -x CCminer\n'
printf "exit monitor: 'CTRL-a' followed by 'd'\n\n"
printf "stop uploading battery status: pkill -f 'sendBatteryStatus.js'"
EOF
chmod +x start.sh

echo "setup nearly complete."
echo "Edit the config with \"nano ~/ccminer/config.json\""

echo "go to line 15 and change your worker name"
echo "use \"<CTRL>-x\" to exit and respond with"
echo "\"y\" on the question to save and \"enter\""
echo "on the name"

echo "start the miner with \"cd ~/ccminer; ./start.sh\"."
