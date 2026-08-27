import { Customer, Status } from "./types";
const names=["Alice Green","Bob Ross","Charlie Davis","Diana Brooks","Evan Stone","Fiona Carter","George Hall","Hannah Lee","Iris Moore","John Ross","Kelly Young","Liam Scott","Mia Clark","Noah Adams","Olivia King","Paul Reed","Quinn Baker","Ruby Wood","Sam Hill","Tara Fox","Uma Gray","Victor Cole","Wendy Hart","Xavier Lane","Yara James","Zane Bell"];
const companies=["Acme Corp","Globex","Stark Industries","Innovatech","Campressia","Cavari Corp"];
const statuses:Status[]=["Active","Prospect","Lead","Inactive","Archive"];
export const seedCustomers:Customer[]=Array.from({length:150},(_,i)=>({id:`c-${i+1}`,name:names[i%names.length],email:`${names[i%names.length].toLowerCase().replaceAll(" ",".")}${i+1}@example.com`,phone:`+1 (555) ${String(100+i).padStart(3,"0")}-${String(1000+i).slice(-4)}`,company:companies[i%companies.length],status:statuses[i%statuses.length],lastContact:`2026-${String((i%12)+1).padStart(2,"0")}-${String((i%27)+1).padStart(2,"0")}`,notes:"Follow-up notes and customer interaction history.",createdAt:`2026-${String((i%12)+1).padStart(2,"0")}-01`}));
export const companyOptions=companies;
