const { exec } = require('child_process');
const fs = require('fs');
const http = require('http');

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

fs.readFile('./config.json', 'utf8', (err, data) => {
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
      config.sendingIntervel = jsonData.sendingIntervel
      console.log('Parsed JSON data:', jsonData);
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
    const req = http.request(apiUrl, {method: 'POST', headers: {'Content-Type': 'application/json'}}, (res) => {
    
      res.on('end', () => {
        dataToSend.batteryStatusBefore = dataToSend.batteryStatusNow
        dataToSend.batteryPercentageBefore = dataToSend.batteryPercentageNow
      });
    });
    
    req.on('error', (error) => {
      console.error('Error:', error.message);
    });
    
    // Send the POST request with the data
    req.write(JSON.stringify(dataToSend));
    req.end();
}


setInterval(() => {
    getBatteryStatus()
    .then((batteryInfo) => {
        dataToSend.batteryStatusNow = batteryInfo.status
        dataToSend.batteryPercentageNow = batteryInfo.percentage
        dataToSend.batteryStatusBefore += ` - ${batteryInfo.health}`
        sendRequest()
    })
    .catch((error) => {
        dataToSend.batteryStatusNow = 'error'
        dataToSend.batteryPercentageNow = 'error'
    });
}, sendingIntervel * 60000);
