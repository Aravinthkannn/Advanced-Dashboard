import { Customer } from "./types";
import { seedCustomers } from "./data";
const KEY="advanced-crm-customers-v1";
const wait=(ms=220)=>new Promise(r=>setTimeout(r,ms));
function read():Customer[]{ if(typeof window==="undefined") return seedCustomers; const raw=localStorage.getItem(KEY); if(!raw){localStorage.setItem(KEY,JSON.stringify(seedCustomers));return seedCustomers;} try{return JSON.parse(raw)}catch{return seedCustomers;} }
function write(data:Customer[]){localStorage.setItem(KEY,JSON.stringify(data));}
export async function getCustomers(){await wait(); return read();}
export async function createCustomer(input:Omit<Customer,"id"|"createdAt">){await wait();const data=read();const customer:Customer={...input,id:`c-${crypto.randomUUID()}`,createdAt:new Date().toISOString().slice(0,10)};write([customer,...data]);return customer;}
export async function updateCustomer(customer:Customer){await wait();const data=read().map(c=>c.id===customer.id?customer:c);write(data);return customer;}
export async function deleteCustomer(id:string){await wait();write(read().filter(c=>c.id!==id));return id;}
export async function updateMany(ids:string[],patch:Partial<Customer>){await wait();const set=new Set(ids);const data=read().map(c=>set.has(c.id)?{...c,...patch}:c);write(data);return data;}
