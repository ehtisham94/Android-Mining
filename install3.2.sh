#!/bin/sh


# Create the boot directory if it doesn't exist
if [ ! -d ~/.termux/boot ]; then
  mkdir ~/.termux/boot
fi

# Navigate to the miningSetup directory
cd ~/.termux/boot

cat << EOF > ~/.termux/boot/startUbuntu.sh
sshd
termux-wake-lock
proot-distro login ubuntu
EOF

chmod +x ~/.termux/boot/startUbuntu.sh
