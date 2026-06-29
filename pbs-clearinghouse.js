/* pbs-clearinghouse.js */
(function(){
  "use strict";

  function nowISO(){ return new Date().toISOString(); }

  function safeJSON(key, fallback = {}){
    try{ return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch(e){ return fallback; }
  }

  function saveJSON(key, value){
    localStorage.setItem(key, JSON.stringify(value));
    return value;
  }

  function makeId(prefix){
    return `${prefix}-${new Date().toISOString().slice(0,10).replaceAll("-","")}-${Math.random().toString(36).slice(2,8).toUpperCase()}`;
  }

  window.PBS_CLEARINGHOUSE = {
    version: "PBS_CLEARINGHOUSE_V1.0",

    getOrCreate(){
      let record = safeJSON("pbs_client_record", null);
      if(record && record.client_record_id) return record;

      const pqs = safeJSON("pqs_intake", {});
      const pbrs = safeJSON("pbrs_intake", {});
      const pbrsResult = safeJSON("pbrs_result", {});

      record = {
        client_record_id: makeId("PBS-CLIENT"),
        business_record_id: makeId("PBS-BUSINESS"),
        created_at: nowISO(),
        updated_at: nowISO(),
        legal_name: pbrs.legal_name || pqs.legal_name || "",
        entity_type: pbrs.entity_type || pqs.entity_type || "",
        state_country: pbrs.state_country || pqs.state_country || "",
        current_layer: "PQS",
        lifecycle: [],
        pqs_present: Object.keys(pqs).length > 0,
        pbrs_present: Object.keys(pbrs).length > 0,
        pbrs_result_present: Object.keys(pbrsResult).length > 0
      };

      return saveJSON("pbs_client_record", record);
    },

    setLayer(layer){
      const record = this.getOrCreate();
      record.current_layer = layer;
      record.updated_at = nowISO();

      if(!record.lifecycle.includes(layer)){
        record.lifecycle.push(layer);
      }

      return saveJSON("pbs_client_record", record);
    },

    attach(key, value){
      const record = this.getOrCreate();
      record[key] = value;
      record.updated_at = nowISO();
      return saveJSON("pbs_client_record", record);
    },

    state(){
      return {
        client: safeJSON("pbs_client_record", {}),
        pqs: safeJSON("pqs_intake", {}),
        pbrs: safeJSON("pbrs_intake", {}),
        pbrs_result: safeJSON("pbrs_result", {}),
        pbb_selection: safeJSON("pbb_selection", {}),
        pseq_cycle: safeJSON("pseq_cycle", {}),
        pseq_tokens: safeJSON("pseq_tokens", [])
      };
    }
  };
})(); 
