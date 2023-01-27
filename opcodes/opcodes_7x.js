'use strict';
const winston = require('winston');		// use config from root instance
const cbusLib = require('cbuslibrary');
const NodeParameterNames = require('./../Definitions/Text_NodeParameterNames.js');
const Service_Definitions = require('./../Definitions/Service_Definitions.js');


// Scope:
// variables declared outside of the class are 'global' to this module only
// callbacks need a bind(this) option to allow access to the class members
// let has block scope (or global if top level)
// var has function scope (or global if top level)
// const has block sscope (like let), and can't be changed through reassigment or redeclared


class opcodes_7x {

    constructor(NETWORK) {
		//                        0123456789012345678901234567890123456789
		winston.debug({message:  '----------------- opcodes_7x Constructor'});
		
		this.network = NETWORK;
        this.hasTestPassed = false;
        this.response_time = 200;
    }
	
	    //
    // get first instance of a received message with the specified mnemonic
    //
    getMessage(mnemonic){
        var message = undefined;
        for (var i=0; i<this.network.messagesIn.length; i++){
            message = this.network.messagesIn[i];
            if (message.mnemonic == mnemonic){
                winston.debug({message: 'MERGLCB: Found message ' + mnemonic});
                break;
            }
        }
        if (message == undefined){                 
            winston.debug({message: 'MERGLCB: No message found for' + mnemonic});
        }
        return message
    }

            

    // 0x71 - NVRD
    test_NVRD(RetrievedValues, ServiceIndex, NodeVariableIndex, module_descriptor) {
        return new Promise(function (resolve, reject) {
            winston.debug({message: 'MERGLCB: BEGIN NVRD test - serviceIndex ' + ServiceIndex});
			this.hasTestPassed = false;
			var timeout = 50;
			if (NodeVariableIndex == 0){ 
				if (RetrievedValues.data.nodeParameters[6] != null) { 
					timeout = timeout * RetrievedValues.data.nodeParameters[6].value; 
				} else {
					winston.info({message: 'MERGLCB: FAILURE:  Node Parameter[6] - number of node variables not found '});
				}
			}
			if (RetrievedValues.data.Services[ServiceIndex].nodeVariables == null) {
				RetrievedValues.data.Services[ServiceIndex]["nodeVariables"] = {};
			}
            this.hasTestPassed = false;
            this.network.messagesIn = [];
            var msgData = cbusLib.encodeNVRD(RetrievedValues.getNodeNumber(), NodeVariableIndex);
            this.network.write(msgData);
            setTimeout(()=>{
                if (this.network.messagesIn.length > 0){
		            this.network.messagesIn.forEach(element => {
						var msg = cbusLib.decode(element);
						if (msg.mnemonic == "NVANS"){
							if (msg.nodeNumber == RetrievedValues.getNodeNumber()){
								this.hasTestPassed = true;
								/*								
								RetrievedValues.data.nodeVariables[msg.nodeVariableIndex] = {};
								RetrievedValues.data.nodeVariables[msg.nodeVariableIndex]["value"] = msg.nodeVariableValue;
								*/
								RetrievedValues.data.Services[ServiceIndex].nodeVariables[msg.nodeVariableIndex] = msg.nodeVariableValue;
								winston.info({message: 'MERGLCB:      ' + ServiceIndex + ' Node Variable ' + msg.nodeVariableIndex + ' value ' + msg.nodeVariableValue});
							}
						}
					});
				}
				
                if (this.hasTestPassed){ 
					winston.info({message: 'MERGLCB: NVRD passed'}); 
					RetrievedValues.data.TestsPassed++;
				}else{
					winston.info({message: 'MERGLCB: NVRD failed'});
					RetrievedValues.data.TestsFailed++;
				}
				winston.debug({message: '-'});
                resolve();
                ;} , timeout
            );
        }.bind(this));
    }
	
	
    // 0x71 - NVRD_ERROR
	// request a node variable index that doesn't exist, should get a CMDERR & GRSP back
    test_NVRD_ERROR(RetrievedValues, ServiceIndex, NodeVariableIndex, module_descriptor) {
        return new Promise(function (resolve, reject) {
            winston.debug({message: 'MERGLCB: BEGIN NVRD_ERROR test - serviceIndex ' + ServiceIndex});
			this.hasTestPassed = false;
			var timeout = 100;
			var msgBitField = 0;	// bit field to capture when each message has been received
			// An index of 0 is invalid for this test...
			if (NodeVariableIndex != 0){ 
				this.hasTestPassed = false;
				this.network.messagesIn = [];
				var msgData = cbusLib.encodeNVRD(RetrievedValues.getNodeNumber(), NodeVariableIndex);
				this.network.write(msgData);
				setTimeout(()=>{
					if (this.network.messagesIn.length > 0){
						this.network.messagesIn.forEach(element => {
							var msg = cbusLib.decode(element);
							if (msg.nodeNumber == RetrievedValues.getNodeNumber()){
								if (msg.mnemonic == "CMDERR"){
									if (msg.errorNumber == 10) {
										msgBitField |= 1;			// set bit 0
									} else {
										winston.info({message: 'MERGLCB: NVRD_ERROR: CMDERR wrong error number'}); 
									}
								}
								if (msg.mnemonic == "GRSP"){
									if (msg.result == 10) {
										msgBitField |= 2;			// set bit 1
									} else {
										winston.info({message: 'MERGLCB: NVRD_ERROR: GRSP wrong result number'}); 
									}
								}
							}
						});
					}
					if (msgBitField == 3) {
						// both messages have been received
						this.hasTestPassed = true;
					}

					if (this.hasTestPassed){ 
						winston.info({message: 'MERGLCB: NVRD_ERROR passed'}); 
						RetrievedValues.data.TestsPassed++;
					}else{
						winston.info({message: 'MERGLCB: NVRD_ERROR failed'});
						RetrievedValues.data.TestsFailed++;
					}
					winston.debug({message: '-'});
					resolve();
					;} , timeout
				);
			} else {
				winston.info({message: 'MERGLCB: **** NVRD_ERROR Test Aborted **** Node Variable Index 0 requested'});				
			}
        }.bind(this));
    }
	
	


