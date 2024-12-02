const { spawn } = require('child_process');
const fs = require('fs').promises;
const os = require('os');

let interval

let baseUrlConfigUrl = 'https://raw.githubusercontent.com/ehtisham94/mining-config/main/baseUrlConfig.json'
let baseUrl = ''

let configData = {
  version: '0.0',
  startScript: '',
  stopScript: '',
  uploadingInterval: 10,
  // baseUrl: 'https://battery-status.onrender.com',
  // configDataUrl: 'https://raw.githubusercontent.com/ehtisham94/mining-config/main/config.json',
  // ram: 6,
  // processor: 'SD 845',
  // architecture: 'a75-a55',
  // cores: 8,
  name: '',
  group: '',
  slot: -1,
  isBatteryDataRequired: false,
  miningOffBatteryPercentage: 10,
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
  "cpu-affinity": -1,
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
  isMining: false,
};


async function getConfigData() {
  try {
    while (!baseUrl) {
      const baseUrlConfigResponse = await fetch(baseUrlConfigUrl);
      const baseUrlConfigData = await baseUrlConfigResponse.json();
      baseUrl = baseUrlConfigData.baseUrl
    }
    // console.log('Reading config file');
    const data = await fs.readFile('./miningSetup/config.json', 'utf-8');
    configData = await JSON.parse(data);
    // console.log('Read config file successfully');
    const response = await fetch(`${baseUrl}/segment`, {
      method: 'POST',
      body: JSON.stringify({...configData, ...batteryData, isStart: true}),
      headers: {
        'Content-type': 'application/json; charset=UTF-8',
      },
    })
  
    if (!response.ok) {
      throw new Error(`Failed to fetch config data`);
    }
    // console.log('request returned successfully');
    const jsonData = await response.json()
    // console.log('Fetched JSON Data:', jsonData);
    if (jsonData.success) {
      // console.log('data received successfully');
      updateConfigDataAndStartSession(jsonData.data)
    } else {
      throw new Error(`Failed to fetch config data`);
    }
  } catch (error) {
    // console.log('Error in getConfigData:', error);
    setTimeout(getConfigData, 5000)
  }
}

async function updateConfigDataAndStartSession(jsonData) {
    try {
      // console.log('check version');
      if (jsonData.version != configData.version) {
        let oldVersion = configData.version.split('.')
        let newVersion = jsonData.version.split('.')
        // console.log('version changed');
        configData = jsonData
        configData.version = `${oldVersion[0]}.${newVersion[1]}`
        // console.log('updating config file');
        await fs.writeFile('./miningSetup/config.json', JSON.stringify(configData, null, 2), 'utf-8');
        for (let i = parseInt(oldVersion[0]) + 1; i <= parseInt(newVersion[0]); i++) {
          let commandOutput = await executeCommandWithTimeout(`curl -o- -k https://raw.githubusercontent.com/ehtisham94/Android-Mining/main/setup_scripts/script_${i}.sh | DATA='${JSON.stringify(configData)}' bash`, 999999999)
          if (commandOutput.success) {
            configData.version = `${i}.${newVersion[1]}`
            await fs.writeFile('./miningSetup/config.json', JSON.stringify(configData, null, 2), 'utf-8');
          } else {
            throw new Error(`Error in installing setup_script_${i}.sh`);
          }
        }
        configData.version = jsonData.version
        // console.log('updating config file');
        await fs.writeFile('./miningSetup/config.json', JSON.stringify(configData, null, 2), 'utf-8');
        // console.log('File updated successfully:', './ccminer/config.json');
      }
      // console.log('starting session');
      startUploading()
      startMining(true)
    } catch (error) {
      // console.log('Error in updateConfigDataAndStartSession:', error);
      setTimeout(getConfigData, 5000)
    }
  }

async function startMining(status) {
  try {
    // console.log('startint Mining', status);
    // let commandOutput = await executeCommandWithTimeout(status ? './ccminer/start.sh' : 'screen -X -S CCminer quit')
    let commandOutput = await executeCommandWithTimeout(status ? `${configData.startScript} DATA='${JSON.stringify(configData)}'` : configData.stopScript)
    if (commandOutput.success) batteryData.isMining = status;
    // console.log('Mining started', status);
  } catch (error) {
    // console.log('Error in startMining:', error);
  }
}

