echo "start"

apt install libgmp-dev -y

git clone https://github.com/albertobsd/keyhunt.git ~/miningSetup/keyhunt

cd ~/miningSetup/keyhunt

make legacy

cat << EOF > ~/miningSetup/keyhunt/startKeyhunt.sh
#!/bin/sh

# Check if an argument is provided
if [ -z "$1" ]; then
  echo "Usage: ~/miningSetup/keyhunt/startKeyhunt.sh [block number]"
  exit 1
fi

# Store the passed argument in a variable
BLOCK_NUMBER=$1

# Exit existing screens with the name KS (keyhunt screen)
screen -S KS -X quit 1>/dev/null 2>&1
# Wipe any existing (dead) screens
screen -wipe 1>/dev/null 2>&1
# Create new disconnected session KS
screen -dmS KS 1>/dev/null 2>&1
# Run the miner with the provided block number
screen -S KS -X stuff "~/miningSetup/keyhunt/keyhunt -m bsgs -f ~/miningSetup/keyhunt/tests/${BLOCK_NUMBER}.txt -b ${BLOCK_NUMBER} -n 0x400000000000 -k 4096 -t 8 -l compress -s 10 -S -R\n" 1>/dev/null 2>&1
# screen -S KS -X stuff "~/miningSetup/keyhunt/keyhunt -m bsgs -f ~/miningSetup/keyhunt/tests/${BLOCK_NUMBER}.txt -b ${BLOCK_NUMBER} -n 0x400000000000 -k 4096 -t 8 -l compress -s 10 -S\n" 1>/dev/null 2>&1

printf '\nMining started.\n'
printf '===============\n'
printf '\nManual:\n'
printf 'start: ~/miningSetup/keyhunt/startKeyhunt.sh # (start_keyhunt.sh)\n'
printf 'stop: screen -X -S KS quit\n'
printf '\nmonitor mining: screen -x KS\n'
printf "exit monitor: 'CTRL-a' followed by 'd'\n\n"
EOF

chmod +x ~/miningSetup/keyhunt/keyhunt ~/miningSetup/keyhunt/startKeyhunt.sh

# Final output messages
echo "setup nearly complete."

echo "end"
