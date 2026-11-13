(function () {
"use strict";
function makeCloud(bridge) {
  const PREFIX="fj_supabase_";
  const state={url:localStorage.getItem(PREFIX+"url")||"",key:localStorage.getItem(PREFIX+"key")||"",email:localStorage.getItem(PREFIX+"email")||"",armed:localStorage.getItem(PREFIX+"armed")==="yes",client:null,user:null,busy:false,message:"尚未連接雲端",shadow:{},pending:false,timer:null};
  function safe(v){return String(v||"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
  function keyOf(type,id){return type+":"+id}
  function snapshot(data){
    const map={};
    for(const type of ["meals","waters","library"])for(const x of (data[type]||[])){if(x&&x.id)map[keyOf(type,x.id)]={type,id:String(x.id),payload:x}}
    for(const [id,value] of Object.entries(data.reports||{}))map[keyOf("reports",id)]={type:"reports",id,payload:value};
    return map;
  }
  function refresh(){
    const node=document.getElementById("fjCloudPanel");
    if(node)node.outerHTML=panel();
  }
  function detail(err){return String(err&&err.message||err||"未知錯誤").slice(0,230)}
  function client(){
    if(!state.url||!state.key)return null;
    if(!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(state.url))throw Error("專案網址須為 https://...supabase.co");
    if(!window.supabase||!window.supabase.createClient)throw Error("雲端登入模組尚未載入，請確認網路");
    if(!state.client)state.client=window.supabase.createClient(state.url.replace(/\/$/,""),state.key,{auth:{persistSession:true,detectSessionInUrl:false,storageKey:"food-journal-supabase-session"}});
    return state.client;
  }
  function panel(){
    const signed=!!state.user;
    const status=safe(state.message);
    return '<section class="card" id="fjCloudPanel"><div class="row"><h3 style="margin:0">☁️ 雲端同步</h3><span class="small muted">'+(signed?'已登入':'尚未登入')+'</span></div>'+
      '<p class="help">Safari 與主畫面 App 登入同一帳號，就能合併餐點、照片、喝水及每日回報。啟用前請先下載 JSON 備份；不同開啟方式各需登入一次。</p>'+
      '<div class="note" style="margin:10px 0">'+status+'</div>'+
      (!state.url||!state.key?
      '<div class="field"><label>Supabase 專案網址</label><input class="input" id="syncUrl" type="url" placeholder="https://xxxxx.supabase.co" value="'+safe(state.url)+'"></div>'+
      '<div class="field"><label>Publishable／anon Key（不可使用 service_role）</label><input class="input" id="syncKey" autocomplete="off" placeholder="sb_publishable_... 或 anon key" value="'+safe(state.key)+'"></div>'+
      '<button class="btn secondary" id="syncSaveConfig">儲存連線設定</button>':
      (!signed?
      '<div class="field"><label>電子郵件</label><input class="input" id="syncEmail" inputmode="email" type="email" autocomplete="email" value="'+safe(state.email)+'"></div>'+
      '<div class="field"><label>密碼</label><input class="input" id="syncPassword" type="password" autocomplete="current-password" placeholder="只用於登入，不寫入網站"></div>'+
      '<div class="actions"><button class="btn" id="syncLogin">登入</button><button class="btn secondary" id="syncRegister">建立帳號</button></div>':
      '<p class="small muted">已登入：'+safe(state.user.email||"")+'</p>'+
      (state.armed?
      '<div class="actions"><button class="btn" id="syncNow" '+(state.busy?'disabled':'')+'>立即同步</button><button class="btn outline" id="syncLogout">登出</button></div>':
      '<p class="help">首次啟用會嘗試合併這個瀏覽器與雲端的紀錄，不應直接清空本機資料。請先備份後再繼續。</p><div class="actions"><button class="btn" id="syncEnable">合併並啟用同步</button><button class="btn outline" id="syncLogout">登出</button></div>'))+
      '<button class="btn outline smallbtn" id="syncChangeConfig" style="margin-top:10px">更換雲端專案設定</button>')+
      '<p class="help">雲端未連線時仍能本機記錄。同步並非即時雙向編輯鎖定，請避免同時在兩個裝置修改同一筆資料，並定期下載 JSON 備份。</p></section>';
  }
  function trackChanges(){
    const data=bridge.get(),current=snapshot(data),previous=state.shadow;
    data._syncVersions=data._syncVersions||{};
    let time=Date.now();
    const all=new Set([...Object.keys(current),...Object.keys(previous)]);
    for(const k of all){
      if(JSON.stringify(current[k]||null)!==JSON.stringify(previous[k]||null)){
        time++;
        data._syncVersions[k]={t:time,deleted:!current[k]};
      }
    }
    state.shadow=snapshot(data);
    if(state.armed&&state.user){state.pending=true;queue()}
  }
  function queue(){
    if(state.timer)clearTimeout(state.timer);
    state.timer=setTimeout(()=>{state.timer=null;sync().catch(()=>{})},1600);
  }
  async function setup(){
    if(!state.url||!state.key)return;
    try{
      const c=client(),result=await c.auth.getUser();
      state.user=result.data&&result.data.user||null;
      state.message=state.user?(state.armed?"已登入，準備同步":"已登入，尚未啟用同步"):"請登入同一個雲端帳號";
      refresh();
      if(state.user&&state.armed)await sync();
    }catch(e){state.message="連線設定有問題："+detail(e);refresh()}
  }
  async function saveConfig(){
    const url=document.getElementById("syncUrl")?.value.trim()||"",key=document.getElementById("syncKey")?.value.trim()||"";
    if(!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url))throw Error("請輸入有效的 Supabase 專案網址");
    if(!key||key.toLowerCase().includes("service_role")||key.toLowerCase().includes("secret"))throw Error("只能輸入 publishable 或 anon key，不能使用私密金鑰");
    state.url=url;state.key=key;state.client=null;state.user=null;state.armed=false;
    localStorage.setItem(PREFIX+"url",url);localStorage.setItem(PREFIX+"key",key);localStorage.removeItem(PREFIX+"armed");
    state.message="設定已儲存，請建立帳號或登入";refresh();await setup();
  }
  async function auth(mode){
    const email=document.getElementById("syncEmail")?.value.trim()||"",password=document.getElementById("syncPassword")?.value||"";
    if(!email.includes("@")||password.length<6)throw Error("請輸入電子郵件與至少 6 字元的密碼");
    const c=client();state.email=email;localStorage.setItem(PREFIX+"email",email);
    const res=mode==="register"?await c.auth.signUp({email,password}):await c.auth.signInWithPassword({email,password});
    if(res.error)throw res.error;
    if(mode==="register"&&!res.data.session){state.message="註冊信已寄出。請至信箱驗證，完成後回來登入。";state.user=null}
    else {state.user=res.data.user;state.message="登入成功。請先備份，再按「合併並啟用同步」。"}
    refresh();
  }
  function readEntries(data){
    const map=snapshot(data),version=data._syncVersions||{},out={};
    for(const [k,v] of Object.entries(map))out[k]={...v,t:Number(version[k]?.t)||0,deleted:false};
    for(const [k,v] of Object.entries(version))if(v.deleted&&!out[k]){
      const at=k.indexOf(":");if(at<0)continue;
      out[k]={type:k.slice(0,at),id:k.slice(at+1),payload:null,t:Number(v.t)||0,deleted:true};
    }
    return out;
  }
  async function sync(){
    if(state.busy||!state.armed||!state.user)return;
    state.busy=true;state.message="正在比對兩端紀錄，請勿關閉";refresh();
    try{
      const c=client(),uid=state.user.id,remote=[];
      for(let offset=0;offset<10000;offset+=500){
        const r=await c.from("food_journal_entries").select("entry_type,entry_id,payload,version_ms,is_deleted").eq("owner_id",uid).range(offset,offset+499);
        if(r.error)throw r.error;
        remote.push(...(r.data||[]));
        if((r.data||[]).length<500)break;
      }
      const data=bridge.get(),local=readEntries(data),remoteMap=new Map(remote.map(r=>[keyOf(r.entry_type,r.entry_id),r]));
      const uploads=[];
      for(const [k,rec] of Object.entries(local)){
        const r=remoteMap.get(k);
        if(!r||rec.t>Number(r.version_ms)){
          uploads.push({owner_id:uid,entry_type:rec.type,entry_id:rec.id,payload:rec.deleted?null:rec.payload,version_ms:rec.t||Date.now(),is_deleted:rec.deleted});
        }
      }
      let changed=false;
      data._syncVersions=data._syncVersions||{};
      for(const r of remote){
        const k=keyOf(r.entry_type,r.entry_id),v=local[k]?.t??-1;
        if(Number(r.version_ms)<=v)continue;
        const type=r.entry_type;
        if(type==="reports"){
          if(r.is_deleted)delete data.reports[r.entry_id];
          else data.reports[r.entry_id]=r.payload;
        }else{
          data[type]=data[type]||[];
          const i=data[type].findIndex(x=>String(x.id)===r.entry_id);
          if(r.is_deleted){if(i>=0)data[type].splice(i,1)}
          else if(i>=0)data[type][i]=r.payload;
          else data[type].push(r.payload);
        }
        data._syncVersions[k]={t:Number(r.version_ms),deleted:!!r.is_deleted};
        changed=true;
      }
      // Save remote merged data without triggering an upload loop.
      if(changed){await bridge.saveMerged(data);state.shadow=snapshot(data)}
      for(let i=0;i<uploads.length;i+=5){
        const response=await c.from("food_journal_entries").upsert(uploads.slice(i,i+5),{onConflict:"owner_id,entry_type,entry_id"});
        if(response.error)throw response.error;
      }
      for(const r of uploads){
        const k=keyOf(r.entry_type,r.entry_id);
        data._syncVersions[k]={t:r.version_ms,deleted:r.is_deleted};
      }
      if(uploads.length)await bridge.saveMerged(data);
      state.shadow=snapshot(data);
      state.pending=false;
      state.message="同步成功：合併 "+remote.length+" 筆雲端紀錄、上傳 "+uploads.length+" 筆變動。";
    }catch(e){state.message="同步失敗，資料仍保留在本機："+detail(e)}
    finally{state.busy=false;refresh()}
  }
  async function click(buttonId){
    try{
      if(buttonId==="syncSaveConfig")await saveConfig();
      else if(buttonId==="syncLogin")await auth("login");
      else if(buttonId==="syncRegister")await auth("register");
      else if(buttonId==="syncEnable"){
        if(!confirm("請先確認已下載 JSON 備份。確定要合併這個裝置和雲端的飲食紀錄嗎？"))return true;
        if(!state.user)throw Error("請先登入");
        state.armed=true;localStorage.setItem(PREFIX+"armed","yes");await sync();
      }else if(buttonId==="syncNow")await sync();
      else if(buttonId==="syncLogout"){
        if(state.client)await state.client.auth.signOut();
        state.user=null;state.armed=false;localStorage.removeItem(PREFIX+"armed");state.message="已登出；本機資料仍保留";refresh();
      }else if(buttonId==="syncChangeConfig"){
        if(!confirm("更換專案設定不會刪除本機紀錄，但需要重新登入。確定繼續？"))return true;
        if(state.client)await state.client.auth.signOut();
        state.client=null;state.user=null;state.armed=false;state.url="";state.key="";
        localStorage.removeItem(PREFIX+"url");localStorage.removeItem(PREFIX+"key");localStorage.removeItem(PREFIX+"armed");state.message="請重新設定專案";refresh();
      }else return false;
    }catch(e){state.message="操作失敗："+detail(e);refresh()}
    return true;
  }
  document.addEventListener("visibilitychange",()=>{if(!document.hidden&&state.armed&&state.user)sync().catch(()=>{})});
  setInterval(()=>{if(!document.hidden&&state.armed&&state.user)sync().catch(()=>{})},60000);
  return {panel,init:()=>{state.shadow=snapshot(bridge.get());return setup()},trackChanges,click,sync};
}
window.FoodJournalCloud={create:makeCloud};
})();