async function uploading() {
  try {
    if (configData.isBatteryDataRequired) {
        let commandOutput = await executeCommandWithTimeout('termux-battery-status')
        // console.log('command "termux-battery-status" executed: ', commandOutput);
        if (commandOutput.success) {
            let batteryInfo = JSON.parse(commandOutput.data)
            // console.log(`parsed commandOutput.data: `, batteryInfo);
            batteryData.batteryStatusNow = batteryInfo.status
            batteryData.batteryPercentageNow = batteryInfo.percentage
            batteryData.batteryHealth = batteryInfo.health
            if (batteryInfo.percentage < configData.miningOffBatteryPercentage && batteryData.isMining) startMining(false);
            else if (batteryInfo.percentage > configData.miningOffBatteryPercentage && !batteryData.isMining) startMining(true);
        } else {
            batteryData.batteryStatusNow = 'error'
            batteryData.batteryPercentageNow = -1
            batteryData.batteryHealth = 'error'
        }
    } else {
        batteryData.batteryStatusNow = 'unchecked'
        batteryData.batteryPercentageNow = -2
        batteryData.batteryHealth = 'unchecked'
    }
    // console.log('execute command "termux-battery-status"');
    if(!batteryData.ipAddress) batteryData.ipAddress = await getIpAddress();
    uploadRequest()
  } catch (error) {
    // console.log('Error in uploading:', error);
  }
}

function startUploading() {
  try {
    // console.log('startUploading');
    // console.log('start initial uploading interval');
    let i = 0, initInterval = setInterval(() => {
      uploading()
      i += 1
      if (i > 10) clearInterval(initInterval);
    }, 20000);
    // console.log('start main uploading interval');
    interval = setInterval(uploading, configData.uploadingInterval * 60000);
  } catch (error) {
    // console.log('Error in startUploading:', error);
  }
}

async function executeCommandWithTimeout(command, timeout=300000) {
  // console.log('executeCommandWithTimeout ');
  return new Promise(async (resolve, reject) => {
    // console.log('start executing command');
    const childProcess = spawn(command, { shell: true, stdio: 'pipe' });

    let timedOut = false;
    let output = '';

    const timeoutId = setTimeout(() => {
      // console.log(`Command timed out after ${timeout} milliseconds`);
      timedOut = true;
      childProcess.kill();
      resolve({success: false, data: ''});
    }, timeout);

    // Capture the output
    childProcess.stdout.on('data', (data) => {
      // console.log(`received output chunk from command ${command}: `, data);
      output += data;
    });

    childProcess.on('exit', (code, signal) => {
      clearTimeout(timeoutId);

      if (timedOut) {
        // console.log(`Command '${command}' exited after timeout`);
        // Do nothing, already rejected due to timeout
      } else if (code === 0) {
        // console.log(`Command '${command}' executed successfully with output: `, output);
        resolve({success: true, data: output});
      } else {
        // console.log(`Command exited with code ${code || signal}`);
        resolve({success: false, data: ''});
      }
    });

    childProcess.on('error', (error) => {
      // console.log(`error in executing command ${command}: `, error);
      clearTimeout(timeoutId);
      resolve({success: false, data: ''});
    });
  });
}

async function getIpAddress() {
  try {
    // console.log(`start geting ip address`);
    const networkInterfaces = os.networkInterfaces();

    // Find the first non-internal IPv4 address
    const ipAddress = Object.values(networkInterfaces)
      .flat()
      .find((iface) => iface.family === 'IPv4' && !iface.internal)?.address;
    // console.log(`got ip address: `, ipAddress);
    return ipAddress || ''
  } catch (error) {
    // console.log('Error in getIpAddress:', error);
    return ''
  }
}


async function uploadRequest() {
  try {
    // console.log('sending request');
    const response = await fetch(`${baseUrl}/segment`, {
      method: 'POST',
      body: JSON.stringify({...configData, ...batteryData}),
      headers: {
        'Content-type': 'application/json; charset=UTF-8',
      },
    })
  
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }
    // console.log('request returned successfully');
    const jsonData = await response.json()
    // console.log('parsed json data from upload request: ', jsonData);
    if (jsonData.success) {
      // console.log('data received successfully');
      batteryData.batteryStatusBefore = batteryData.batteryStatusNow
      batteryData.batteryPercentageBefore = batteryData.batteryPercentageNow
      // console.log('battery data updated and check for version change');
      if (jsonData.data.version != configData.version) {
        // console.log('config version changed');
        clearInterval(interval)
        // console.log('interval cleared');
        await startMining(false)
        // console.log('mining stopped and call updateConfigDataAndStartSession');
        updateConfigDataAndStartSession(jsonData.data)
      }
    }
  } catch (error) {
    // console.log('Error in uploadRequest : ', error)
  }
}

getConfigData()
