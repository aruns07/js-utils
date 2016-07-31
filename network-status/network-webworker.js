'use strict';

/**
 * @description A webworker that checks the connectivity of the app with server.
 */

const config = {
	probeInterval: 30000,
	requestTimeout: 5000,
	requestWatchInterval: 200,
	maxPerProbe: 5,
	remoteFile: 'ping.png'
};

const status = {
	OFFLINE: 'offline',
	ONLINE: 'online',
	UNRELIABLE: 'unreliable',
	SERVERERROR: 'server-error'
};

let probeStat = {
	requested: 0,
	success: 0,
	failed: 0
};


let lastProbeStatus = status.ONLINE;

/**
 * scheduleProbe create a loop of checking the network status
 * @return {void} 
 */
function scheduleProbe() {
	setTimeout(() => {
		//We cannot reach to server if browser cannot connect to LAN/Router, hence don't probe.
		//https://developer.mozilla.org/en-US/docs/Web/API/NavigatorOnLine/onLine
		//Probe when OS says online.
		if(navigator.onLine) {
			beginProbing();
		} else {
			reportStatus(status.OFFLINE);
			scheduleProbe();
		}
	}, config.probeInterval);
}

/**
 * beginProbing  starts the network check and decide the status to be reported
 * @return {void} 
 */
function beginProbing() {
	probeNetwork()
		.then(function(){
			
			let netStatus, statSummary = (probeStat.success / probeStat.requested);

			if(statSummary < 0.25) {
				netStatus = status.OFFLINE;
			} else if (statSummary > 0.75) {
				netStatus = status.ONLINE;
			} else {
				netStatus = status.UNRELIABLE;
			}
			reportStatus(netStatus);
			//Reset stat
			probeStat.requested = 0;
			probeStat.success = 0;
			probeStat.failed = 0;

			//Schedule Next probe
			scheduleProbe();
		});
}

/**
 * probeNetwork based on configuration creates a chain of multiple requests per probe
 * @return {Promise}
 */
function probeNetwork() {

	return new Promise(function(resolve, reject) {
		if(probeStat.requested < config.maxPerProbe) {
		
			let pingURL = config.remoteFile + '?cacheburst=' + Date.now();

			probeStat.requested++;
			//Send request sequencial, resolve only when we know that status of the next request.
			sendNetworkRequest(pingURL)
				.then(function(responseStatus){
					if(responseStatus === 200) {
						probeStat.success++;
					} else {
						probeStat.failed++;
					}
					//Add next request
					probeNetwork().then(() => { resolve(); });
				})
				.catch(function(){
					probeStat.failed++;
					//Add next request
					probeNetwork().then(() => { resolve(); });
				});
			

		} else {
			resolve();
		}		
	});
}


/**
 * sendNetworkRequest low level fetch with a watch to timeout a request
 * @param  {string} requestURL URL for get request
 * @return {Promise}            
 */
function sendNetworkRequest(requestURL) {

	return new Promise(function(resolve, reject){
		let fetchTimeoutKey, 
			fetchTerminated = false;
		
		performance.clearMarks();
		performance.mark('fetch-start');
		
		fetch(requestURL, {method: 'HEAD', credentials: 'include'})
			.then(function(response){
				if(!fetchTerminated) {
					clearInterval(fetchTimeoutKey);
					resolve(response.status);				
				}
			})
			.catch(function(){
				if(!fetchTerminated) {
					clearInterval(fetchTimeoutKey);
					reject();
				}
			});

		//Start watching the request for timeout
		fetchTimeoutKey = setInterval(function(){
			if(performance.now() - performance.getEntriesByName('fetch-start')[0].startTime > config.requestTimeout) {
				clearInterval(fetchTimeoutKey);
				fetchTerminated = true;
				reject();
			}
		}, config.requestWatchInterval);
	});

}

/**
 * reportStatus postmessage from the webworker if change in network status
 * @param  {string} netStatus next network status
 * @return {void}     
 */
function reportStatus(netStatus) {
	if(lastProbeStatus !== netStatus) {
		self.postMessage(netStatus);
		lastProbeStatus = netStatus;
	}
}

beginProbing();