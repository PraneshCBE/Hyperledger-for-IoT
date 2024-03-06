const { Contract } = require("fabric-contract-api");
const crypto = require("crypto");

class IoTSecurityContract extends Contract {
  constructor() {
    super("IoTSecurityContract");
  }

  async instantiate(ctx) {
    console.log("IoT Security Contract Instantiated");
  }

  async authorizeUser(ctx, userId) {
       //Want discuss about the users ---- So for now, allowing all users
    return true;
  }

  async recordAction(ctx, deviceId, actionType, additionalDetails) {
    const timestamp = new Date();
    const transactionId = ctx.stub.getTxID();
    const participantId = ctx.clientIdentity.getID();

    const action = {
      deviceId: deviceId,
      actionType: actionType,
      additionalDetails: additionalDetails,
      timestamp: timestamp.toISOString(),
      transactionId: transactionId,
      participantId: participantId,
    };

    await ctx.stub.putState(transactionId, Buffer.from(JSON.stringify(action)));
  }

  async performAction(ctx, deviceId, actionType, additionalDetails) {
    // here checking for user --- whether allowed to do that action
    const isAuthorized = await this.authorizeUser(ctx, ctx.clientIdentity.getID());
    if (!isAuthorized) {
      return { error: "UNAUTHORIZED" };
    }

    // putting in ledger
    await this.recordAction(ctx, deviceId, actionType, additionalDetails);

    return { success: "Action recorded successfully" };
  }

	//just thought of cameras on or off...
  async activateDevice(ctx, deviceId) {
  
    return this.performAction(ctx, deviceId, "ACTIVATE", "Device activated");
  }

  async deactivateDevice(ctx, deviceId) {
    return this.performAction(ctx, deviceId, "DEACTIVATE", "Device deactivated");
  }

	//see if needed ...or else aproma thookiklaam
  async updateConfiguration(ctx, deviceId, newConfiguration) {
    return this.performAction(ctx, deviceId, "UPDATE_CONFIGURATION", `Configuration updated to ${newConfiguration}`);
  }

  async getDeviceHistory(ctx, deviceId) {
    const historyIterator = await ctx.stub.getHistoryForKey(deviceId);
    const history = [];

    while (true) {
      const historyRecord = await historyIterator.next();

      if (historyRecord.value && historyRecord.value.value.toString()) {
        const transaction = JSON.parse(historyRecord.value.value.toString('utf8'));
        history.push(transaction);
      }

      if (historyRecord.done) {
        await historyIterator.close();
        return history;
      }
    }
  }
}

exports.contracts = [IoTSecurityContract];

