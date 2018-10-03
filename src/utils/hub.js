"use strict";

const os = require("os");
const ip = require("ip");
const ping = require('ping');
const arp = require("node-arp");

function hub_list(callback) {
    let networks = [];
    let myAddress = [];

    var interfaces = os.networkInterfaces();
    for (let name in interfaces) {
        interfaces[name].map((inet) => {
            if (inet.internal) return;
            if (inet.family != 'IPv4') return;

            myAddress.push(inet.address);
        
            for (let i in networks) {
                if (networks[i].contains(inet.address)) {
                    return;
                }
            }

            networks.push(ip.cidrSubnet(inet.cidr))
        });
    }

    // console.log(networks);

    let cnt = 0;
    let list = [];

    networks.map(async (network) => {
        for(let i = ip.toLong(network.firstAddress), l = ip.toLong(network.lastAddress); i < l + 1; i++){
            let address = ip.fromLong(i)
            if (myAddress.indexOf(address) != -1) continue;

            cnt++;
    
            ping.sys.probe(address, function(isAlive){
                if (!isAlive){
                    cnt--;
                    if (cnt == 0) {
                        callback(list);
                    }
                    return;
                }

                arp.getMAC(address, (error, mac) => {
                    if ( mac.startsWith("b8:27:eb")) {
                        list.push(address);
                    }
                    cnt--;
                    
                    if (cnt == 0) {
                        callback(list);
                    }
                });
            }, {timeout: 1});
        }
    });
}

module.exports = { hub_list }