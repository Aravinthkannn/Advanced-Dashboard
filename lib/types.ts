export type Status = "Active" | "Inactive" | "Prospect" | "Lead" | "Archive";
export type Customer = { id:string; name:string; email:string; phone:string; company:string; status:Status; lastContact:string; notes:string; createdAt:string; };
export type Filters = { statuses:Status[]; companies:string[]; from:string; to:string; phone:string; email:string; };
export type SavedFilter = { id:string; name:string; filters:Filters; };
