import { useState, useRef, useEffect, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from "recharts";
import { createClient } from "@supabase/supabase-js";

const SUPA_URL = "https://ryxdkcrqmkilkqqqtmqa.supabase.co";
const SUPA_KEY = "sb_publishable_ooIIQXUhfwiojbAQuqmIxg_f7ChSLo7";
const sb = createClient(SUPA_URL, SUPA_KEY);
const ZAPI_ID    = "3F33B8B411B633FCEFFA4ADA414C2585";
const ZAPI_TOKEN = "8783A19C8DD838AC16F1F26B";
const ZAPI_URL   = `https://api.z-api.io/instances/${ZAPI_ID}/token/${ZAPI_TOKEN}`;
const sendWhatsApp = async (phone, message) => {
  const number = phone.replace(/\D/g,"");
  await fetch(`${ZAPI_URL}/send-text`, {
    method:"POST",
    headers:{"Content-Type":"application/json","Client-Token": ZAPI_TOKEN},
    body: JSON.stringify({ phone: number, message })
  });
};

const T = {
  bg:"#F4F1EC", surf:"#FDFCFA", card:"#FFFFFF", border:"#E8E2D9", borderD:"#D5CCBE",
  gold:"#8B6F3E", goldL:"#C4A265", text:"#1E1A15", textM:"#5C5349", textS:"#9B9189",
  green:"#2D6A4F", red:"#A63D2F", yellow:"#C98B2A",
  blue:"#2B5EA7", purple:"#6B3FA0", teal:"#1B7A6E", pink:"#A0395E", orange:"#B85C2A",
  shadow:"0 1px 3px rgba(0,0,0,0.05),0 3px 12px rgba(0,0,0,0.04)",
};

const ORIGINS  = ["WhatsApp","Instagram","Google","Site","Meta Ads","Indicação"];
const AREAS    = ["Civil","Trabalhista","Empresarial","Consumidor","Família","Tributário","Previdenciário"];
const STATUSES = ["Conversa Ativa","Em Andamento","Encerrado","Concluído"];
const ATENDIMENTO_COLS = [
  {id:"novo",     label:"Novo Contato",      color:"#2B5EA7"},
  {id:"conversa", label:"Em Conversa",       color:"#C4A265"},
  {id:"agendado", label:"Consulta Agendada", color:"#6B3FA0"},
  {id:"semresp",  label:"Não Respondeu",     color:"#A63D2F"},
];
const JURIDICO_COLS = [
  {id:"andamento", label:"Em Andamento", color:"#6B3FA0"},
  {id:"encerrado", label:"Encerrado",    color:"#9B9189"},
  {id:"concluido", label:"Concluído",    color:"#2D6A4F"},
];
const PIPELINE_COLS = [...ATENDIMENTO_COLS, ...JURIDICO_COLS];
const TAGS = [
  {id:"duvida",     label:"Dúvida",               color:"#6B3FA0"},
  {id:"viavel",     label:"Caso viável",           color:"#2D6A4F"},
  {id:"encaminhar", label:"Encaminhar defensoria", color:"#C98B2A"},
  {id:"agendar",    label:"Agendar consulta",      color:"#2B5EA7"},
];
const OC = {WhatsApp:T.green,Instagram:T.pink,Google:T.blue,Site:T.teal,"Meta Ads":T.purple,Indicação:T.gold};
const OI = {WhatsApp:"💬",Instagram:"📷",Google:"🔍",Site:"🌐","Meta Ads":"📣",Indicação:"⭐"};
const AC = {Civil:T.blue,Trabalhista:T.orange,Empresarial:T.purple,Consumidor:T.teal,Família:T.pink,Tributário:T.red,Previdenciário:T.green};

const ft  = d => new Date(d).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});
const fd  = d => new Date(d).toLocaleDateString("pt-BR");
const fm  = n => n>0?n.toLocaleString("pt-BR",{style:"currency",currency:"BRL",minimumFractionDigits:0}):"—";
const uid = () => crypto.randomUUID();
const age = lastMsg => {
  const h=(Date.now()-new Date(lastMsg).getTime())/3600000;
  if(h>=24) return {color:T.red,   label:`${Math.floor(h)}h sem resposta`,urgent:true};
  if(h>=4)  return {color:T.yellow,label:`${Math.floor(h)}h sem resposta`,urgent:false};
  return          {color:T.green,  label:"Recente",                       urgent:false};
};
const waitingMe = lead => {
  const msgs = lead.messages||[];
  if(msgs.length===0) return true;
  return msgs[msgs.length-1].from_type==="c";
};

// DB helpers
const dbToLead = (row, msgs=[]) => ({
  id: row.id, name: row.name, phone: row.phone, origin: row.origin,
  area: row.area, lawyer: row.lawyer, status: row.status,
  caseValue: Number(row.case_value), fees: Number(row.fees),
  processNum: row.process_num, stage: row.stage,
  consultDate: row.consult_date, proposalSent: row.proposal_sent,
  contractSigned: row.contract_signed, notes: row.notes,
  docs: row.docs||[], tag: row.tag,
  receivedAt: row.received_at, lastMsg: row.last_msg_at,
  messages: msgs,
});
const leadToDb = lead => ({
  id: lead.id, name: lead.name, phone: lead.phone, origin: lead.origin,
  area: lead.area, lawyer: lead.lawyer, status: lead.status,
  case_value: lead.caseValue, fees: lead.fees,
  process_num: lead.processNum, stage: lead.stage,
  consult_date: lead.consultDate, proposal_sent: lead.proposalSent,
  contract_signed: lead.contractSigned, notes: lead.notes,
  docs: lead.docs, tag: lead.tag,
  last_msg_at: lead.lastMsg,
});

