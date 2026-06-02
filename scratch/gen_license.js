const SALT = "EIGYM-V2-SECURE-";
const licenseObj = {
    machineId: "GLOBAL",
    validUntil: "2030-12-31T23:59:59.999Z",
    status: "active"
};
const jsonStr = JSON.stringify(licenseObj);
const combined = SALT + jsonStr;
const base64 = Buffer.from(combined).toString('base64');
console.log(base64);
