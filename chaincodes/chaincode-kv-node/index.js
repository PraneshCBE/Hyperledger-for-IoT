const { Contract } = require("fabric-contract-api");
const nodemailer = require("nodemailer");
var limitPerDay ;
var alert_mail;
var alert_timings;
class KVContract extends Contract {
  constructor() {
    super("KVContract");
    limitPerDay = 5;
    alert_mail = "lalithg96@gmail.com";
    alert_timings = [0, 4];
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
    this.sendEmailAlert(ctx, alert_mail, "New Device Added", `🏠 Device with IP: ${ip} is added to ${OrgName} 👨‍💻\n⚙️ at ${timestamp.toLocaleString(undefined,{timeZone:'Asia/Kolkata'})} \n\nName: ${name} \nAction Type: ${actionType} \n `);

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
    const timestamp = new Date();
    asset.status = status;
    asset.value = value;
    asset.lastInvoker = invoker;
    asset.lastInvokedTime = timestamp.toLocaleString(undefined,{timeZone:'Asia/Kolkata'});
    const buffer = Buffer.from(JSON.stringify(asset));
    await ctx.stub.putState(ip, buffer);

    if (alert_timings[0]<=timestamp.getHours() && timestamp.getHours()<=alert_timings[1]){
      this.sendEmailAlert(ctx, alert_mail, "Device Alert", `🏠 Device with IP: ${ip} is invoked by ${invoker} 👨‍💻\n ⚙️ at ${timestamp.toLocaleString(undefined,{timeZone:'Asia/Kolkata'})}`);
    }
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
    asset.lastInvokedTime = new Date().toLocaleString(undefined,{timeZone:'Asia/Kolkata'});
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
    this.sendEmailAlert(ctx, alert_mail, "Device Deleted", `🏠 Device with IP: ${ip} is deleted by ${creator} 👨‍💻\n⚙️ at ${new Date().toLocaleString(undefined,{timeZone:'Asia/Kolkata'})}`);

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
    this.sendEmailAlert(ctx, alert_mail, "Limit Changed", `🏠 Limit per day is changed to ${limit} by ${creator} 👨‍💻\n⚙️ at ${new Date().toLocaleString(undefined,{timeZone:'Asia/Kolkata'})}`);
    return "Limit changed successfully";
  }
  
  async sendEmailAlert(ctx, email, subject, message){
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: "rvpspran@gmail.com",
        pass: "jydk tgaz wepv mstb",
      },
    });
    const mailOptions = {
      from: "rvpspran@gmail.com",
      to: email,
      subject: subject,
      text: message,
    };
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return "Error";
      } else {
        return "Email sent successfully";
      }
    });
  }

  async changeAlertTimings(ctx, start, end){
    const creator = await this.getCreator(ctx);
    if (creator !== "admin"){
      throw new Error(`Only Admin can perform this action!`);
    }
    alert_timings[0] = parseInt(start); 
    alert_timings[1] = parseInt(end);
    this.sendEmailAlert(ctx, alert_mail, "Alert Timings Changed", `🏠 Alert Timings are changed to ${start} to ${end} by ${creator} 👨‍💻\n⚙️ at ${new Date().toLocaleString(undefined,{timeZone:'Asia/Kolkata'})}`);
    return "Alert Timings changed successfully";
  }

  async getAlertTimings(ctx){
    return JSON.stringify(alert_timings);
  }
  async getLimitPerDay(ctx){
    return limitPerDay;
  }
  async getAlertMail(ctx){
    return alert_mail;
  }
  async setAlertMail(ctx, email){
    const creator = await this.getCreator(ctx);
    if (creator !== "admin"){
      throw new Error(`Only Admin can perform this action!`);
    }
    alert_mail = email;
    this.sendEmailAlert(ctx, alert_mail, "Alert Mail Changed", `🏠 Alert Mail is changed to ${email} by ${creator} 👨‍💻\⚙️ at ${new Date().toLocaleString(undefined,{timeZone:'Asia/Kolkata'})}`);
    return "Alert Mail changed successfully";
  }


}
exports.contracts = [KVContract];
