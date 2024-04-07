'use strict';

const { WorkloadModuleBase } = require('@hyperledger/caliper-core');

class MyWorkload extends WorkloadModuleBase {
    constructor() {
        super();
        this.txIndex = -1;
        this.assetIDs=["1","2","3","4","5","6","7","8","9","10"];
        this.name = ['SMART LOCK', 'SMART TV', 'SMART FAN', 'SMART AC', 'SMART OVEN', 'SMART BULB', 'SMART PLUG1'];
        this.deviceType = ['toggle', 'toggle', 'toggle', 'input','input','toggle','toggle'];
    }

    /**
    * Initialize the workload module with the given parameters.
    * @param {number} workerIndex The 0-based index of the worker instantiating the workload module.
    * @param {number} totalWorkers The total number of workers participating in the round.
    * @param {number} roundIndex The 0-based index of the currently executing round.
    * @param {Object} roundArguments The user-provided arguments for the round from the benchmark configuration file.
    * @param {ConnectorBase} sutAdapter The adapter of the underlying SUT.
    * @param {Object} sutContext The custom context object provided by the SUT adapter.
    * @async
    */
    async initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext) {
        await super.initializeWorkloadModule(workerIndex, totalWorkers, roundIndex, roundArguments, sutAdapter, sutContext);
    }
    async submitTransaction() {
        this.txIndex++;

        const assetID = this.assetIDs[this.txIndex % this.assetIDs.length];
        let nameone = this.name[this.txIndex % this.name.length];
        // let size = (((this.txIndex % 10) + 1) * 10).toString(); // [10, 100]
        let dt = this.deviceType[this.txIndex % this.deviceType.length];
        // let appraisedValue = Math.floor(Math.random() * (1000 - 200 + 1) + 200) // random number between 200 and 1000

        const request = {
            // contractId: this.roundArguments.contractId,
            contractId: 'KVContract',
            contractFunction: 'addDevice',
            invokerIdentity: 'Admin',
            contractArguments: [assetID, nameone, dt],
            readOnly: false
        };

        await this.sutAdapter.sendRequests(request);
    }

}

function createWorkloadModule() {
    return new MyWorkload();
}

module.exports.createWorkloadModule = createWorkloadModule;