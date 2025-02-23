#!/bin/bash

echo "start"
echo "Raw DATA: $DATA"

# Parse JSON using jq
name=$(echo "$DATA" | jq -r '.name')
group=$(echo "$DATA" | jq -r '.group')
slot=$(echo "$DATA" | jq -r '.slot')

# Display the parsed values
echo "Parsed DATA:"
echo "name: $name"
echo "group: $group"
echo "slot: $slot"


# Extract the model key from the `name` variable (assuming the pattern before "_" is the key)
model_key=$(echo "$name" | cut -d'_' -f1)

# Declare a mapping
declare -A model_map=(
  ["s7"]="generic"
  ["s7edge"]="generic"
  ["stylo5p"]="a53"
  ["s8"]="a73-a53"
  ["v30"]="a73-a53"
  ["s9"]="a75-a55"
  ["s9p"]="a75-a55"
  ["v35"]="a75-a55"
  ["v40"]="a75-a55"
  ["v50"]="a76-a55"
  ["g8"]="a76-a55"
  ["g8x"]="a76-a55"
  ["velvet"]="a76-a55"
)

# Get the mapped value
mapped_value=${model_map[$model_key]}

# Print or use the new variable
echo "name: $name"
echo "Model Key: $model_key"
echo "Mapped Value: $mapped_value"


# Create the ccminer directory if it doesn't exist
if [ ! -d ~/miningSetup/ccminer ]; then
  mkdir ~/miningSetup/ccminer
fi

# Navigate to the ccminer directory
cd ~/miningSetup/ccminer

wget https://github.com/Oink70/CCminer-ARM-optimized/releases/download/v3.8.3-4/ccminer-3.8.3-4_ARM -P ~/miningSetup/ccminer -O ~/miningSetup/ccminer/ccminerOink70
wget https://raw.githubusercontent.com/Darktron/pre-compiled/$mapped_value/ccminer -P ~/miningSetup/ccminer -O ~/miningSetup/ccminer/ccminerDarktron

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
