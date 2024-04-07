const { Contract } = require("fabric-contract-api");
const crypto = require("crypto");

class KVContract extends Contract {
  constructor() {
    super("KVContract");
  }

  async instantiate() {
    // function that will be invoked on chaincode instantiation
  }

  async put(ctx, key, value) {
    await ctx.stub.putState(key, Buffer.from(value));
    return { success: "OK" };
  }

  async get(ctx, key) {
    const buffer = await ctx.stub.getState(key);
    if (!buffer || !buffer.length) return { error: "NOT_FOUND" };
    return { success: buffer.toString() };
  }

  async putPrivateMessage(ctx, collection) {
    const transient = ctx.stub.getTransient();
    const message = transient.get("message");
    await ctx.stub.putPrivateData(collection, "message", message);
    return { success: "OK" };
  }

  async getPrivateMessage(ctx, collection) {
    const message = await ctx.stub.getPrivateData(collection, "message");
    const messageString = message.toBuffer ? message.toBuffer().toString() : message.toString();
    return { success: messageString };
  }

  async verifyPrivateMessage(ctx, collection) {
    const transient = ctx.stub.getTransient();
    const message = transient.get("message");
    const messageString = message.toBuffer ? message.toBuffer().toString() : message.toString();
    const currentHash = crypto.createHash("sha256").update(messageString).digest("hex");
    const privateDataHash = (await ctx.stub.getPrivateDataHash(collection, "message")).toString("hex");
    if (privateDataHash !== currentHash) {
      return { error: "VERIFICATION_FAILED" };
    }
    return { success: "OK" };
  }
  async recordAction(ctx, deviceId, actionType) {
    const timestamp = new Date();

    const action = {
      deviceId: deviceId,
      actionType: actionType,
      timestamp: timestamp.toLocaleString(undefined,{timeZone:'Asia/Kolkata'})
    };

    await ctx.stub.putState(deviceId, Buffer.from(JSON.stringify(action)));
    return { success: "Action recorded successfully" };
  }

  async addDevice(ctx, deviceId, deviceName) 
  {
    await ctx.stub.putState(deviceId, Buffer.from(deviceName));
    return { success: "Device added successfully" };
  }

  async getDevice(ctx, deviceId) {
    const buffer = await ctx.stub.getState(deviceId);
    if (!buffer || !buffer.length) return { error: "Device not found" };
    return { success: buffer.toString() };
  }

  async getAllDevices(ctx) {
    const startKey = "";
    const endKey = "";
    const allResults = [];
    for await (const { key, value } of ctx.stub.getStateByRange(startKey, endKey)) {
      const strValue = Buffer.from(value).toString("utf8");
      let record;
      try {
        record = JSON.parse(strValue);
      } catch (err) {
        console.log(err);
        record = strValue;
      }
      allResults.push({ Key: key, Record: record });
    }
    return { success: allResults };
  }
}

exports.contracts = [KVContract];
