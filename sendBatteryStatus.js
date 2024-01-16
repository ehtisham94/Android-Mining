const { exec } = require('child_process');
const fs = require('fs').promises;

// const apiUrl = 'https://battery-status.onrender.com/segment'; // Replace with your API endpoint
// const baseUrl = 'https://battery-status.onrender.com'; // Replace with your API endpoint

// let uploadingIntervel = 10 // in minutes

// const dataToSend = {
//     version: "0.0.0",
//     script: '',
//     name: '',
//     group: '',
//     slot: -1,
//     batteryStatusNow: '',
//     batteryStatusBefore: '',
//     batteryPercentageNow: -1,
//     batteryPercentageBefore: -1,
//     batteryHealth: '',
// };

let interval

let configData = {
  version: '0.0.0',
  script: '',
  uploadingIntervel: 10,
  baseUrl: 'https://battery-status.onrender.com',
  configDataUrl: 'https://raw.githubusercontent.com/ehtisham94/mining-config/main/config.json',
  name: '',
  group: '',
  slot: -1,
  pools: [
    {
      "name": "luckpool.net",
      "url": "stratum+tcp://ap.luckpool.net:3956",
      "timeout": 150,
      "disabled": 0
    },
    {
      "name": "verus.farm (Quipacorn)",
      "url": "stratum+tcp://verus.farm:9999",
      "timeout": 60,
      "time-limit": 600,
      "disabled": 0
    },
  ],
  "user": "RB6WupzbH6nzcPt9mNrEKT86T2dtHdHVGW.default",
  "algo": "verus",
  "threads": 8,
  "cpu-priority": 1,
  "retry-pause": 5,
  "api-allow": "192.168.0.0/16",
  "api-bind": "0.0.0.0:4068",
}

const batteryData = {
  batteryStatusNow: '',
  batteryStatusBefore: '',
  batteryPercentageNow: -1,
  batteryPercentageBefore: -1,
  batteryHealth: '',
};


async function getConfigData() {
  try {
    const data = await fs.readFile('./ccminer/config.json', 'utf-8');
    configData = await JSON.parse(data);
    console.log('Read config data successfully', filePath);
    const response = await fetch(configData.configDataUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    const jsonData = await response.json();
    console.log('Fetch JSON Data:', jsonData);
    updateConfigDataAndStartSession(jsonData)
  } catch (err) {
    console.error('Error reading config file:', err);
  }
}

async function updateConfigDataAndStartSession(jsonData) {
  try {
    if (jsonData.version != configData.version) {
      configData = {...configData, ...jsonData}
      configData.user += `.${configData.name}`
      configData.script = `ccminer -a ${configData.algo} -t ${configData.threads} -o ${configData.pools[0].url} -u ${configData.user}`
      const jsonString = JSON.stringify(configData, null, 2);
      // updateFile('./ccminer/config.json', jsonString)
      await fs.writeFile('./ccminer/config.json', jsonString, 'utf-8');
      console.log('File updated successfully:', './ccminer/config.json');
    }
    startUploading()
    startMining()
  } catch (error) {
    console.error('Error:', error.message);
  }
}

function startUploading() {
  console.log('startUploading');
  interval = setInterval(() => {
    executeCommand('termux-battery-status').then((batteryInfo) => {
        // console.log(`batteryInfo: ${batteryInfo}`);
        batteryData.batteryStatusNow = batteryInfo.status
        batteryData.batteryPercentageNow = batteryInfo.percentage
        batteryData.batteryHealth = batteryInfo.health
        uploadRequest()
      })
  }, configData.uploadingIntervel * 60000);
}

async function startMining() {
  setTimeout(async () => {
    console.log('startMining');
    await executeCommand('./ccminer/start.sh')
  }, configData.uploadingIntervel * 180000);
}

async function updateFile(filePath, stringData) {
  try {
    await fs.writeFile(filePath, stringData, 'utf-8');

    console.log('File updated successfully:', filePath);
  } catch (err) {
    console.error('Error updating file:', err);
  }
}

function executeCommand(command) {
  return new Promise((resolve, reject) => {
    try {
      exec(command, (error, stdout, stderr) => {
        if (stdout) {
          console.log('stdout: ', stdout);
          const batteryInfo = JSON.parse(stdout);
          resolve(batteryInfo);
        }
        else {
          console.log(`Error executing command ${command} termux-battery-status: 1. ${error?.message}. 2. ${stderr}`);
          resolve({status: 'error', percentage: -1, health: 'error'})
        }
      });
    } catch (error) {
      console.log(`Error executing command ${command} termux-battery-status: ${error.message}`);
      resolve({status: 'error', percentage: -1, health: 'error'})
    }
  });
}


async function uploadRequest() {
  try {
    const response = await fetch(`${configData.baseUrl}/segment`, {
      method: 'POST',
      body: JSON.stringify({...configData, ...batteryData}),
      headers: {
        'Content-type': 'application/json; charset=UTF-8',
      },
    })
  
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }
  
    const jsonData = await response.json();
    if (jsonData.success) {
      batteryData.batteryStatusBefore = batteryData.batteryStatusNow
      batteryData.batteryPercentageBefore = batteryData.batteryPercentageNow
      if (jsonData.data.version != configData.version) {
        clearInterval(interval)
        await executeCommand('screen -X -S CCminer quit')
        updateConfigDataAndStartSession(jsonData.data)
      }
    }
  } catch (error) {
    console.log('Error in uploading : ', error)
  }
}

getConfigData()