const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');
*{box-sizing:border-box;margin:0;padding:0}
::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:#D5CCBE;border-radius:3px}
.fade{animation:fi .22s ease}
@keyframes fi{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
.nav{width:60px;background:#FDFCFA;border-right:1px solid #E8E2D9;display:flex;flex-direction:column;align-items:center;padding:14px 0;gap:2px;flex-shrink:0}
.nb{width:42px;height:42px;border-radius:11px;border:none;background:none;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;transition:all .15s;position:relative;gap:2px}
.nb:hover{background:#E8E2D9}
.nb.on{background:#8B6F3E18}
.nb .lbl{font-family:'DM Sans',sans-serif;font-size:8px;font-weight:600;color:#9B9189;letter-spacing:.02em;transition:color .15s}
.nb.on .lbl{color:#8B6F3E}
.tb{background:none;border:none;padding:9px 16px;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:500;cursor:pointer;color:#9B9189;border-bottom:2px solid transparent;transition:all .18s;white-space:nowrap;flex-shrink:0}
.tb.on{color:#8B6F3E;border-bottom-color:#8B6F3E;font-weight:600}
.tb:hover:not(.on){color:#5C5349}
.crow{display:flex;align-items:center;gap:10px;padding:11px 14px;cursor:pointer;border-bottom:1px solid #E8E2D9;transition:all .13s;position:relative}
.crow:hover{background:#F4F1EC}
.crow.sel{background:#8B6F3E0d;border-left:3px solid #8B6F3E;padding-left:11px}
.bbl{padding:10px 14px;border-radius:16px;font-size:13px;line-height:1.62;word-break:break-word;max-width:75%;animation:fi .18s ease}
.flbl{font-size:10px;font-weight:600;color:#9B9189;text-transform:uppercase;letter-spacing:.06em;display:block;margin-bottom:4px}
input,select,textarea{background:#FDFCFA;border:1px solid #E8E2D9;color:#1E1A15;border-radius:8px;padding:7px 10px;font-family:'DM Sans',sans-serif;font-size:12px;width:100%;outline:none;transition:border-color .2s}
input:focus,select:focus,textarea:focus{border-color:#8B6F3E;background:#fff}
select option{background:#fff}
textarea{resize:vertical;min-height:80px}
.kpi{background:#fff;border:1px solid #E8E2D9;border-radius:13px;padding:18px 20px}
.cc{background:#fff;border:1px solid #E8E2D9;border-radius:13px;padding:20px}
.pc{background:#fff;border:1px solid #E8E2D9;border-left-width:3px;border-radius:10px;padding:13px;cursor:pointer;transition:all .18s}
.pc:hover{box-shadow:0 4px 18px rgba(0,0,0,.09);transform:translateY(-2px)}
.pc.drag{opacity:.2}
.dz{border-radius:12px;transition:background .13s}
.dz.over{background:#8B6F3E0c;outline:2px dashed #C4A265;outline-offset:-2px}
.gh{background:none;border:1px solid #E8E2D9;color:#5C5349;border-radius:7px;padding:5px 11px;font-family:'DM Sans',sans-serif;font-size:11px;cursor:pointer;transition:all .18s}
.gh:hover{border-color:#8B6F3E;color:#8B6F3E}
.tgl{display:flex;align-items:center;gap:8px;padding:8px 11px;border-radius:8px;cursor:pointer;transition:all .18s;border:1px solid #E8E2D9;font-size:12px;font-weight:500}
.bdg{padding:2px 8px;border-radius:20px;font-size:10px;font-weight:600;display:inline-block;letter-spacing:.02em}
.spin{animation:spin 1s linear infinite}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
`;

export default function App() {
  const [view,    setView]    = useState("conv");
  const [leads,   setLeads]   = useState([]);
  const [lawyers, setLawyers] = useState([]);
  const [selId,   setSelId]   = useState(null);
  const [filter,  setFilter]  = useState("todos");
  const [newMsg,  setNewMsg]  = useState("");
  const [drag,    setDrag]    = useState(null);
  const [dropCol, setDropCol] = useState(null);
  const [modal,   setModal]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const chatRef = useRef(null);

  const lead      = leads.find(l=>l.id===selId);
  const modalLead = leads.find(l=>l.id===modal);

  // ── LOAD ──
  useEffect(()=>{
    Promise.all([loadLeads(), loadLawyers()]).finally(()=>setLoading(false));
  },[]);

  const loadLeads = async () => {
    const {data:leadsData} = await sb.from("leads").select("*").order("last_msg_at",{ascending:false});
    if(!leadsData) return;
    const {data:msgsData}  = await sb.from("messages").select("*").order("created_at",{ascending:true});
    const msgsByLead = {};
    (msgsData||[]).forEach(m=>{ if(!msgsByLead[m.lead_id]) msgsByLead[m.lead_id]=[]; msgsByLead[m.lead_id].push(m); });
    setLeads(leadsData.map(r=>dbToLead(r, msgsByLead[r.id]||[])));
  };

  const loadLawyers = async () => {
    const {data} = await sb.from("lawyers").select("name").eq("active",true).order("name");
    if(data) setLawyers(data.map(d=>d.name));
  };

  // ── UPDATE LEAD ──
  const upd = useCallback(async (id, patch) => {
    setLeads(p=>p.map(l=>l.id===id?{...l,...patch}:l));
    const dbPatch = {};
    if(patch.name         !== undefined) dbPatch.name           = patch.name;
    if(patch.phone        !== undefined) dbPatch.phone          = patch.phone;
    if(patch.origin       !== undefined) dbPatch.origin         = patch.origin;
    if(patch.area         !== undefined) dbPatch.area           = patch.area;
    if(patch.lawyer       !== undefined) dbPatch.lawyer         = patch.lawyer;
    if(patch.status       !== undefined) dbPatch.status         = patch.status;
    if(patch.caseValue    !== undefined) dbPatch.case_value     = patch.caseValue;
    if(patch.fees         !== undefined) dbPatch.fees           = patch.fees;
    if(patch.processNum   !== undefined) dbPatch.process_num    = patch.processNum;
    if(patch.stage        !== undefined) dbPatch.stage          = patch.stage;
    if(patch.consultDate  !== undefined) dbPatch.consult_date   = patch.consultDate;
    if(patch.proposalSent !== undefined) dbPatch.proposal_sent  = patch.proposalSent;
    if(patch.contractSigned!==undefined) dbPatch.contract_signed= patch.contractSigned;
    if(patch.notes        !== undefined) dbPatch.notes          = patch.notes;
    if(patch.tag          !== undefined) dbPatch.tag            = patch.tag;
    if(patch.lastMsg      !== undefined) dbPatch.last_msg_at    = patch.lastMsg;
    if(Object.keys(dbPatch).length>0) await sb.from("leads").update(dbPatch).eq("id",id);
  },[]);

  // ── SEND MESSAGE ──
  const send = async () => {
    if(!newMsg.trim()||!lead) return;
    setSaving(true);
    const now = new Date().toISOString();
    const text = newMsg.trim();
    const msgRow = { lead_id:lead.id, from_type:"l", text, is_audio:false, duration:"", msg_time:ft(now) };
    const {data} = await sb.from("messages").insert(msgRow).select().single();
    if(data){
      setLeads(p=>p.map(l=>l.id===lead.id?{...l, messages:[...(l.messages||[]),data], lastMsg:now}:l));
      await sb.from("leads").update({last_msg_at:now}).eq("id",lead.id);
      await sendWhatsApp(lead.phone, text);
    }
    setNewMsg("");
    setSaving(false);
  };

  useEffect(()=>{ if(chatRef.current) chatRef.current.scrollTop=chatRef.current.scrollHeight; },[selId,lead?.messages?.length]);

  const urgentCount = leads.filter(l=>waitingMe(l)).length;

  if(loading) return (
    <div style={{display:"flex",height:"100vh",alignItems:"center",justifyContent:"center",background:T.bg,flexDirection:"column",gap:16}}>
      <div className="spin" style={{width:36,height:36,border:`3px solid ${T.border}`,borderTopColor:T.gold,borderRadius:"50%"}}/>
      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,color:T.textM}}>Carregando CRM...</div>
    </div>
  );

  return (
    <div style={{display:"flex",height:"100vh",background:T.bg,color:T.text,fontFamily:"'DM Sans',sans-serif",overflow:"hidden"}}>
      <style>{CSS}</style>
      <div className="nav">
        <div style={{width:36,height:36,borderRadius:9,background:T.gold,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,marginBottom:16,flexShrink:0}}>⚖️</div>
        {[{id:"conv",icon:"💬",lbl:"Mensagens",badge:urgentCount},{id:"pipe",icon:"⊞",lbl:"Pipeline"},{id:"dash",icon:"📊",lbl:"Dashboard"}].map(n=>(
          <button key={n.id} className={`nb${view===n.id?" on":""}`} title={n.lbl} onClick={()=>setView(n.id)}>
            <span style={{fontSize:19,lineHeight:1}}>{n.icon}</span>
            <span className="lbl">{n.lbl}</span>
            {n.badge>0&&<span style={{position:"absolute",top:3,right:3,background:T.red,color:"#fff",borderRadius:10,fontSize:8,fontWeight:700,padding:"1px 4px",lineHeight:1.2}}>{n.badge}</span>}
          </button>
        ))}
        <div style={{flex:1}}/>
        <div style={{display:"flex",flexDirection:"column",gap:7,alignItems:"center",paddingBottom:12}}>
          {[[T.green,"WhatsApp"],[T.pink,"Instagram"],[T.blue,"Google"]].map(([c,t])=>(
            <div key={t} title={`${t} conectado`} style={{width:8,height:8,borderRadius:"50%",background:c,cursor:"help"}}/>
          ))}
        </div>
        <button className="nb" title="Configurações"><span style={{fontSize:17}}>⚙️</span><span className="lbl">Config</span></button>
      </div>

      {view==="conv" && <ConvView leads={leads} selId={selId} setSelId={setSelId} filter={filter} setFilter={setFilter} lead={lead} newMsg={newMsg} setNewMsg={setNewMsg} send={send} chatRef={chatRef} upd={upd} saving={saving} lawyers={lawyers}/>}
      {view==="pipe" && <PipeView leads={leads} drag={drag} setDrag={setDrag} dropCol={dropCol} setDropCol={setDropCol} upd={upd} onOpen={setModal}/>}
      {view==="dash" && <DashView leads={leads}/>}
      {modalLead && <LeadModal lead={modalLead} onClose={()=>setModal(null)} upd={upd} lawyers={lawyers}/>}
    </div>
  );
}

// ══ CONVERSAS ══════════════════════════════════════
function ConvView({leads,selId,setSelId,filter,setFilter,lead,newMsg,setNewMsg,send,chatRef,upd,saving,lawyers}){
  const [infoOpen,setInfoOpen]=useState(true);
  const [search,setSearch]=useState("");
  const [prio,setPrio]=useState("todos");

  const filtered=leads.filter(l=>{
    const chanOk=filter==="todos"||l.origin.toLowerCase()===filter;
    const srchOk=!search||l.name.toLowerCase().includes(search.toLowerCase())||l.phone.includes(search);
    const prioOk=prio==="todos"||(prio==="eu"&&waitingMe(l))||(prio==="cliente"&&!waitingMe(l));
    return chanOk&&srchOk&&prioOk;
  });
  const aguardandoEu=leads.filter(l=>waitingMe(l)).length;
  const a=lead?age(lead.lastMsg):null;

  return(
    <div style={{display:"flex",flex:1,overflow:"hidden"}}>
      <div style={{width:280,background:T.surf,borderRight:`1px solid ${T.border}`,display:"flex",flexDirection:"column",flexShrink:0}}>
        <div style={{padding:"14px 14px 0",flexShrink:0}}>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:21,fontWeight:700,color:T.text,marginBottom:10}}>Conversas</div>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar nome ou telefone..." style={{fontSize:12}}/>
        </div>
        <div style={{display:"flex",borderBottom:`1px solid ${T.border}`,flexShrink:0,marginTop:8,background:T.bg}}>
          {[["todos","Todas",null],["eu",`Resp. eu (${aguardandoEu})`,T.red],["cliente","Aguardando cliente",T.green]].map(([v,l,cl])=>(
            <button key={v} className={`tb${prio===v?" on":""}`} style={{flex:1,padding:"6px 4px",fontSize:10,textAlign:"center",color:prio===v?(cl||T.gold):T.textS}} onClick={()=>setPrio(v)}>{l}</button>
          ))}
        </div>
        <div style={{display:"flex",borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
          {[["todos","Todos"],["whatsapp","💬"],["instagram","📷"],["google","🔍"]].map(([v,l])=>(
            <button key={v} className={`tb${filter===v?" on":""}`} style={{flex:1,padding:"7px 4px",textAlign:"center"}} onClick={()=>setFilter(v)}>{l}</button>
          ))}
        </div>
        <div style={{flex:1,overflowY:"auto"}}>
          {filtered.length===0&&<div style={{padding:"32px 20px",textAlign:"center",color:T.textS}}><div style={{fontSize:28,marginBottom:8,opacity:.4}}>🔍</div><div style={{fontSize:12}}>Nenhuma conversa encontrada</div></div>}
          {filtered.map(l=>{
            const a=age(l.lastMsg);
            const msgs=l.messages||[];
            const last=msgs.length?(msgs[msgs.length-1].is_audio?"🎤 Áudio":msgs[msgs.length-1].text):"—";
            const wme=waitingMe(l);
            return(
              <div key={l.id} className={`crow${selId===l.id?" sel":""}`} style={{background:a.urgent&&selId!==l.id?"#A63D2F05":undefined}} onClick={()=>setSelId(l.id)}>
                {a.urgent&&selId!==l.id&&<div style={{position:"absolute",left:0,top:0,bottom:0,width:3,background:T.red}}/>}
                <div style={{width:40,height:40,borderRadius:"50%",background:OC[l.origin]+"1a",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0,position:"relative"}}>
                  {OI[l.origin]}
                  <div style={{position:"absolute",bottom:1,right:1,width:9,height:9,borderRadius:"50%",background:a.color,border:"2px solid #FDFCFA"}}/>
                  {wme&&<div style={{position:"absolute",top:-2,right:-2,width:10,height:10,borderRadius:"50%",background:T.red,border:"2px solid #FDFCFA",display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{width:4,height:4,borderRadius:"50%",background:"#fff"}}/></div>}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:2}}>
                    <span style={{fontWeight:600,fontSize:13,color:a.urgent?T.red:T.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.name}</span>
                    <span style={{fontSize:10,color:T.textS,flexShrink:0,marginLeft:4}}>{ft(l.lastMsg)}</span>
                  </div>
                  <div style={{fontSize:11,color:T.textS,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:3}}>{last}</div>
                  <div style={{display:"flex",gap:4,alignItems:"center",flexWrap:"wrap"}}>
                    {l.area&&<span className="bdg" style={{background:AC[l.area]+"18",color:AC[l.area]}}>{l.area}</span>}
                    {l.tag&&(()=>{const tg=TAGS.find(t=>t.id===l.tag);return tg?<span className="bdg" style={{background:tg.color+"18",color:tg.color}}>● {tg.label}</span>:null;})()}
                    {!l.tag&&(
                      <div style={{display:"flex",gap:3}} onClick={e=>e.stopPropagation()}>
                        {TAGS.map(tg=>(
                          <button key={tg.id} onClick={e=>{e.stopPropagation();upd(l.id,{tag:tg.id});}}
                            style={{background:"none",border:`1px solid ${tg.color}40`,borderRadius:4,padding:"1px 5px",fontSize:9,color:tg.color,cursor:"pointer",fontFamily:"inherit",fontWeight:600,lineHeight:1.4}}>
                            {tg.label.split(" ")[0]}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {lead?(
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>
          <div style={{padding:"10px 16px",borderBottom:`1px solid ${T.border}`,background:"#fff",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,borderTop:a?.urgent?`2px solid ${T.red}`:undefined}}>
            <div style={{display:"flex",alignItems:"center",gap:11}}>
              <div style={{width:38,height:38,borderRadius:"50%",background:OC[lead.origin]+"1a",display:"flex",alignItems:"center",justifyContent:"center",fontSize:19}}>{OI[lead.origin]}</div>
              <div>
                <div style={{fontWeight:600,fontSize:14,color:T.text}}>{lead.name}</div>
                <div style={{fontSize:11,color:T.textS,display:"flex",gap:6,alignItems:"center",marginTop:1}}>
                  <span>{lead.phone}</span>
                  {lead.lawyer&&<><span>·</span><span>👤 {lead.lawyer.split(" ").slice(0,2).join(" ")}</span></>}
                  {a?.urgent&&<span style={{color:T.red,fontWeight:600}}>· ⚠ {a.label}</span>}
                </div>
              </div>
            </div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              {lead.area&&<span className="bdg" style={{background:AC[lead.area]+"18",color:AC[lead.area]}}>{lead.area}</span>}
              {lead.stage&&<span className="bdg" style={{background:T.border,color:T.textM}}>{PIPELINE_COLS.find(c=>c.id===lead.stage)?.label||lead.stage}</span>}
              <button className="gh" onClick={()=>setInfoOpen(x=>!x)}>{infoOpen?"Fechar ficha ›":"Abrir ficha ‹"}</button>
            </div>
          </div>

          <div style={{flex:1,display:"flex",overflow:"hidden"}}>
            <div ref={chatRef} style={{flex:1,overflowY:"auto",padding:"20px",display:"flex",flexDirection:"column",gap:12,background:T.bg}}>
              <div style={{textAlign:"center",marginBottom:4}}>
                <span style={{fontSize:10,background:T.border,color:T.textS,padding:"3px 12px",borderRadius:20}}>{fd(lead.receivedAt)} · Contato via {lead.origin}</span>
              </div>
              {(lead.messages||[]).length===0&&(
                <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:T.textS,paddingTop:40}}>
                  <div style={{fontSize:38,opacity:.25,marginBottom:10}}>{OI[lead.origin]}</div>
                  <div style={{fontSize:13,fontWeight:500,color:T.textM}}>Nenhuma mensagem ainda</div>
                  <div style={{fontSize:11,color:T.textS,marginTop:4}}>Comece a conversa pelo campo abaixo</div>
                </div>
              )}
              {(lead.messages||[]).map(msg=>(
                <div key={msg.id} style={{display:"flex",justifyContent:msg.from_type==="l"?"flex-end":"flex-start",alignItems:"flex-end",gap:7}}>
                  {msg.from_type==="c"&&<Ava icon={OI[lead.origin]} bg={OC[lead.origin]+"1a"}/>}
                  <div>
                    <div className="bbl" style={{background:msg.from_type==="l"?T.gold:"#fff",color:msg.from_type==="l"?"#fff":T.text,border:msg.from_type==="l"?"none":`1px solid ${T.border}`,borderRadius:msg.from_type==="l"?"16px 16px 4px 16px":"16px 16px 16px 4px",boxShadow:T.shadow}}>
                      {msg.is_audio?<AudBbl dur={msg.duration} light={msg.from_type==="l"}/>:msg.text}
                    </div>
                    <div style={{fontSize:10,color:T.textS,marginTop:3,textAlign:msg.from_type==="l"?"right":"left"}}>{msg.msg_time}{msg.from_type==="l"&&" · ✓ Enviado"}</div>
                  </div>
                  {msg.from_type==="l"&&<Ava icon="⚖️" bg={T.gold+"22"}/>}
                </div>
              ))}
            </div>
            {infoOpen&&(
              <div className="fade" style={{width:268,borderLeft:`1px solid ${T.border}`,background:"#fff",display:"flex",flexDirection:"column",flexShrink:0,overflowY:"auto"}}>
                <InfoPanel lead={lead} upd={upd} lawyers={lawyers}/>
              </div>
            )}
          </div>

          <div style={{padding:"10px 14px",borderTop:`1px solid ${T.border}`,background:"#fff",flexShrink:0}}>
            <div style={{display:"flex",gap:8,alignItems:"center",background:T.bg,borderRadius:10,padding:"7px 12px",border:`1px solid ${T.border}`}}>
              <button style={{background:"none",border:"none",fontSize:16,cursor:"pointer",opacity:.6}}>😊</button>
              <button style={{background:"none",border:"none",fontSize:15,cursor:"pointer",opacity:.6}}>📎</button>
              <input value={newMsg} onChange={e=>setNewMsg(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!saving&&send()}
                placeholder="Digite uma mensagem..." style={{flex:1,background:"none",border:"none",padding:"4px 8px",fontSize:13,color:T.text}}/>
              <button onClick={send} disabled={saving} style={{background:saving?T.textS:T.gold,color:"#fff",border:"none",borderRadius:8,padding:"6px 16px",fontSize:12,fontWeight:600,cursor:saving?"not-allowed":"pointer",fontFamily:"inherit",flexShrink:0,transition:"all .18s"}}>
                {saving?"...":"Enviar"}
              </button>
            </div>
            <div style={{fontSize:10,color:T.textS,textAlign:"center",marginTop:5}}>Respondendo via {lead.origin} · Bot de boas-vindas ativo</div>
          </div>
        </div>
      ):(
        <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:T.textS,background:T.bg}}>
          <div style={{fontSize:52,opacity:.18,marginBottom:16}}>💬</div>
          <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:700,color:T.textM,marginBottom:6}}>Nenhuma conversa selecionada</div>
          <div style={{fontSize:13,color:T.textS,textAlign:"center",maxWidth:260,lineHeight:1.6}}>Selecione uma conversa à esquerda para começar a atender</div>
        </div>
      )}
    </div>
  );
}

// ══ INFO PANEL ══════════════════════════════════════
function InfoPanel({lead,upd,lawyers}){
  const [tab,setTab]=useState("ficha");
  const set=(k,v)=>upd(lead.id,{[k]:v});
  const a=age(lead.lastMsg);
  return(
    <>
      <div style={{padding:"14px 14px 10px",borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
          <div style={{width:42,height:42,borderRadius:"50%",background:OC[lead.origin]+"1a",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{OI[lead.origin]}</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:15,fontWeight:700,color:T.text,lineHeight:1.2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{lead.name}</div>
            <div style={{fontSize:11,color:T.textS,marginTop:1}}>{lead.phone}</div>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:8}}>
          {[{lbl:"Origem",val:lead.origin,color:OC[lead.origin]},{lbl:"Área",val:lead.area||"—",color:lead.area?AC[lead.area]:T.textS},{lbl:"Advogado",val:lead.lawyer?lead.lawyer.split(" ").slice(0,2).join(" "):"—",color:T.textM},{lbl:"Etapa",val:PIPELINE_COLS.find(c=>c.id===lead.stage)?.label||"—",color:PIPELINE_COLS.find(c=>c.id===lead.stage)?.color||T.textS}].map(({lbl,val,color})=>(
            <div key={lbl} style={{background:T.bg,borderRadius:7,padding:"6px 8px"}}>
              <div style={{fontSize:9,color:T.textS,fontWeight:600,textTransform:"uppercase",letterSpacing:".05em",marginBottom:2}}>{lbl}</div>
              <div style={{fontSize:11,fontWeight:600,color,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{val}</div>
            </div>
          ))}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:5,padding:"5px 8px",background:a.color+"12",border:`1px solid ${a.color}28`,borderRadius:7}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:a.color,flexShrink:0}}/>
          <span style={{fontSize:10,color:a.color,fontWeight:600}}>{a.label}</span>
        </div>
      </div>
      <div style={{display:"flex",borderBottom:`1px solid ${T.border}`,flexShrink:0}}>
        {[["ficha","Ficha"],["consulta","Consulta"],["docs","Docs"],["notas","Notas"]].map(([v,l])=>(
          <button key={v} className={`tb${tab===v?" on":""}`} style={{flex:1,padding:"7px 2px",fontSize:10,textAlign:"center"}} onClick={()=>setTab(v)}>{l}</button>
        ))}
      </div>
      <div style={{flex:1,padding:"12px 14px",overflowY:"auto"}}>
        {tab==="ficha"&&<>
          <Sel lbl="Advogado"      k="lawyer" val={lead.lawyer} opts={lawyers.length?lawyers:["Dr. Carlos Mendes","Dra. Ana Paula","Dr. Roberto Lima","Dra. Fernanda Costa"]} set={set}/>
          <Sel lbl="Status"        k="status" val={lead.status} opts={STATUSES}  set={set}/>
          <Sel lbl="Área jurídica" k="area"   val={lead.area}   opts={AREAS}     set={set}/>
          <Sel lbl="Etapa" k="stage" val={lead.stage} opts={PIPELINE_COLS.map(c=>c.id)} labels={PIPELINE_COLS.map(c=>c.label)} set={set}/>
          <Inp lbl="Nome completo"  k="name"       val={lead.name}       set={set}/>
          <Inp lbl="Telefone"       k="phone"      val={lead.phone}      set={set} type="tel"/>
          <Inp lbl="Nº do Processo" k="processNum" val={lead.processNum} set={set} placeholder="000000-00.0000.0.00.0000"/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:10}}>
            <Inp lbl="Causa (R$)"  k="caseValue" val={lead.caseValue||""} type="number" set={set}/>
            <Inp lbl="Honorários"  k="fees"       val={lead.fees||""}     type="number" set={set}/>
          </div>
          {lead.caseValue>0&&<div style={{background:T.green+"0f",border:`1px solid ${T.green}28`,borderRadius:8,padding:"10px 12px",marginBottom:10}}><div style={{fontSize:9,color:T.textS,fontWeight:600,textTransform:"uppercase",letterSpacing:".05em",marginBottom:3}}>Valor da Causa</div><div style={{fontSize:16,fontWeight:700,color:T.green,fontFamily:"'Cormorant Garamond',serif"}}>{fm(lead.caseValue)}</div></div>}
          <div style={{display:"flex",flexDirection:"column",gap:6,marginTop:4}}>
            {[["Proposta enviada","proposalSent"],["Contrato assinado","contractSigned"]].map(([l,k])=>(
              <div key={k} className="tgl" style={{background:lead[k]?T.green+"0f":T.bg,borderColor:lead[k]?T.green+"45":T.border,color:lead[k]?T.green:T.textM}} onClick={()=>set(k,!lead[k])}>
                <div style={{width:16,height:16,borderRadius:4,background:lead[k]?T.green:T.border,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:10,fontWeight:700,flexShrink:0}}>{lead[k]?"✓":""}</div>{l}
              </div>
            ))}
          </div>
        </>}
        {tab==="consulta"&&<>
          <Inp lbl="Data e hora" k="consultDate" val={lead.consultDate} set={set} placeholder="20/05/2026 14:00"/>
          {lead.consultDate?(<div style={{background:T.green+"0f",border:`1px solid ${T.green}28`,borderRadius:8,padding:10,marginTop:4}}><div style={{fontSize:11,fontWeight:600,color:T.green,marginBottom:3}}>✅ Consulta agendada</div><div style={{fontSize:12,color:T.textM,fontWeight:500}}>{lead.consultDate}</div><div style={{fontSize:10,color:T.textS,marginTop:5}}>Lembrete automático 24h antes via {lead.origin}</div></div>):(<div style={{background:T.bg,border:`1px solid ${T.border}`,borderRadius:8,padding:10,fontSize:11,color:T.textS,marginTop:4,lineHeight:1.6}}>Ao agendar, o cliente recebe lembrete automático via {lead.origin} 24h antes.</div>)}
        </>}
        {tab==="docs"&&<>
          {lead.docs?.length===0?(<div style={{textAlign:"center",padding:"28px 0",color:T.textS}}><div style={{fontSize:30,marginBottom:8,opacity:.3}}>📂</div><div style={{fontSize:12}}>Nenhum documento ainda</div></div>):(<div style={{display:"flex",flexDirection:"column",gap:6}}>{lead.docs?.map((d,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:T.bg,borderRadius:8,border:`1px solid ${T.border}`}}><span style={{fontSize:16,opacity:.7}}>📄</span><span style={{flex:1,fontSize:11,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",color:T.textM}}>{d}</span></div>)}</div>)}
          <button className="gh" style={{marginTop:10,width:"100%",fontSize:11,textAlign:"center",padding:"8px"}}>+ Adicionar documento</button>
        </>}
        {tab==="notas"&&<>
          <label className="flbl" style={{marginBottom:6}}>Nota interna 🔒</label>
          <textarea value={lead.notes||""} onChange={e=>set("notes",e.target.value)} placeholder="Observações confidenciais..."/>
          <div style={{fontSize:10,color:T.textS,marginTop:6}}>Visível apenas para os advogados do escritório</div>
        </>}
      </div>
    </>
  );
}

const Sel=({lbl,k,val,opts,labels,set})=>(<div style={{marginBottom:9}}><label className="flbl">{lbl}</label><select value={val||""} onChange={e=>set(k,e.target.value)} style={{fontSize:11}}><option value="">— Selecionar —</option>{opts.map((o,i)=><option key={o} value={o}>{labels?labels[i]:o}</option>)}</select></div>);
const Inp=({lbl,k,val,set,type="text",placeholder})=>(<div style={{marginBottom:9}}><label className="flbl">{lbl}</label><input type={type} value={val||""} placeholder={placeholder||`${lbl}...`} style={{fontSize:11}} onChange={e=>set(k,type==="number"?Number(e.target.value):e.target.value)}/></div>);
const Ava=({icon,bg})=>(<div style={{width:28,height:28,borderRadius:"50%",background:bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0}}>{icon}</div>);
const AudBbl=({dur,light})=>(<div style={{display:"flex",alignItems:"center",gap:9,minWidth:155}}><button style={{width:26,height:26,borderRadius:"50%",background:light?"rgba(255,255,255,.25)":"#8B6F3E22",border:"none",cursor:"pointer",fontSize:10,display:"flex",alignItems:"center",justifyContent:"center",color:light?"#fff":T.gold,flexShrink:0}}>▶</button><div style={{flex:1,height:3,background:light?"rgba(255,255,255,.3)":T.border,borderRadius:2}}><div style={{width:"33%",height:"100%",background:light?"rgba(255,255,255,.65)":T.gold,borderRadius:2}}/></div><span style={{fontSize:10,color:light?"rgba(255,255,255,.7)":T.textS,flexShrink:0}}>{dur}</span><span style={{fontSize:12,opacity:.7}}>🎤</span></div>);

// ══ PIPELINE ════════════════════════════════════════
function PipeCol({col,leads,drag,setDrag,dropCol,setDropCol,upd,onOpen}){
  const cols=leads.filter(l=>l.stage===col.id);
  return(
    <div style={{minWidth:224,maxWidth:224,display:"flex",flexDirection:"column",flexShrink:0}} className={`dz${dropCol===col.id?" over":""}`}
      onDragOver={e=>{e.preventDefault();setDropCol(col.id)}} onDrop={e=>{e.preventDefault();if(drag)upd(drag,{stage:col.id});setDrag(null);setDropCol(null)}} onDragLeave={()=>setDropCol(null)}>
      <div style={{padding:"8px 10px 10px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:7}}><div style={{width:8,height:8,borderRadius:"50%",background:col.color,flexShrink:0}}/><span style={{fontSize:12,fontWeight:600,color:T.text}}>{col.label}</span></div>
        <span style={{fontSize:11,background:col.color+"18",color:col.color,padding:"2px 8px",borderRadius:20,fontWeight:700}}>{cols.length}</span>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:8,minHeight:60}}>
        {cols.map(l=><PCard key={l.id} lead={l} col={col} isDrag={drag===l.id} onDragStart={()=>setDrag(l.id)} onDragEnd={()=>{setDrag(null);setDropCol(null)}} onOpen={()=>onOpen(l.id)}/>)}
        {cols.length===0&&<div style={{border:`1px dashed ${T.border}`,borderRadius:8,padding:14,textAlign:"center",color:T.textS,fontSize:11}}>Arraste um lead aqui</div>}
      </div>
    </div>
  );
}

function PipeView({leads,drag,setDrag,dropCol,setDropCol,upd,onOpen}){
  const props={leads,drag,setDrag,dropCol,setDropCol,upd,onOpen};
  const Divider=({label})=>(<div style={{padding:"14px 16px 4px",display:"flex",alignItems:"center",gap:8}}><div style={{height:1,flex:1,background:T.border}}/><span style={{fontSize:10,fontWeight:700,color:T.textS,textTransform:"uppercase",letterSpacing:".08em",flexShrink:0}}>{label}</span><div style={{height:1,flex:1,background:T.border}}/></div>);
  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{padding:"14px 22px 10px",borderBottom:`1px solid ${T.border}`,background:T.surf,flexShrink:0}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:700,letterSpacing:"-.01em"}}>Pipeline</div>
        <div style={{fontSize:12,color:T.textS,marginTop:2}}>{leads.length} leads · arraste para mover entre etapas</div>
      </div>
      <div style={{flex:1,overflowY:"auto"}}>
        <Divider label="Atendimento"/>
        <div style={{display:"flex",overflowX:"auto",padding:"4px 16px 16px",gap:10}}>{ATENDIMENTO_COLS.map(col=><PipeCol key={col.id} col={col} {...props}/>)}</div>
        <Divider label="Caso Jurídico"/>
        <div style={{display:"flex",overflowX:"auto",padding:"4px 16px 20px",gap:10}}>{JURIDICO_COLS.map(col=><PipeCol key={col.id} col={col} {...props}/>)}</div>
      </div>
    </div>
  );
}

function PCard({lead,col,isDrag,onDragStart,onDragEnd,onOpen}){
  const a=age(lead.lastMsg);
  return(
    <div className={`pc fade${isDrag?" drag":""}`} style={{borderLeftColor:col.color,borderTop:a.urgent?`2px solid ${T.red}`:undefined}} draggable onDragStart={onDragStart} onDragEnd={onDragEnd} onClick={onOpen}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}><span style={{fontWeight:600,fontSize:13,flex:1,lineHeight:1.3,color:a.urgent?T.red:T.text}}>{lead.name}</span><span style={{fontSize:10,color:T.textS,marginLeft:6,flexShrink:0}}>{fd(lead.receivedAt)}</span></div>
      <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:6}}><span style={{fontSize:13}}>{OI[lead.origin]}</span>{lead.area&&<span className="bdg" style={{background:AC[lead.area]+"18",color:AC[lead.area]}}>{lead.area}</span>}</div>
      {lead.lawyer&&<div style={{fontSize:11,color:T.textS,marginBottom:5}}>👤 {lead.lawyer.split(" ").slice(0,2).join(" ")}</div>}
      {lead.caseValue>0&&<div style={{fontSize:11,color:T.green,fontWeight:600,marginBottom:6}}>{fm(lead.caseValue)}</div>}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:7,borderTop:`1px solid ${T.border}`}}>
        <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:6,height:6,borderRadius:"50%",background:a.color,flexShrink:0}}/><span style={{fontSize:10,color:a.color,fontWeight:500}}>{a.label}</span></div>
        <div style={{display:"flex",gap:4}}>
          {lead.consultDate&&<span title="Consulta agendada" style={{fontSize:12}}>📅</span>}
          {lead.proposalSent&&<span title="Proposta enviada" style={{fontSize:12}}>📄</span>}
          {lead.contractSigned&&<span title="Contrato assinado" style={{fontSize:12}}>✅</span>}
          {(lead.messages||[]).length>0&&<span style={{fontSize:10,background:T.bg,color:T.textS,padding:"1px 6px",borderRadius:20}}>💬{lead.messages.length}</span>}
        </div>
      </div>
    </div>
  );
}

function LeadModal({lead,onClose,upd,lawyers}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(20,16,10,.52)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16,backdropFilter:"blur(3px)"}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="fade" style={{background:"#fff",borderRadius:16,width:"86%",maxWidth:660,maxHeight:"86vh",display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:"0 24px 80px rgba(0,0,0,.17)"}}>
        <div style={{padding:"15px 20px",borderBottom:`1px solid ${T.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",background:T.surf}}>
          <div><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:700}}>{lead.name}</div><div style={{fontSize:11,color:T.textS,marginTop:3}}>{lead.phone} · {lead.origin} · {fd(lead.receivedAt)}</div></div>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:T.textS}}>×</button>
        </div>
        <div style={{flex:1,overflowY:"auto"}}><InfoPanel lead={lead} upd={upd} lawyers={lawyers}/></div>
      </div>
    </div>
  );
}

// ══ DASHBOARD ═══════════════════════════════════════
function DashView({leads}){
  const total=leads.length,comAdv=leads.filter(l=>l.lawyer).length,concluidos=leads.filter(l=>l.stage==="concluido").length;
  const conversao=total>0?Math.round((concluidos/total)*100):0;
  const totalCausa=leads.reduce((s,l)=>s+l.caseValue,0),totalFees=leads.reduce((s,l)=>s+l.fees,0);
  const byOrigin=ORIGINS.map(o=>({name:o,count:leads.filter(l=>l.origin===o).length,color:OC[o]})).filter(x=>x.count>0);
  const byArea=AREAS.map(a=>({area:a,count:leads.filter(l=>l.area===a).length})).filter(x=>x.count>0);
  const byStage=PIPELINE_COLS.map(c=>({name:c.label,value:leads.filter(l=>l.stage===c.id).length,color:c.color}));
  const byLawyer=["Dr. Carlos Mendes","Dra. Ana Paula","Dr. Roberto Lima","Dra. Fernanda Costa"].map(l=>({name:l.split(" ").slice(0,2).join(" "),count:leads.filter(x=>x.lawyer===l).length})).filter(x=>x.count>0);
  const feesByArea=AREAS.map(a=>({area:a,honorarios:leads.filter(l=>l.area===a).reduce((s,l)=>s+l.fees,0)})).filter(x=>x.honorarios>0);
  const successByArea=AREAS.map(a=>{const tot=leads.filter(l=>l.area===a).length;const won=leads.filter(l=>l.area===a&&l.stage==="concluido").length;return{area:a,rate:tot>0?Math.round((won/tot)*100):0};}).filter(x=>x.rate>0);
  const monthly=[{mes:"Jan",captados:8,clientes:3,duvidas:3,encaminhados:2,fechados:3,honorarios:45000},{mes:"Fev",captados:11,clientes:4,duvidas:5,encaminhados:2,fechados:4,honorarios:62000},{mes:"Mar",captados:7,clientes:2,duvidas:3,encaminhados:2,fechados:2,honorarios:28000},{mes:"Abr",captados:15,clientes:5,duvidas:7,encaminhados:3,fechados:5,honorarios:89000},{mes:"Mai",captados:10,clientes:3,duvidas:5,encaminhados:2,fechados:3,honorarios:41000}];
  const TT=()=>({contentStyle:{background:"#fff",border:`1px solid ${T.border}`,borderRadius:8,color:T.text,fontSize:12}});
  const H=({title,sub})=>(<div style={{marginBottom:18}}><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:700,color:T.text}}>{title}</div>{sub&&<div style={{fontSize:11,color:T.textS,marginTop:2}}>{sub}</div>}</div>);
  const KPI=({l,v,s,i,c})=>(<div className="kpi"><div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}><div><div style={{fontSize:10,color:T.textS,fontWeight:600,textTransform:"uppercase",letterSpacing:".06em",marginBottom:8}}>{l}</div><div style={{fontSize:26,fontWeight:700,color:c,fontFamily:"'Cormorant Garamond',serif",lineHeight:1}}>{v}</div><div style={{fontSize:11,color:T.textS,marginTop:6}}>{s}</div></div><span style={{fontSize:22,opacity:.45}}>{i}</span></div></div>);
  return(
    <div style={{flex:1,overflowY:"auto",padding:"24px 26px"}}>
      <H title="Captação de Clientes" sub="Visão geral dos contatos recebidos pelo escritório"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:13,marginBottom:20}}>
        <KPI l="Total de Contatos" v={total}           s="recebidos no período"   i="👥" c={T.blue}/>
        <KPI l="Clientes Captados" v={comAdv}          s="com advogado atribuído" i="⚖️" c={T.gold}/>
        <KPI l="Casos Concluídos"  v={concluidos}      s="encerrados com êxito"   i="🏆" c={T.green}/>
        <KPI l="Taxa de Conversão" v={`${conversao}%`} s="contato → cliente"      i="📈" c={T.purple}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:13,marginBottom:13}}>
        <div className="cc"><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontWeight:700,marginBottom:14}}>Origem dos Contatos</div><ResponsiveContainer width="100%" height={175}><BarChart data={byOrigin} margin={{bottom:4}}><XAxis dataKey="name" tick={{fill:T.textS,fontSize:11}} axisLine={false} tickLine={false}/><YAxis tick={{fill:T.textS,fontSize:11}} axisLine={false} tickLine={false}/><Tooltip {...TT()}/><Bar dataKey="count" radius={[6,6,0,0]} name="Contatos">{byOrigin.map((e,i)=><Cell key={i} fill={e.color}/>)}</Bar></BarChart></ResponsiveContainer></div>
        <div className="cc" style={{display:"flex",flexDirection:"column"}}><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontWeight:700,marginBottom:10}}>Etapa do Pipeline</div><div style={{flex:1,display:"flex",alignItems:"center"}}><ResponsiveContainer width="52%" height={175}><PieChart><Pie data={byStage} cx="50%" cy="50%" innerRadius={46} outerRadius={70} dataKey="value" paddingAngle={3}>{byStage.map((e,i)=><Cell key={i} fill={e.color}/>)}</Pie><Tooltip {...TT()}/></PieChart></ResponsiveContainer><div style={{flex:1,display:"flex",flexDirection:"column",gap:10}}>{byStage.map((s,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:7}}><div style={{width:8,height:8,borderRadius:"50%",background:s.color,flexShrink:0}}/><span style={{fontSize:11,color:T.textS,flex:1}}>{s.name}</span><span style={{fontSize:13,fontWeight:700,color:T.text}}>{s.value}</span></div>)}</div></div></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:13,marginBottom:13}}>
        <div className="cc"><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontWeight:700,marginBottom:14}}>Contatos por Área</div><ResponsiveContainer width="100%" height={185}><BarChart data={byArea} layout="vertical" margin={{left:6,right:22}}><XAxis type="number" tick={{fill:T.textS,fontSize:11}} axisLine={false} tickLine={false}/><YAxis type="category" dataKey="area" tick={{fill:T.text,fontSize:11}} axisLine={false} tickLine={false} width={86}/><Tooltip {...TT()}/><Bar dataKey="count" radius={[0,6,6,0]} name="Contatos">{byArea.map((e,i)=><Cell key={i} fill={AC[e.area]||T.gold}/>)}</Bar></BarChart></ResponsiveContainer></div>
        <div className="cc"><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontWeight:700,marginBottom:14}}>Contatos por Advogado</div><ResponsiveContainer width="100%" height={185}><BarChart data={byLawyer} layout="vertical" margin={{left:6,right:26}}><XAxis type="number" tick={{fill:T.textS,fontSize:11}} axisLine={false} tickLine={false}/><YAxis type="category" dataKey="name" tick={{fill:T.text,fontSize:11}} axisLine={false} tickLine={false} width={100}/><Tooltip {...TT()}/><Bar dataKey="count" fill={T.purple} radius={[0,6,6,0]} name="Contatos"/></BarChart></ResponsiveContainer></div>
      </div>
      <div className="cc" style={{marginBottom:0}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontWeight:700,marginBottom:4}}>Captação Mensal</div>
        <div style={{fontSize:11,color:T.textS,marginBottom:16}}>Captados · Clientes fechados · Só dúvida · Encaminhados a órgãos públicos</div>
        <ResponsiveContainer width="100%" height={205}><LineChart data={monthly} margin={{right:18}}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="mes" tick={{fill:T.textS,fontSize:12}} axisLine={false} tickLine={false}/><YAxis tick={{fill:T.textS,fontSize:11}} axisLine={false} tickLine={false}/><Tooltip {...TT()}/><Legend wrapperStyle={{fontSize:11,color:T.textM}}/><Line type="monotone" dataKey="captados" stroke={T.blue} strokeWidth={2.5} dot={{fill:T.blue,r:4,strokeWidth:0}} name="Captados"/><Line type="monotone" dataKey="clientes" stroke={T.green} strokeWidth={2.5} dot={{fill:T.green,r:4,strokeWidth:0}} name="Clientes fechados"/><Line type="monotone" dataKey="duvidas" stroke={T.gold} strokeWidth={2} dot={{fill:T.gold,r:3,strokeWidth:0}} name="Só dúvida" strokeDasharray="5 3"/><Line type="monotone" dataKey="encaminhados" stroke={T.textS} strokeWidth={2} dot={{fill:T.textS,r:3,strokeWidth:0}} name="Encaminhados" strokeDasharray="3 3"/></LineChart></ResponsiveContainer>
      </div>
      <div style={{height:1,background:T.border,margin:"28px 0"}}/>
      <H title="Desempenho Financeiro" sub="Valores de causas, honorários e taxa de êxito por área"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:13,marginBottom:20}}>
        <KPI l="Total em Causas"     v={fm(totalCausa)}                              s="portfólio acumulado"  i="⚖️" c={T.blue}/>
        <KPI l="Total de Honorários" v={fm(totalFees)}                               s="estimativa total"     i="💰" c={T.green}/>
        <KPI l="Média por Caso"      v={fm(comAdv>0?Math.round(totalFees/comAdv):0)} s="honorários médios"    i="📐" c={T.gold}/>
        <KPI l="Taxa de Êxito"       v={`${conversao}%`}                             s="casos ganhos / total" i="🎯" c={T.teal}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:13,marginBottom:13}}>
        <div className="cc"><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontWeight:700,marginBottom:4}}>Honorários por Área</div><div style={{fontSize:11,color:T.textS,marginBottom:14}}>Causas: <span style={{color:T.blue,fontWeight:600}}>{fm(totalCausa)}</span> · Honorários: <span style={{color:T.green,fontWeight:600}}>{fm(totalFees)}</span></div><ResponsiveContainer width="100%" height={185}><BarChart data={feesByArea} margin={{bottom:4}}><XAxis dataKey="area" tick={{fill:T.textS,fontSize:10}} axisLine={false} tickLine={false}/><YAxis tick={{fill:T.textS,fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>`R$${(v/1000).toFixed(0)}k`}/><Tooltip {...TT()} formatter={v=>fm(v)}/><Bar dataKey="honorarios" fill={T.gold} radius={[4,4,0,0]} name="Honorários"/></BarChart></ResponsiveContainer></div>
        <div className="cc"><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontWeight:700,marginBottom:14}}>Taxa de Êxito por Área (%)</div><ResponsiveContainer width="100%" height={185}><BarChart data={successByArea} layout="vertical" margin={{left:6,right:48}}><XAxis type="number" domain={[0,100]} tick={{fill:T.textS,fontSize:11}} axisLine={false} tickLine={false} tickFormatter={v=>`${v}%`}/><YAxis type="category" dataKey="area" tick={{fill:T.text,fontSize:11}} axisLine={false} tickLine={false} width={86}/><Tooltip {...TT()} formatter={v=>`${v}%`}/><Bar dataKey="rate" fill={T.teal} radius={[0,6,6,0]} name="Êxito" label={{position:"right",fill:T.teal,fontSize:11,formatter:v=>`${v}%`}}/></BarChart></ResponsiveContainer></div>
      </div>
      <div className="cc" style={{marginBottom:4}}>
        <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:16,fontWeight:700,marginBottom:4}}>Fechamentos & Honorários Mensais</div>
        <div style={{fontSize:11,color:T.textS,marginBottom:16}}>Casos fechados e honorários correspondentes mês a mês</div>
        <ResponsiveContainer width="100%" height={205}><LineChart data={monthly} margin={{right:22}}><CartesianGrid strokeDasharray="3 3" stroke={T.border}/><XAxis dataKey="mes" tick={{fill:T.textS,fontSize:12}} axisLine={false} tickLine={false}/><YAxis yAxisId="l" tick={{fill:T.textS,fontSize:11}} axisLine={false} tickLine={false}/><YAxis yAxisId="r" orientation="right" tick={{fill:T.textS,fontSize:11}} axisLine={false} tickLine={false} tickFormatter={v=>`R$${(v/1000).toFixed(0)}k`}/><Tooltip {...TT()} formatter={(v,n)=>n==="Honorários"?fm(v):v}/><Legend wrapperStyle={{fontSize:11,color:T.textM}}/><Line yAxisId="l" type="monotone" dataKey="fechados" stroke={T.blue} strokeWidth={2.5} dot={{fill:T.blue,r:4,strokeWidth:0}} name="Fechamentos"/><Line yAxisId="r" type="monotone" dataKey="honorarios" stroke={T.gold} strokeWidth={2.5} dot={{fill:T.gold,r:4,strokeWidth:0}} name="Honorários" strokeDasharray="6 3"/></LineChart></ResponsiveContainer>
      </div>
    </div>
  );
}
