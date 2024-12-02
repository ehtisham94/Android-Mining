#!/bin/sh

set -e  # Exit immediately if a command exits with a non-zero status

# # Update and upgrade the system without manual confirmation
# DEBIAN_FRONTEND=noninteractive apt-get -y update
# DEBIAN_FRONTEND=noninteractive apt-get -y -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" upgrade

# # Install necessary development libraries and utilities
# apt-get install -y libjansson

rm ~/miningSetup/ccminer/startOink70.sh ~/miningSetup/ccminer/startDarktron.sh

cat << EOF > ~/miningSetup/ccminer/startOink70.sh
#!/bin/sh
# Exit any existing screen sessions with the name CCMO
screen -S CCMO -X quit 1>/dev/null 2>&1
# Clean up any dead screen sessions
screen -wipe 1>/dev/null 2>&1
# Create a new detached screen session named CCMO
screen -dmS CCMO 1>/dev/null 2>&1
#run the miner
screen -S CCMO -X stuff "~/miningSetup/ccminer/ccminerOink70 -c ~/miningSetup/config.json\n" 1>/dev/null 2>&1
printf '\nMining started.\n'
printf '===============\n'
printf '\nManual:\n'
printf 'start: ~/miningSetup/ccminer/startOink70.sh\n'
printf 'stop: screen -X -S CCMO quit\n'
printf '\nmonitor mining: screen -x CCMO\n'
printf "exit monitor: 'CTRL-a' followed by 'd'\n\n"
EOF

cat << EOF > ~/miningSetup/ccminer/startDarktron.sh
#!/bin/sh
# Exit any existing screen sessions with the name CCMD
screen -S CCMD -X quit 1>/dev/null 2>&1
# Clean up any dead screen sessions
screen -wipe 1>/dev/null 2>&1
# Create a new detached screen session named CCMD
screen -dmS CCMD 1>/dev/null 2>&1
#run the miner
screen -S CCMD -X stuff "~/miningSetup/ccminer/ccminerDarktron -c ~/miningSetup/config.json\n" 1>/dev/null 2>&1
printf '\nMining started.\n'
printf '===============\n'
printf '\nManual:\n'
printf 'start: ~/miningSetup/ccminer/startDarktron.sh\n'
printf 'stop: screen -X -S CCMD quit\n'
printf '\nmonitor mining: screen -x CCMD\n'
printf "exit monitor: 'CTRL-a' followed by 'd'\n\n"
EOF

chmod +x ~/miningSetup/ccminer/ccminerOink70 ~/miningSetup/ccminer/ccminerDarktron ~/miningSetup/ccminer/startOink70.sh ~/miningSetup/ccminer/startDarktron.sh

# Final output messages
echo "setup nearly complete."

echo "end"
