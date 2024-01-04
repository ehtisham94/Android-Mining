const { exec } = require('child_process');
const fs = require('fs');

const apiUrl = 'https://battery-status.onrender.com/segment'; // Replace with your API endpoint

let sendingIntervel = 10 // in minutes

const dataToSend = {
    name: '',
    group: '',
    slot: -1,
    batteryStatusNow: '',
    batteryStatusBefore: '',
    batteryPercentageNow: -1,
    batteryPercentageBefore: -1,
};

fs.readFile('./ccminer/config.json', 'utf8', (err, data) => {
    if (err) {
      console.error(`Error reading the file: ${err.message}`);
      return;
    }
  
    try {
      // Parse the JSON data
      const jsonData = JSON.parse(data);
      dataToSend.name = jsonData.user.split('.')[1]
      dataToSend.group = jsonData.group
      dataToSend.slot = jsonData.slot
      sendingIntervel = jsonData.sendingIntervel
      console.log('Parsed JSON data:', jsonData);
      setInterval(() => {
        getBatteryStatus()
        .then((batteryInfo) => {
            // console.log(`batteryInfo: ${batteryInfo}`);
            dataToSend.batteryStatusNow = batteryInfo.status
            dataToSend.batteryPercentageNow = batteryInfo.percentage
            dataToSend.batteryStatusBefore += ` - ${batteryInfo.health}`
            sendRequest()
        })
        .catch((error) => {
            // console.log(`batteryInfo-error: ${error}`);
            dataToSend.batteryStatusNow = 'error'
            dataToSend.batteryPercentageNow = 'error'
            sendRequest()
        });
    }, sendingIntervel * 60000);
    } catch (parseError) {
      console.error(`Error parsing JSON: ${parseError.message}`);
    }

  });

function getBatteryStatus() {
  return new Promise((resolve, reject) => {
    exec('termux-battery-status', (error, stdout, stderr) => {
      if (error) {
        reject(`Error executing termux-battery-status: ${error.message}`);
        return;
      }
      if (stderr) {
        reject(`termux-battery-status returned an error: ${stderr}`);
        return;
      }

      try {
        const batteryStatus = JSON.parse(stdout);
        resolve(batteryStatus);
      } catch (parseError) {
        reject(`Error parsing JSON: ${parseError.message}`);
      }
    });
  });
}


function sendRequest() {
    fetch(apiUrl, {
        method: 'POST',
        body: JSON.stringify(dataToSend),
        headers: {
            'Content-type': 'application/json; charset=UTF-8',
        },
    })
        .then((response) => response.json())
        .then((json) => {
            dataToSend.batteryStatusBefore = dataToSend.batteryStatusNow
            dataToSend.batteryPercentageBefore = dataToSend.batteryPercentageNow
        })
        .catch(error => {
            // console.log(error)
        })
}
