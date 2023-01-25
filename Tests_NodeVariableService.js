'use strict';
const winston = require('winston');		// use config from root instance
const cbusLib = require('cbuslibrary');

const opcodes_0x = require('./opcodes/opcodes_0x.js');
const opcodes_7x = require('./opcodes/opcodes_7x.js');
const opcodes_8x = require('./opcodes/opcodes_8x.js');

// Scope:
// variables declared outside of the class are 'global' to this module only
// callbacks need a bind(this) option to allow access to the class members
// let has block scope (or global if top level)
// var has function scope (or global if top level)
// const has block sscope (like let), and can't be changed through reassigment or redeclared


class NodeVariableServiceTests {

    constructor(NETWORK) {
		this.network = NETWORK;
		
		this.opcodes_0x = new opcodes_0x.opcodes_0x(this.network);
		this.opcodes_7x = new opcodes_7x.opcodes_7x(this.network);
		this.opcodes_8x = new opcodes_8x.opcodes_8x(this.network);
    }


    async runTests(RetrievedValues, module_descriptor, serviceIndex) {
		winston.debug({message: ' '});
		//                      012345678901234567890123456789987654321098765432109876543210
		winston.debug({message: '==========================================================='});
		winston.info({message:  '-------------- Node Variable Service tests ----------------'});
		winston.debug({message: '==========================================================='});
		winston.debug({message: ' '});
		

		
//		winston.debug({message: 'MERGLCB: NVS : RetrievedValues ' + JSON.stringify(RetrievedValues.data)});
//		winston.debug({message: 'MERGLCB: NVS : Module Descriptor ' + JSON.stringify(module_descriptor)});

			// only do tests if we have succesfully retrieved the module descriptor file
			if (module_descriptor != null){

				// this will get the service data that this module supports
				await this.opcodes_7x.test_RQSD(RetrievedValues.data, serviceIndex);
								
				// this will read all the node variables
				await this.opcodes_7x.test_NVRD(RetrievedValues, serviceIndex, 0);
								
				// now request diagnostics just for this service
				await this.opcodes_8x.test_RDGN(RetrievedValues.data, serviceIndex, 0);

				//
				// Add more tests.......
				//
				
			} else {
				winston.info({message: 'MERGLCB: tests aborted - invalid module descriptor file'});
			}
		
        winston.info({message: 'MERGLCB: ==== Node Variable Service Test run finished \n'});
		
//		winston.debug({message: 'MERGLCB: NVS : RetrievedValues ' + JSON.stringify(RetrievedValues.data, null, "    ")});
		return RetrievedValues;
    }

    sleep(timeout) {
        return new Promise(function (resolve, reject) {
            //here our function should be implemented 
            setTimeout(()=>{
                resolve();
                ;} , timeout
            );
        });
    }

}

module.exports = {
    NodeVariableServiceTests: NodeVariableServiceTests
}