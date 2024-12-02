#!/bin/sh


# Update and upgrade the system without manual confirmation
DEBIAN_FRONTEND=noninteractive apt-get -y update
DEBIAN_FRONTEND=noninteractive apt-get -y -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" upgrade

# Install necessary development libraries and utilities
# need to add this libssl-dev automake autotools-dev build-essential
apt-get install -y libcurl4-openssl-dev libjansson-dev libomp-dev git screen nano jq wget nodejs

# Download and install libssl1.1 manually, ensuring dependencies are handled
wget http://ports.ubuntu.com/pool/main/o/openssl/libssl1.1_1.1.0g-2ubuntu4_arm64.deb
dpkg -i libssl1.1_1.1.0g-2ubuntu4_arm64.deb
apt-get -f install  # Resolve any dependency issues after dpkg

# Clean up the downloaded .deb file
rm libssl1.1_1.1.0g-2ubuntu4_arm64.deb


# Create the miningSetup directory if it doesn't exist
if [ ! -d ~/miningSetup ]; then
  mkdir ~/miningSetup
fi

# Navigate to the miningSetup directory
cd ~/miningSetup

# Download configuration and status files
wget https://raw.githubusercontent.com/ehtisham94/Android-Mining/refs/heads/main/miningManager.js -P ~/miningSetup

cat << EOF > ~/miningSetup/config.json
{"version": "0.0", "name": "$name", "group": "$group", "slot": $slot}
EOF

cd

cat << EOF > /etc/profile.d/startMiningManager.sh
nohup node ~/miningSetup/miningManager.js > /dev/null 2>&1 &
EOF

chmod +x ~/miningSetup/miningManager.js /etc/profile.d/startMiningManager.sh

# Final output messages
echo "setup nearly complete."
