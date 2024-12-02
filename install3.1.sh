#!/bin/sh

set -e  # Exit immediately if a command exits with a non-zero status

# Update and upgrade the system without manual confirmation
DEBIAN_FRONTEND=noninteractive apt-get -y update
DEBIAN_FRONTEND=noninteractive apt-get -y -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" upgrade

# Install necessary development libraries and utilities
apt-get install -y libcurl4-openssl-dev libjansson-dev libomp-dev git screen nano jq wget nodejs automake autotools-dev build-essential libssl-dev libgmp-dev

# Download and install libssl1.1 manually
wget http://ports.ubuntu.com/pool/main/o/openssl/libssl1.1_1.1.0g-2ubuntu4_arm64.deb
apt-get install -y ./libssl1.1_1.1.0g-2ubuntu4_arm64.deb
rm libssl1.1_1.1.0g-2ubuntu4_arm64.deb

# Create and navigate to the miningSetup directory
mkdir -p ~/miningSetup
cd ~/miningSetup

# Download configuration and status files
wget https://raw.githubusercontent.com/ehtisham94/Android-Mining/refs/heads/main/miningManager.js -P ~/miningSetup

# Write the config.json file
cat << EOF > ~/miningSetup/config.json
{"version": "0.0", "name": "$name", "group": "$group", "slot": $slot}
EOF

# Create startup script
cat << EOF > /etc/profile.d/startMiningManager.sh
nohup node ~/miningSetup/miningManager.js > /dev/null 2>&1 &
EOF

# Make scripts executable
chmod +x ~/miningSetup/miningManager.js /etc/profile.d/startMiningManager.sh

# Source the profile script to apply changes immediately
source /etc/profile.d/startMiningManager.sh

echo "Setup nearly complete."
