const PASS_URL =
  "https://passadmin.coronasafe.network/apiv1/pass/travel-request-x";
const PASS_KEY = "AAXXZZSUPERAPPxxQy";
module.exports = {
  async sendPassIssueRequest(driver, vehicle) {
    vehicle = vehicle.dataValues;
    const axios = require("axios");
    let date = new Date();
    let data = {
      name: driver.name,
      phoneNumber: driver.phone,
      govtIdType: "VechcleNumber",
      govtId: vehicle.reg_no,
      dateFrom: `${date.getFullYear()}-${date.getMonth() +
        1}-${date.getDate()}`,
      dateTo: `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate() +
        1}`,
      reason: "Volunteer",
      status: "",
      timeFrom: "10:10",
      timeTo: "22:10",
      information: "Coronasafe logistics network",
      appKey: PASS_KEY,
      district: driver.district,
      routes: [
        { locationFrom: `${driver.district} DISTRICT`, locationTo: " " }
      ]
    };
    let response = await axios.post(`${PASS_URL}`, data, {}).catch(e => {
      console.log(e);
    });
    console.log("Pass response : ", response);
    return response;
  }
};
