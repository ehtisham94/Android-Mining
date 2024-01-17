const { spawn, exec } = require('child_process');
const fs = require('fs').promises;
const os = require('os');

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
  ipAddress: '',
};


async function getConfigData() {
  try {
    console.log('Reading config file');
    const data = await fs.readFile('./ccminer/config.json', 'utf-8');
    configData = await JSON.parse(data);
    console.log('Read config file successfully');
    const response = await fetch(configData.configDataUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    const jsonData = await response.json();
    console.log('Fetched JSON Data:', jsonData);
    updateConfigDataAndStartSession(jsonData)
  } catch (error) {
    console.log('Error in getConfigData:', error);
  }
}

async function updateConfigDataAndStartSession(jsonData) {
  try {
    console.log('check version');
    if (jsonData.version != configData.version) {
      console.log('version changed');
      configData = {...configData, ...jsonData}
      configData.user += `.${configData.name}`
      configData.script = `ccminer -a ${configData.algo} -t ${configData.threads} -o ${configData.pools[0].url} -u ${configData.user}`
      const jsonString = JSON.stringify(configData, null, 2);
      console.log('updating config file');
      await fs.writeFile('./ccminer/config.json', jsonString, 'utf-8');
      console.log('File updated successfully:', './ccminer/config.json');
    }
    console.log('starting session');
    startUploading()
    startMining()
  } catch (error) {
    console.log('Error in updateConfigDataAndStartSession:', error);
  }
}

function startUploading() {
  try {
    console.log('startUploading');
    interval = setInterval(async () => {
      try {
        console.log('execute command "termux-battery-status"');
        let commandOutput = await executeCommandWithTimeout('termux-battery-status')
        console.log('command "termux-battery-status" executed: ', commandOutput);
        if (commandOutput.success) {
          let batteryInfo = JSON.parse(commandOutput.data)
          console.log(`parsed commandOutput.data: `, batteryInfo);
          batteryData.batteryStatusNow = batteryInfo.status
          batteryData.batteryPercentageNow = batteryInfo.percentage
          batteryData.batteryHealth = batteryInfo.health
        } else {
          batteryData.batteryStatusNow = 'error'
          batteryData.batteryPercentageNow = -1
          batteryData.batteryHealth = 'error'
        }
        batteryData.ipAddress = await getIpAddress()
        uploadRequest()
        // executeCommand('termux-battery-status').then((batteryInfo) => {
        //     // console.log(`batteryInfo: ${batteryInfo}`);
        //     batteryData.batteryStatusNow = batteryInfo.status
        //     batteryData.batteryPercentageNow = batteryInfo.percentage
        //     batteryData.batteryHealth = batteryInfo.health
        //     uploadRequest()
        //   })
        
      } catch (error) {
        console.log('Error in uploading interval:', error);
      }
    }, configData.uploadingIntervel * 6000);
    
  } catch (error) {
    console.log('Error in startUploading:', error);
  }
}

async function startMining() {
  try {
    console.log('starting settimeout for start Mining');
    setTimeout(async () => {
      console.log('startint Mining');
      await executeCommandWithTimeout('./ccminer/start.sh')
      console.log('Mining started');
    }, configData.uploadingIntervel * 18000);
  } catch (error) {
    console.log('Error in startMining:', error);
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

async function executeCommandWithTimeout(command, timeout=3000) {
  console.log('executeCommandWithTimeout ');
  return new Promise(async (resolve, reject) => {
    console.log('start executing command');
    const childProcess = spawn(command, { shell: true, stdio: 'pipe' });

    let timedOut = false;
    let output = '';

    const timeoutId = setTimeout(() => {
      console.log(`Command timed out after ${timeout} milliseconds`);
      timedOut = true;
      childProcess.kill();
      resolve({success: false, data: ''});
    }, timeout);

    // Capture the output
    childProcess.stdout.on('data', (data) => {
      console.log(`received output chunk from command ${command}: `, data);
      output += data;
    });

    childProcess.on('exit', (code, signal) => {
      clearTimeout(timeoutId);

      if (timedOut) {
        console.log(`Command '${command}' exited after timeout`);
        // Do nothing, already rejected due to timeout
      } else if (code === 0) {
        console.log(`Command '${command}' executed successfully with output: `, output);
        resolve({success: true, data: output});
      } else {
        console.log(`Command exited with code ${code || signal}`);
        resolve({success: false, data: ''});
      }
    });

    childProcess.on('error', (error) => {
      console.log(`error in executing command ${command}: `, error);
      clearTimeout(timeoutId);
      resolve({success: false, data: ''});
    });
  });
}

async function getIpAddress() {
  try {
    console.log(`start geting ip address`);
    const networkInterfaces = os.networkInterfaces();

    // Find the first non-internal IPv4 address
    const ipAddress = Object.values(networkInterfaces)
      .flat()
      .find((iface) => iface.family === 'IPv4' && !iface.internal)?.address;
    console.log(`got ip address: `, ipAddress);
    return ipAddress || ''
  } catch (error) {
    console.log('Error in getIpAddress:', error);
    return
  }
}


async function uploadRequest() {
  try {
    console.log('sending request');
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
    console.log('request returned successfully');
    const jsonData = await response.json()
    console.log('parsed json data from upload request: ', jsonData);
    if (jsonData.success) {
      console.log('data received successfully');
      batteryData.batteryStatusBefore = batteryData.batteryStatusNow
      batteryData.batteryPercentageBefore = batteryData.batteryPercentageNow
      console.log('battery data updated and check for version change');
      if (jsonData.data.version != configData.version) {
        console.log('config version changed');
        clearInterval(interval)
        console.log('interval cleared');
        await executeCommandWithTimeout('screen -X -S CCminer quit')
        console.log('mining stopped and call updateConfigDataAndStartSession');
        updateConfigDataAndStartSession(jsonData.data)
      }
    }
  } catch (error) {
    console.log('Error in uploadRequest : ', error)
  }
}

getConfigData()
