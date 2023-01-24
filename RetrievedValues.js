'use strict';
const winston = require('winston');		// use config from root instance
const fs = require('fs');


// Scope:
// variables declared outside of the class are 'global' to this module only
// callbacks need a bind(this) option to allow access to the class members
// let has block scope (or global if top level)
// var has function scope (or global if top level)
// const has block sscope (like let), and can't be changed through reassigment or redeclared


class RetrievedValues {

    constructor() {
		//                        0123456789012345678901234567890123456789
		winston.debug({message:  '------------ RetrievedValues Constructor'});
		
		this.retrieved_values = { "DateTime" : new Date(),	// include datetime of test run start
								"TestsPassed": 0,
								"TestsFailed": 0,
								"nodeNumber": null,
								"HEARTB": 'failed',			// assume HEARTB not recived to begin with
								"modules": {},
								"nodeParameters": {},
								"Services": {}
								};	
		}

	getNodeNumber(){ return this.retrieved_values.nodeNumber; };
	setNodeNumber(nodeNumber) { this.retrieved_values.nodeNumber = nodeNumber; };
	
	
	writeToDisk(path) {
		// now write retrieved_values to disk
		var text = JSON.stringify(this.retrieved_values, null, '    ');
		fs.writeFileSync(path, text);
		winston.debug({message: 'MERGLCB: Write to disk: retrieved_values \n' + text});
	}


}

module.exports = new RetrievedValues();