	// 0x73 - RQNPN
    test_RQNPN(parameterIndex, retrieved_values, module_descriptor) {
        return new Promise(function (resolve, reject) {
            winston.debug({message: 'MERGLCB: Get Param ' + parameterIndex});
            this.hasTestPassed = false;
            this.network.messagesIn = [];
            var msgData = cbusLib.encodeRQNPN(retrieved_values.nodeNumber, parameterIndex);
            this.network.write(msgData);
            setTimeout(()=>{
                if (this.network.messagesIn.length > 0){
                    var message = this.getMessage('PARAN');
                    if (message.mnemonic == "PARAN"){						
						// ok - we have a value, so assume the test has passed - now do additional consistency tests
						// and fail the test if any of these tests fail
						this.hasTestPassed = true;
						
						//start building an ouput string in case it fails
						var fail_output = '\n      parameter index : ' + parameterIndex;
						fail_output += '\n      actual value : ' + message.parameterValue;
						// and a warning outputstring also
						var warning_output = "";
						
						if (retrieved_values["nodeParameters"][parameterIndex] != null){
							fail_output += '\n      retrieved_value : ' + retrieved_values ["nodeParameters"][parameterIndex].value;
							// we have previously read this value, so check it's still the same
							if ( retrieved_values ["nodeParameters"][parameterIndex].value != message.parameterValue){
								this.hasTestPassed = false;
								winston.debug({message: 'MERGLCB:      Failed Node - RetrievedValues value mismatch' + fail_output});  
							}
						} else {
							// new value, so save it
							retrieved_values.nodeParameters[parameterIndex] = { "name": NodeParameterNames[parameterIndex] };
							retrieved_values.nodeParameters[parameterIndex]["value"] = message.parameterValue;
							winston.debug({message: 'MERGLCB:      Node Parameter ' + parameterIndex + ' added to retrieved_values'});
						}
						
						// if it's in the module_descriptor, we need to check we've read the same value
						if (module_descriptor.nodeParameters[parameterIndex] != null) {
							if (module_descriptor.nodeParameters[parameterIndex].value != null) {
								fail_output += '\n      module_descriptor : ' + module_descriptor.nodeParameters[parameterIndex].value;
								if ( module_descriptor.nodeParameters[parameterIndex].value != message.parameterValue) {
									this.hasTestPassed = false;
									winston.debug({message: 'MERGLCB:      Failed module descriptor mismatch' + fail_output});
								}
							} else {
								warning_output = ' :: Warning: No matching module_descriptor value entry';
							}
						} else {
							warning_output =  ' :: Warning: No matching module_descriptor file entry';
						}
					}
				}
				if (this.hasTestPassed) {
                    winston.info({message: 'MERGLCB: RQNPN index ' + parameterIndex + ' passed - ' + NodeParameterNames[parameterIndex] + warning_output});
                    winston.debug({message: 'MERGLCB: RQNPN value ' + message.parameterValue});
					retrieved_values.TestsPassed++;
				} else {
					winston.info({message: 'MERGLCB: RQNPN failed - ' + NodeParameterNames[parameterIndex] + fail_output});
					retrieved_values.TestsFailed++;
				}
				winston.debug({message: '-'});
                resolve();
                ;} , 100
            );
        }.bind(this));
    }
 
    
    // 0x75 - CANID
    test_CANID(retrieved_values, CANID) {
        return new Promise(function (resolve, reject) {
            winston.debug({message: 'MERGLCB: BEGIN CANID test'});
            this.hasTestPassed = false;
            this.network.messagesIn = [];
            var msgData = cbusLib.encodeCANID(retrieved_values.nodeNumber, CANID);
            this.network.write(msgData);
            setTimeout(()=>{
                if (this.network.messagesIn.length > 0){
					/*
		            this.network.messagesIn.forEach(element => {
						var msg = cbusLib.decode(element);
						winston.info({message: msg.text});
						if (msg.mnemonic == "PNN"){
							if (msg.nodeNumber == test_node_number){
								winston.info({message: 'MERGLCB: QNN passed'});
								this.hasTestPassed = true;
							}
						}
					});
					*/
				}
				
                if (this.hasTestPassed){ 
					winston.info({message: 'MERGLCB: CANID passed'}); 
					retrieved_values.TestsPassed++;
				}else{
					winston.info({message: 'MERGLCB: CANID failed'});
					retrieved_values.TestsFailed++;
				}
				winston.debug({message: '-'});
                resolve();
                ;} , this.response_time
            );
        }.bind(this));
    }
	
	
    // 0x76 - MODE
    test_MODE(retrieved_values, MODE) {
        return new Promise(function (resolve, reject) {
            winston.debug({message: 'MERGLCB: BEGIN MODE test'});
            this.hasTestPassed = false;
            this.network.messagesIn = [];
            var msgData = cbusLib.encodeMODE(retrieved_values.nodeNumber, MODE);
            this.network.write(msgData);
            setTimeout(()=>{
                if (this.network.messagesIn.length > 0){
		            this.network.messagesIn.forEach(element => {
						var msg = cbusLib.decode(element);
						winston.debug({message: msg.text});
						if (msg.mnemonic == "GRSP"){
							if (msg.nodeNumber == retrieved_values.nodeNumber){
								if (msg.requestOpCode == cbusLib.decode(msgData).opCode) {
									this.hasTestPassed = true;
								}else {
									winston.info({message: 'MERGLCB: GRSP requestOpCode:'
										+ '\n  Expected ' + cbusLib.decode(msgData).opCode
										+ '\n  Actual ' + msg.requestOpCode}); 
								}
							} else {
									winston.info({message: 'MERGLCB: GRSP nodeNumber:' +
										+ '\n  Expected ' + cbusLib.decode(msgData).nodeNumber
										+ '\n  Actual ' + msg.nodeNumber}); 
							}
						}
					});
				}
				
                if (this.hasTestPassed){ 
					winston.info({message: 'MERGLCB: MODE passed'}); 
					retrieved_values.TestsPassed++;
				}else{
					winston.info({message: 'MERGLCB: MODE failed'});
					retrieved_values.TestsFailed++;
				}
				winston.debug({message: '-'});
                resolve();
                ;} , this.response_time
            );
        }.bind(this));
    }
	
	
	// 0x78 - RQSD
    test_RQSD(RetrievedValues, ServiceIndex) {
        return new Promise(function (resolve, reject) {
            winston.debug({message: 'MERGLCB: BEGIN RQSD test - serviceIndex ' + ServiceIndex});
            this.hasTestPassed = false;
            this.network.messagesIn = [];
            var msgData = cbusLib.encodeRQSD(RetrievedValues.getNodeNumber(), ServiceIndex);
            this.network.write(msgData);
            setTimeout(()=>{
				var msg_count = 0;	// we may want to compare the number of messages,so lets start a count
                if (this.network.messagesIn.length > 0){
		            this.network.messagesIn.forEach(element => {
						var msg = cbusLib.decode(element);
						if (ServiceIndex == 0) {
							// service index is 0, so expecting one or more 'SD' messages
							if (msg.mnemonic == "SD"){
								if (msg.nodeNumber == RetrievedValues.getNodeNumber()){
									this.hasTestPassed = true;
									if (msg.ServiceIndex == 0){
										// special case that SD message with serviceIndex 0 has the service count in ther version field
										RetrievedValues.data.ServiceCount = msg.ServiceVersion;
										this.hasTestPassed = true;	// accept test has passed if we get this one message
										winston.info({message: 'MERGLCB:      Service Discovery : Service count ' 
													+ msg.ServiceVersion });
									} else {
										msg_count++;	// add to count
										RetrievedValues.addService(msg.ServiceIndex, msg.ServiceType, msg.ServiceVersion);
										winston.info({message: 'MERGLCB:      Service Discovery : ServiceIndex ' + msg.ServiceIndex
														+ ' ServiceType ' + msg.ServiceType
														+ ' ServiceVersion ' + msg.ServiceVersion
														+ ' - ' + RetrievedValues.data["Services"][msg.ServiceIndex]["ServiceName"]});
									}
								}
								else{
									winston.info({message: 'MERGLCB: RQSD - node number - received : ' + msg.nodeNumber + " expected : " + RetrievedValues.data.nodeNumber});
								}
							}
						} else {
							// Service Index is non-zero, so expecting a single 'ESD' message for the service specified
							if (msg.mnemonic == "ESD"){
								if (msg.nodeNumber == RetrievedValues.data.nodeNumber){
									this.hasTestPassed = true;
									RetrievedValues.addServiceData(msg.ServiceIndex, msg.Data1, msg.Data2, msg.Data3, msg.Data4);
									winston.info({message: 'MERGLCB:      Service Discovery : ServiceIndex ' + msg.ServiceIndex
													+ ' Data1 ' + msg.Data1
													+ ' Data2 ' + msg.Data2
													+ ' Data3 ' + msg.Data3
													+ ' Data4 ' + msg.Data4
													+ ' - ' + RetrievedValues.data["Services"][msg.ServiceIndex]["ServiceName"]});
								}
								else{
									winston.info({message: 'MERGLCB: RQSD - node number - received : ' + msg.nodeNumber + " expected : " + RetrievedValues.data.nodeNumber});
								}
							}
						}
					});
				}
				
				// we can check we received SD messages for all the expected services if the requested serviceIndex was 0
				if ((ServiceIndex == 0) & (msg_count != RetrievedValues.data.ServiceCount)) {
					winston.info({message: 'MERGLCB: RQSD failed - service count doesn\'t match'});
					this.hasTestPassed - false;
				}
				
                if (this.hasTestPassed){ 
					winston.info({message: 'MERGLCB: RQSD (ServiceIndex ' + ServiceIndex + ') passed'}); 
					RetrievedValues.data.TestsPassed++;
				}else{
					winston.info({message: 'MERGLCB: RQSD (ServiceIndex ' + ServiceIndex + ') failed'});
					RetrievedValues.data.TestsFailed++;
				}
				winston.debug({message: '-'});
                resolve();
				;} , this.response_time
            );
        }.bind(this));
    }
    
	
	
	

}

module.exports = {
    opcodes_7x: opcodes_7x
}