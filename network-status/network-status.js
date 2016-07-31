'use strict';

/**
 * @module network-status (Singleton)
 * @description A single instance which is aware of network status
 */


let network;

/**
 *
 * @constructor
 */
let Component = function () {
	this.networkStatus = 'online';

	//network status alert message container
  	this.component = document.createElement('div');
  	this.component.classList.add('network-status-container');

  	this.message = document.createElement('div');
    this.message.classList.add('network-status-message');
    this.message.setAttribute('role', 'aria-alert');
    this.message.setAttribute('aria-hidden', true);
    this.message.innerText = 'NO NETWORK CONNECTION';

    this.component.appendChild(this.message);
    document.body.appendChild(this.component);

    //Initialise web worker
    this.netWebWorker = new Worker('network-webworker.js');
    //Listen for message from network webworker
	this.netWebWorker.addEventListener('message', onStatusChange.bind(this));
};

/**
 * onStatusChange record and handle alert message 
 * @private
 * @param  {event} e event from web worker
 * @return {void}
 */
function onStatusChange(e) {
	if(e.data === 'online') {
		this.networkStatus = 'online';
		this.message.classList.remove('network-offline');
		this.message.setAttribute('aria-hidden', true);
	} else {
		this.networkStatus = 'offline';
		this.message.classList.add('network-offline');
		this.message.setAttribute('aria-hidden', false);
	}	
}

/**
 * getNetworkStatus 
 * @public
 * @return {string} current status of the network
 */
function getNetworkStatus() {
	return network.networkStatus;
}


network = new Component();

module.exports = getNetworkStatus;
