"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaveStatus = exports.EmployeeStatus = exports.UserStatus = exports.Role = void 0;
var Role;
(function (Role) {
    Role["ADMIN"] = "ADMIN";
    Role["HR"] = "HR";
    Role["EMPLOYEE"] = "EMPLOYEE";
})(Role || (exports.Role = Role = {}));
var UserStatus;
(function (UserStatus) {
    UserStatus["ACTIVE"] = "active";
    UserStatus["LOCKED"] = "locked";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
var EmployeeStatus;
(function (EmployeeStatus) {
    EmployeeStatus["ACTIVE"] = "active";
    EmployeeStatus["RESIGNED"] = "resigned";
})(EmployeeStatus || (exports.EmployeeStatus = EmployeeStatus = {}));
var LeaveStatus;
(function (LeaveStatus) {
    LeaveStatus["PENDING"] = "pending";
    LeaveStatus["APPROVED"] = "approved";
    LeaveStatus["REJECTED"] = "rejected";
})(LeaveStatus || (exports.LeaveStatus = LeaveStatus = {}));
