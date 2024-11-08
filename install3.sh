#!/bin/sh
# Install required Termux packages and set up Ubuntu environment
# pkg install -y termux-api proot proot-distro
# proot-distro install ubuntu
# proot-distro login ubuntu

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

# Set up SSH configuration if not already present
if [ ! -d ~/.ssh ]; then
  mkdir ~/.ssh
  chmod 0700 ~/.ssh
  cat << EOF > ~/.ssh/authorized_keys
ssh-rsa AAAAB3NzaC1yc2EAAAABJQAAAQBy6kORm+ECh2Vp1j3j+3F1Yg+EXNWY07HbP7dLZd/rqtdvPz8uxqWdgKBtyeM7R9AC1MW87zuCmss8GiSp2ZBIcpnr8kdMvYuI/qvEzwfY8pjvi2k3b/EwSP2R6/NqgbHctfVv1c7wL0M7myP9Zj7ZQPx+QV9DscogEEfc968RcV9jc+AgphUXC4blBf3MykzqjCP/SmaNhESr2F/mSxYiD8Eg7tTQ64phQ1oeOMzIzjWkW+P+vLGz+zk32RwmzX5V>
EOF
  chmod 0600 ~/.ssh/authorized_keys
fi

# Create the ccminer directory if it doesn't exist
if [ ! -d ~/ccminer ]; then
  mkdir ~/ccminer
fi

# Navigate to the ccminer directory
cd ~/ccminer

# Fetch the latest ccminer release information and download it
GITHUB_RELEASE_JSON=$(curl --silent "https://api.github.com/repos/Oink70/CCminer-ARM-optimized/releases?per_page=1" | jq -c '[.[] | del (.body)]')
GITHUB_DOWNLOAD_URL=$(echo $GITHUB_RELEASE_JSON | jq -r ".[0].assets[0].browser_download_url")
GITHUB_DOWNLOAD_NAME=$(echo $GITHUB_RELEASE_JSON | jq -r ".[0].assets[0].name")

echo "Downloading latest release: $GITHUB_DOWNLOAD_NAME"
wget ${GITHUB_DOWNLOAD_URL} -P ~/ccminer

# Check and handle existing config.json file
if [ -f ~/ccminer/config.json ]; then
  INPUT=
  while [ "$INPUT" != "y" ] && [ "$INPUT" != "n" ]; do
    printf '"~/ccminer/config.json" already exists. Do you want to overwrite? (y/n) '
    read INPUT
    if [ "$INPUT" = "y" ]; then
      echo "\noverwriting current \"~/ccminer/config.json\"\n"
      rm ~/ccminer/config.json
    elif [ "$INPUT" = "n" ]; then
      echo "saving as \"~/ccminer/config.json.#\""
    else
      echo 'Invalid input. Please answer with "y" or "n".\n'
    fi
  done
fi

# Download configuration and status files
wget https://raw.githubusercontent.com/ehtisham94/Android-Mining/main/config.json -P ~/ccminer
wget https://raw.githubusercontent.com/ehtisham94/Android-Mining/main/sendBatteryStatus.js -P ~/ccminer

# Rename the downloaded ccminer binary and set permissions
if [ -f ~/ccminer/ccminer ]; then
  mv ~/ccminer/ccminer ~/ccminer/ccminer_old
fi
mv ~/ccminer/${GITHUB_DOWNLOAD_NAME} ~/ccminer/ccminer
chmod +x ~/ccminer/ccminer

cat << EOF > ~/ccminer/start.sh
#!/bin/sh
# Exit any existing screen sessions with the name CCminer
screen -S CCminer -X quit 1>/dev/null 2>&1
# Clean up any dead screen sessions
screen -wipe 1>/dev/null 2>&1
# Create a new detached screen session named CCminer
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

# Final output messages
echo "setup nearly complete."
echo "Edit the config with \"nano ~/ccminer/config.json\""

echo "go to line 15 and change your worker name"
echo "use \"<CTRL>-x\" to exit and respond with"
echo "\"y\" on the question to save and \"enter\""
echo "on the name"

echo "start the miner with \"cd ~/ccminer; ./start.sh\"."
