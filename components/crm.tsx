"use client";
import { useEffect, useMemo, useState } from "react";
import { useMutation,useQuery,useQueryClient } from "@tanstack/react-query";
import { createCustomer,deleteCustomer,getCustomers,updateCustomer,updateMany } from "@/lib/customer-api";
import { Customer,Filters,SavedFilter,Status } from "@/lib/types";
import { companyOptions } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet,SheetContent,SheetTrigger } from "@/components/ui/sheet";
import { Dialog,DialogContent,DialogHeader,DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select,SelectContent,SelectItem,SelectTrigger,SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useTheme } from "next-themes";
import { DndContext,closestCenter,DragEndEvent } from "@dnd-kit/core";
import { SortableContext,verticalListSortingStrategy,useSortable,arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Search,SlidersHorizontal,Plus,Edit3,Trash2,ChevronUp,ChevronDown,ChevronLeft,ChevronRight,Sun,Moon,Download,Users,Phone,Activity,Command,Save,GripVertical,CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const emptyFilters:Filters={statuses:[],companies:[],from:"",to:"",phone:"",email:""};
const statusList:Status[]=["Active","Inactive","Prospect","Lead","Archive"];

function SortableFilter({item,onClick}:{item:SavedFilter;onClick:()=>void}){const {attributes,listeners,setNodeRef,transform,transition}=useSortable({id:item.id});return <div ref={setNodeRef} style={{transform:CSS.Transform.toString(transform),transition}} className="flex items-center gap-2 rounded-md border bg-background p-2"><button {...attributes} {...listeners} aria-label="Drag filter" className="text-muted-foreground"><GripVertical className="h-4 w-4"/></button><button className="flex-1 text-left text-sm hover:text-primary" onClick={onClick}>{item.name}</button></div>}

export function CRM(){
 const qc=useQueryClient(); const {theme,setTheme}=useTheme();
 const {data:customers=[],isLoading,isError}=useQuery({queryKey:["customers"],queryFn:getCustomers});
 const [search,setSearch]=useState(""); const [debounced,setDebounced]=useState(""); const [filters,setFilters]=useState<Filters>(emptyFilters);
 const [sort,setSort]=useState<{key:keyof Customer;dir:"asc"|"desc"}>({key:"name",dir:"asc"});
 const [page,setPage]=useState(1); const [pageSize,setPageSize]=useState("10");
 const [filterOpen,setFilterOpen]=useState(false); const [editing,setEditing]=useState<Customer|null>(null); const [details,setDetails]=useState<Customer|null>(null); const [formOpen,setFormOpen]=useState(false);
 const [selected,setSelected]=useState<string[]>([]); const [bulkStatus,setBulkStatus]=useState<Status>("Active");
 const [saved,setSaved]=useState<SavedFilter[]>([]); const [cmdOpen,setCmdOpen]=useState(false);
 useEffect(()=>{const t=setTimeout(()=>setDebounced(search),300);return()=>clearTimeout(t)},[search]);
 useEffect(()=>{const raw=localStorage.getItem("crm-saved-filters");if(raw)try{setSaved(JSON.parse(raw))}catch{}},[]);
 useEffect(()=>{localStorage.setItem("crm-saved-filters",JSON.stringify(saved))},[saved]);
 useEffect(()=>{const fn=(e:KeyboardEvent)=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();setCmdOpen(v=>!v)}if(e.key==="Escape"){setCmdOpen(false)}};window.addEventListener("keydown",fn);return()=>window.removeEventListener("keydown",fn)},[]);
 const activeCount=filters.statuses.length+filters.companies.length+(filters.from?1:0)+(filters.to?1:0)+(filters.phone?1:0)+(filters.email?1:0);
 const filtered=useMemo(()=>customers.filter(c=>{
   const q=debounced.toLowerCase().trim(); if(q&&!`${c.name} ${c.email} ${c.company}`.toLowerCase().includes(q))return false;
   if(filters.statuses.length&&!filters.statuses.includes(c.status))return false;
   if(filters.companies.length&&!filters.companies.includes(c.company))return false;
   if(filters.from&&c.lastContact<filters.from)return false;if(filters.to&&c.lastContact>filters.to)return false;
   if(filters.phone&&!c.phone.toLowerCase().includes(filters.phone.toLowerCase()))return false;
   if(filters.email&&!c.email.toLowerCase().includes(filters.email.toLowerCase()))return false;return true;
 }),[customers,debounced,filters]);
 const sorted=useMemo(()=>[...filtered].sort((a,b)=>{const av=String(a[sort.key]),bv=String(b[sort.key]);const r=av.localeCompare(bv,undefined,{numeric:true});return sort.dir==="asc"?r:-r}),[filtered,sort]);
 const size=Number(pageSize), pages=Math.max(1,Math.ceil(sorted.length/size)); const rows=sorted.slice((page-1)*size,page*size);
 useEffect(()=>{if(page>pages)setPage(pages)},[pages,page]);
 const create=useMutation({mutationFn:createCustomer,onSuccess:()=>{qc.invalidateQueries({queryKey:["customers"]});setFormOpen(false);toast.success("Customer added successfully")},onError:()=>toast.error("Unable to add customer")});
 const update=useMutation({mutationFn:updateCustomer,onSuccess:()=>{qc.invalidateQueries({queryKey:["customers"]});setEditing(null);setFormOpen(false);toast.success("Customer updated")},onError:()=>toast.error("Unable to update customer")});
 const del=useMutation({mutationFn:deleteCustomer,onSuccess:()=>{qc.invalidateQueries({queryKey:["customers"]});toast.success("Customer deleted")},onError:()=>toast.error("Unable to delete customer")});
 const bulk=useMutation({mutationFn:({ids,status}:{ids:string[];status:Status})=>updateMany(ids,{status}),onSuccess:()=>{qc.invalidateQueries({queryKey:["customers"]});setSelected([]);toast.success("Bulk status updated")}});
 const toggleSort=(key:keyof Customer)=>setSort(s=>s.key===key?{key,dir:s.dir==="asc"?"desc":"asc"}:{key,dir:"asc"});
 const clear=()=>{setFilters(emptyFilters);setPage(1)}; const apply=(f:Filters)=>{setFilters(f);setPage(1);setFilterOpen(false)};
 const saveFilter=()=>{const name=prompt("Name for this filter");if(!name?.trim())return;setSaved(s=>[...s,{id:crypto.randomUUID(),name:name.trim(),filters}]);toast.success("Filter saved")};
 const drag=(e:DragEndEvent)=>{if(!e.over||e.active.id===e.over.id)return;setSaved(s=>{const old=s.findIndex(x=>x.id===e.active.id),next=s.findIndex(x=>x.id===e.over!.id);return arrayMove(s,old,next)})};
 const exportCsv=()=>{const head=["Name","Email","Phone","Company","Status","Last Contact Date"];const lines=sorted.map(c=>[c.name,c.email,c.phone,c.company,c.status,c.lastContact].map(v=>`"${v.replaceAll('"','""')}"`).join(","));const blob=new Blob([[head.join(","),...lines].join("\\n")],{type:"text/csv"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="customers.csv";a.click();URL.revokeObjectURL(url);toast.success("CSV exported")};
 if(isLoading)return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Loading CRM…</div>;
 if(isError)return <div className="flex min-h-screen items-center justify-center text-red-400">Could not load customers. Refresh to try again.</div>;
 return <div className="min-h-screen bg-background">
  <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur"><div className="flex h-16 items-center gap-4 px-4 lg:px-6">
   <div className="flex items-center gap-2 font-semibold"><div className="rounded-lg bg-primary p-2"><Users className="h-4 w-4"/></div><span className="hidden sm:block">CRM</span></div>
   <div className="relative flex-1 max-w-xl"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"/><Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search CRM by name, email or company…" className="pl-9"/></div>
   <Button variant="outline" size="sm" className="hidden sm:flex" onClick={()=>setFilterOpen(true)}><SlidersHorizontal className="h-4 w-4"/>Filters{activeCount>0&&<span className="rounded-full bg-primary px-2 py-0.5 text-xs">{activeCount}</span>}</Button>
   <Button variant="outline" size="icon" onClick={()=>setTheme(theme==="dark"?"light":"dark")} aria-label="Toggle theme">{theme==="dark"?<Sun className="h-4 w-4"/>:<Moon className="h-4 w-4"/>}</Button>
   <Button variant="outline" size="sm" onClick={()=>setCmdOpen(true)} className="hidden md:flex"><Command className="h-4 w-4"/>K</Button>
  </div></header>
  <main className="mx-auto max-w-[1500px] space-y-5 p-4 lg:p-6">
   <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
    <Stat icon={<Users/>} title="Total Customers" value={customers.length.toLocaleString()} trend="+3.2% ↑ Green"/>
    <Stat icon={<Activity/>} title="Active" value={customers.filter(c=>c.status==="Active").length.toLocaleString()} trend="+5.8% ↑ Green"/>
    <Stat icon={<Phone/>} title="Contacted This Week" value={Math.min(customers.length,Math.max(0,customers.filter(c=>new Date(c.lastContact)>=new Date(Date.now()-7*86400000)).length)).toLocaleString()} trend="+1.5% ↑ Green"/>
   </section>
   <section className="crm-panel overflow-hidden">
    <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
      <div><h1 className="text-xl font-semibold">Customers</h1><p className="text-sm text-muted-foreground">{filtered.length} matching customers</p></div>
      <div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={exportCsv}><Download className="h-4 w-4"/>Export CSV</Button><Button variant="outline" size="sm" onClick={()=>setFilterOpen(true)} className="sm:hidden"><SlidersHorizontal className="h-4 w-4"/>Filters {activeCount>0&&`(${activeCount})`}</Button><Button onClick={()=>{setEditing(null);setFormOpen(true)}}><Plus className="h-4 w-4"/>Add Customer</Button></div>
    </div>
    {selected.length>0&&<div className="flex flex-wrap items-center gap-2 border-b bg-muted/50 p-3"><span className="text-sm font-medium">{selected.length} selected</span><Select value={bulkStatus} onValueChange={v=>setBulkStatus(v as Status)}><SelectTrigger className="w-40"><SelectValue/></SelectTrigger><SelectContent>{statusList.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select><Button size="sm" onClick={()=>bulk.mutate({ids:selected,status:bulkStatus})}>Apply status</Button><Button size="sm" variant="ghost" onClick={()=>setSelected([])}>Clear</Button></div>}
    <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground"><tr>
      <th className="w-10 p-3"><Checkbox checked={rows.length>0&&rows.every(r=>selected.includes(r.id))} onCheckedChange={v=>setSelected(v?Array.from(new Set([...selected,...rows.map(r=>r.id)])):selected.filter(id=>!rows.some(r=>r.id===id)))} /></th>
      {(["name","email","phone","company","status","lastContact"] as (keyof Customer)[]).map(k=><th key={k} className="cursor-pointer p-3" onClick={()=>toggleSort(k)}><span className="inline-flex items-center gap-1">{k==="lastContact"?"Last Contact":k[0].toUpperCase()+k.slice(1)}{sort.key===k&&(sort.dir==="asc"?<ChevronUp className="h-3 w-3"/>:<ChevronDown className="h-3 w-3"/>)}</span></th>)}<th className="p-3 text-right">Actions</th></tr></thead>
      <tbody>{rows.map(c=><tr key={c.id} className="border-b last:border-0 hover:bg-muted/30">
        <td className="p-3"><Checkbox checked={selected.includes(c.id)} onCheckedChange={v=>setSelected(v?[...selected,c.id]:selected.filter(id=>id!==c.id))}/></td>
        <td className="p-3"><button className="text-left font-medium hover:text-primary" onClick={()=>setDetails(c)}>{c.name}</button></td><td className="p-3 whitespace-nowrap">{c.email}</td><td className="p-3 whitespace-nowrap">{c.phone}</td><td className="p-3">{c.company}</td><td className="p-3"><StatusBadge status={c.status}/></td><td className="p-3 whitespace-nowrap">{c.lastContact}</td>
        <td className="p-3 text-right"><div className="flex justify-end gap-1"><Button size="icon" variant="ghost" onClick={()=>{setEditing(c);setFormOpen(true)}}><Edit3 className="h-4 w-4"/></Button><Button size="icon" variant="ghost" onClick={()=>{if(confirm(`Delete ${c.name}?`))del.mutate(c.id)}}><Trash2 className="h-4 w-4 text-red-400"/></Button></div></td>
      </tr>)}</tbody></table></div>
    <div className="flex flex-col gap-3 border-t p-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><span>Showing {sorted.length===0?0:(page-1)*size+1}–{Math.min(page*size,sorted.length)} of {sorted.length}</span><div className="flex items-center gap-2"><Select value={pageSize} onValueChange={v=>{setPageSize(v);setPage(1)}}><SelectTrigger className="w-24"><SelectValue/></SelectTrigger><SelectContent>{["10","25","50"].map(s=><SelectItem key={s} value={s}>{s}/page</SelectItem>)}</SelectContent></Select><Button variant="outline" size="icon" disabled={page===1} onClick={()=>setPage(p=>p-1)}><ChevronLeft/></Button><span className="px-2">{page} / {pages}</span><Button variant="outline" size="icon" disabled={page===pages} onClick={()=>setPage(p=>p+1)}><ChevronRight/></Button></div></div>
   </section>
  </main>
  <Sheet open={filterOpen} onOpenChange={setFilterOpen}><SheetContent><FilterPanel filters={filters} setFilters={setFilters} onApply={()=>apply(filters)} onClear={clear} onSave={saveFilter} saved={saved} onUse={f=>apply(f)} onDrag={drag}/></SheetContent></Sheet>
  <CustomerForm open={formOpen} onOpenChange={setFormOpen} customer={editing} busy={create.isPending||update.isPending} onSubmit={v=>editing?update.mutate({...editing,...v}):create.mutate(v)}/>
  <Dialog open={!!details} onOpenChange={v=>!v&&setDetails(null)}><DialogContent><DialogHeader><DialogTitle>Customer Details</DialogTitle></DialogHeader>{details&&<div className="space-y-5"><div className="flex items-start justify-between"><div><h3 className="text-xl font-semibold">{details.name}</h3><p className="text-muted-foreground">{details.company}</p></div><StatusBadge status={details.status}/></div><div className="grid gap-4 sm:grid-cols-2"><Info label="Email" value={details.email}/><Info label="Phone" value={details.phone}/><Info label="Last Contact" value={details.lastContact}/><Info label="Created" value={details.createdAt}/></div><div><div className="muted-label mb-2">Notes & Interactions</div><div className="rounded-lg border bg-background p-4 text-sm">{details.notes||"No notes added."}</div></div><Button className="w-full" onClick={()=>{setEditing(details);setDetails(null);setFormOpen(true)}}><Edit3 className="h-4 w-4"/>Edit Customer</Button></div>}</DialogContent></Dialog>
  <Dialog open={cmdOpen} onOpenChange={setCmdOpen}><DialogContent><DialogHeader><DialogTitle>Quick Actions</DialogTitle></DialogHeader><div className="grid gap-2">{[["Open filters",()=>setFilterOpen(true)],["Add customer",()=>{setEditing(null);setFormOpen(true)}],["Export CSV",exportCsv],["Clear filters",clear]].map(([label,fn])=><Button key={String(label)} variant="outline" className="justify-start" onClick={()=>{(fn as ()=>void)();setCmdOpen(false)}}>{String(label)}</Button>)}</div></DialogContent></Dialog>
 </div>
}

function Stat({icon,title,value,trend}:{icon:React.ReactNode;title:string;value:string;trend:string}){return <div className="crm-panel p-5"><div className="mb-3 flex items-center gap-3 text-muted-foreground"><span className="rounded-lg bg-primary/15 p-2 text-primary">{icon}</span><span>{title}</span></div><div className="text-3xl font-semibold">{value}</div><div className="mt-1 text-xs text-emerald-400">Trend · {trend}</div></div>}
function StatusBadge({status}:{status:Status}){return <span className="inline-flex rounded-full border px-2 py-0.5 text-xs">{status}</span>}
function Info({label,value}:{label:string;value:string}){return <div><div className="muted-label mb-1">{label}</div><div>{value}</div></div>}

function FilterPanel({filters,setFilters,onApply,onClear,onSave,saved,onUse,onDrag}:{filters:Filters;setFilters:React.Dispatch<React.SetStateAction<Filters>>;onApply:()=>void;onClear:()=>void;onSave:()=>void;saved:SavedFilter[];onUse:(f:Filters)=>void;onDrag:(e:DragEndEvent)=>void}){
 const toggle=(key:"statuses"|"companies",value:string)=>setFilters(f=>({...f,[key]:f[key].includes(value as never)?f[key].filter(x=>x!==value):[...f[key],value] as never}));
 return <div className="space-y-6"><div><h2 className="text-lg font-semibold">Advanced Filters</h2><p className="text-sm text-muted-foreground">Combine filters with search.</p></div>
  <div className="space-y-3"><div className="flex items-center justify-between"><Label>Status</Label><Button variant="ghost" size="sm" onClick={()=>setFilters(f=>({...f,statuses:[]}))}>Clear</Button></div>{statusList.map(s=><label key={s} className="flex items-center gap-2 text-sm"><Checkbox checked={filters.statuses.includes(s)} onCheckedChange={()=>toggle("statuses",s)}/>{s}</label>)}</div>
  <div className="space-y-3"><Label>Company</Label>{companyOptions.map(c=><label key={c} className="flex items-center gap-2 text-sm"><Checkbox checked={filters.companies.includes(c)} onCheckedChange={()=>toggle("companies",c)}/>{c}</label>)}</div>
  <div className="grid grid-cols-2 gap-3"><div><Label>From</Label><Input type="date" value={filters.from} onChange={e=>setFilters(f=>({...f,from:e.target.value}))}/></div><div><Label>To</Label><Input type="date" value={filters.to} onChange={e=>setFilters(f=>({...f,to:e.target.value}))}/></div></div>
  <div className="space-y-2"><Label>Phone contains</Label><Input value={filters.phone} onChange={e=>setFilters(f=>({...f,phone:e.target.value}))}/></div><div className="space-y-2"><Label>Email contains</Label><Input value={filters.email} onChange={e=>setFilters(f=>({...f,email:e.target.value}))}/></div>
  <div className="flex gap-2"><Button className="flex-1" onClick={onApply}><CheckCircle2 className="h-4 w-4"/>Apply Filters</Button><Button variant="outline" onClick={onClear}>Clear</Button></div><Button variant="outline" className="w-full" onClick={onSave}><Save className="h-4 w-4"/>Save Current Filter</Button>
  <div><div className="mb-2 flex items-center justify-between"><Label>Saved Filters</Label><span className="text-xs text-muted-foreground">drag to reorder</span></div><DndContext collisionDetection={closestCenter} onDragEnd={onDrag}><SortableContext items={saved.map(x=>x.id)} strategy={verticalListSortingStrategy}><div className="space-y-2">{saved.map(x=><SortableFilter key={x.id} item={x} onClick={()=>onUse(x.filters)}/>)}</div></SortableContext></DndContext></div>
  <div><Label className="mb-2 block">Pre-built Templates</Label><div className="grid gap-2">{[["Active Customers",{...emptyFilters,statuses:["Active"]}],["Recent Contacts",{...emptyFilters,from:new Date(Date.now()-30*86400000).toISOString().slice(0,10)}],["Inactive Leads",{...emptyFilters,statuses:["Inactive","Lead"]}]].map(([n,f])=><Button key={String(n)} variant="outline" className="justify-start" onClick={()=>onUse(f as Filters)}>{String(n)}</Button>)}</div></div>
 </div>
}

type FormValue=Omit<Customer,"id"|"createdAt">;
function CustomerForm({open,onOpenChange,customer,busy,onSubmit}:{open:boolean;onOpenChange:(v:boolean)=>void;customer:Customer|null;busy:boolean;onSubmit:(v:FormValue)=>void}){
 const [form,setForm]=useState<FormValue>({name:"",email:"",phone:"",company:"",status:"Active",lastContact:new Date().toISOString().slice(0,10),notes:""});
 useEffect(()=>{if(open)setForm(customer?{name:customer.name,email:customer.email,phone:customer.phone,company:customer.company,status:customer.status,lastContact:customer.lastContact,notes:customer.notes}:{name:"",email:"",phone:"",company:"",status:"Active",lastContact:new Date().toISOString().slice(0,10),notes:""})},[open,customer]);
 const [errors,setErrors]=useState<Record<string,string>>({});
 const change=(key:keyof FormValue,value:string)=>setForm(f=>({...f,[key]:value}));
 const submit=(e:React.FormEvent)=>{e.preventDefault();const e2:Record<string,string>={};if(!form.name.trim())e2.name="Name is required";if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))e2.email="Enter a valid email";if(!/^[+()0-9\s-]{7,}$/.test(form.phone))e2.phone="Enter a valid phone number";if(!form.company.trim())e2.company="Company is required";setErrors(e2);if(Object.keys(e2).length===0)onSubmit(form)};
 return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>{customer?"Edit Customer":"Add Customer"}</DialogTitle></DialogHeader><form onSubmit={submit} className="space-y-4">
  <Field label="Name *" error={errors.name}><Input value={form.name} onChange={e=>change("name",e.target.value)} placeholder="John Doe"/></Field>
  <Field label="Email *" error={errors.email}><Input type="email" value={form.email} onChange={e=>change("email",e.target.value)} placeholder="john@example.com"/></Field>
  <Field label="Phone *" error={errors.phone}><Input value={form.phone} onChange={e=>change("phone",e.target.value)} placeholder="+1 (555) 123-4567"/></Field>
  <Field label="Company *" error={errors.company}><Input value={form.company} onChange={e=>change("company",e.target.value)} placeholder="Acme Corp"/></Field>
  <div className="grid grid-cols-2 gap-3"><div><Label>Status</Label><Select value={form.status} onValueChange={v=>change("status",v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{statusList.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div><div><Label>Last Contact</Label><Input type="date" value={form.lastContact} onChange={e=>change("lastContact",e.target.value)}/></div></div>
  <div><Label>Notes</Label><Textarea value={form.notes} onChange={e=>change("notes",e.target.value)} placeholder="Meeting notes and follow-up items…"/></div>
  <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={()=>onOpenChange(false)}>Cancel</Button><Button type="submit" disabled={busy}>{busy?"Saving…":customer?"Save Changes":"Add Customer"}</Button></div>
 </form></DialogContent></Dialog>
}
function Field({label,error,children}:{label:string;error?:string;children:React.ReactNode}){return <div><Label>{label}</Label>{children}{error&&<p className="mt-1 text-xs text-red-400">{error}</p>}</div>}
