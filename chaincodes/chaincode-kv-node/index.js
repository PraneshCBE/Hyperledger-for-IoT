const { Contract } = require("fabric-contract-api");
const crypto = require("crypto");
const { get } = require("http");
var limitPerDay = 5;
class KVContract extends Contract {
  constructor() {
    super("KVContract");
  }
  
  async deviceExists(ctx, ip) {
    const buffer = await ctx.stub.getState(ip);
    return !!buffer && buffer.length > 0;
  }

  async addDevice(ctx, ip, name, actionType){

    const exists = await this.deviceExists(ctx, ip);
    if (exists) {
      throw new Error(`The device already exists`);
    }

    const OrgName = ctx.clientIdentity.getMSPID();
    const timestamp = new Date();
    const asset = {
      ip:ip,
      name: name,
      orgName: OrgName,
      status:"OFF",
      value: 0,
      lastInvoker: "INIT",
      lastInvokedTime: timestamp.toLocaleString(undefined,{timeZone:'Asia/Kolkata'}),
      actionType: actionType
    }
    const buffer = Buffer.from(JSON.stringify(asset));
    await ctx.stub.putState(ip, buffer);
    return "Device added successfully";
  }

  async checkDeviceInvokesLimitPerDay(ctx, ip){
    const deviceHistory = await this.getDeviceHistoryByIp(ctx, ip);
    const deviceHistoryJson = JSON.parse(deviceHistory);
    const today = new Date();
    const todayDate = today.getDate();
    let count = 0;
    for(let i=0; i<deviceHistoryJson.length; i++){
      const history = deviceHistoryJson[i].Record;
      const historyDate = new Date(history.lastInvokedTime).getDate();
      if(todayDate === historyDate){
        count++;
      }
    }
    if (count>=limitPerDay){
      return true
    }
    return false
  }

  async performAction(ctx, ip, status, value, invoker){
    const exists = await this.deviceExists(ctx, ip);
    if (!exists) {
      throw new Error(`The device does not exist`);
    }
    const isLimitExceeded = await this.checkDeviceInvokesLimitPerDay(ctx, ip);
    if (isLimitExceeded){
      throw new Error(`The device invokes limit exceeded for today! Ask Admin to perform action!`);
    }
    const assetString = await ctx.stub.getState(ip);
    const asset = JSON.parse(assetString.toString());
    asset.status = status;
    asset.value = value;
    asset.lastInvoker = invoker;
    const buffer = Buffer.from(JSON.stringify(asset));
    await ctx.stub.putState(ip, buffer);
    return "Action performed successfully";
  }

  async getCreator(ctx){
    const client = ctx.clientIdentity.getID();
    let CN = client.split("CN=");
    CN = CN[1].split("::");
    return CN[0];
  }

  async performActionByAdmin(ctx, ip, status, value, invoker){
    const exists = await this.deviceExists(ctx, ip);
    if (!exists) {
      throw new Error(`The device does not exist`);
    }
    const creator = await this.getCreator(ctx);
    if (invoker !== "admin" || creator !== "admin"){
      throw new Error(`Only Admin can perform this action!`);
    }
    const assetString = await ctx.stub.getState(ip);
    const asset = JSON.parse(assetString.toString());
    asset.status = status;
    asset.value = value;
    asset.lastInvoker = invoker;
    const buffer = Buffer.from(JSON.stringify(asset));
    await ctx.stub.putState(ip, buffer);
    return "Action performed successfully";
  }

  async deleteDevice(ctx, ip){
    const creator = await this.getCreator(ctx);
    if (creator !== "admin"){
      throw new Error(`Only Admin can perform this action!`);
    }
    const exists = await this.deviceExists(ctx, ip);
    if (!exists) {
      throw new Error(`The device does not exist`);
    }
    await ctx.stub.deleteState(ip);
    return "Device deleted successfully";
  }

  async getAllDevices(ctx){
    const startKey = "";
    const endKey = "";
    const allResults = [];
    for await (const {key, value} of ctx.stub.getStateByRange(startKey, endKey)) {
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
    return JSON.stringify(allResults);
  }

  async getDeviceByIp(ctx, ip){
    const exists = await this.deviceExists(ctx, ip);
    if (!exists) {
      throw new Error(`The device does not exist`);
    }
    const assetString = await ctx.stub.getState(ip);
    const asset = JSON.parse(assetString.toString());
    return JSON.stringify(asset);
  }

  async getDeviceHistoryByIp(ctx, ip){
    const exists = await this.deviceExists(ctx, ip);
    if (!exists) {
      throw new Error(`The device does not exist`);
    }
    const resultsIterator = await ctx.stub.getHistoryForKey(ip);
    const allResults = [];
    while (true) {
      const res = await resultsIterator.next();
      if (res.value && res.value.value.toString()) {
        let jsonRes;
        try {
          jsonRes = JSON.parse(res.value.value.toString("utf8"));
        } catch (err) {
          console.log(err);
          jsonRes = res.value.value.toString("utf8");
        }
        allResults.push({ TxId: res.value.tx_id, Record: jsonRes });
      }
      if (res.done) {
        await resultsIterator.close();
        return JSON.stringify(allResults);
      }
    }
    
  }
  
  async getDeviceStatus(ctx, ip){
    const exists = await this.deviceExists(ctx, ip);
    if (!exists) {
      throw new Error(`The device does not exist`);
    }
    const assetString = await ctx.stub.getState(ip);
    const asset = JSON.parse(assetString.toString());
    return asset.status;
  }

  async getDevicesByStatus(ctx, status){
    const startKey = "";
    const endKey = "";
    const allResults = [];
    for await (const {key, value} of ctx.stub.getStateByRange(startKey, endKey)) {
      const strValue = Buffer.from(value).toString("utf8");
      let record;
      try {
        record = JSON.parse(strValue);
      } catch (err) {
        console.log(err);
        record = strValue;
      }
      if(record.status === status){
        allResults.push({ Key: key, Record: record });
      }
    }
    return JSON.stringify(allResults);
  }

  async changeLimitsPerDay(ctx, limit){
    const creator = await this.getCreator(ctx);
    if (creator !== "admin"){
      throw new Error(`Only Admin can perform this action!`);
    }
    limitPerDay = limit;
    return "Limit changed successfully";
  }
  
}
exports.contracts = [KVContract];
