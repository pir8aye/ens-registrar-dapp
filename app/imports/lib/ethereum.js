import ENS from 'ethereum-ens';
import Registrar from 'eth-registrar-ens';

export default ethereum = (function() {
  let subscribers = [];

  function initWeb3() {
    return new Promise((resolve, reject) => {
      if(typeof web3 !== 'undefined') {
        web3 = new Web3(web3.currentProvider);
      }
      else {
        let Web3 = require('web3');
        web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
      }
      resolve(web3);
    })
  }

  function checkConnection(web3) {
    reportStatus('Checking connection...')
    var attempts = 4,
      checkInterval;
    return new Promise((resolve, reject) => {
      function check() {
        attempts--;
        if(web3.isConnected()) {
          clearInterval(checkInterval)
          resolve(web3);
        } else if (attempts <= 0) {
          reportStatus('Ethereum network is disconnected. Awaiting connection...');
        }
      }
      checkInterval = setInterval(check, 800);
      check();
    });
  }

  function initRegistrar(web3) {
    reportStatus('Initializing ENS registrar...');
    return new Promise((resolve, reject) => {
      try {
        var ens = new ENS(web3, '0x112234455c3a32fd11230c42e7bccd4a84e02010');
        var registrar = new Registrar(web3);
        registrar.init();
        resolve({web3, ens, registrar});
      } catch(e) {
        reject('Error initialiting ENS registrar: ' + e);
      }
    });
  }

  //todo: instead of globals, create methods or properties
  //for retrieving these objects
  function setGlobals(globals) {
    web3 = globals.web3;
    ens = globals.ens;
    registrar = globals.registrar;
    return new Promise((resolve, reject) => {
      resolve();
    });
  }

  function reportStatus(description, isReady, theresAnError) {
    console.log(description);
    subscribers.forEach((subscriber) => subscriber({
      isReady,
      description,
      theresAnError
    }));
  }


  return {
    init() {
      reportStatus('Connecting to Ethereum network...');
      return initWeb3()
        .then(checkConnection)
        .then(initRegistrar)
        .then(setGlobals)
        .then(() => {
          reportStatus('Ready', true);
        })
        .catch(err => {
          reportStatus(err, false, true);
        })
    },
    onStatusChange(callback) {
      subscribers.push(callback);
    }
  };
}());
