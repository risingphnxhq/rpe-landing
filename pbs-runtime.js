/* pbs-runtime.js */
(function(){
  "use strict";

  function detectLayer(){
    const host = window.location.hostname.toLowerCase();

    if(host.includes("pqs.")) return "PQS";
    if(host.includes("pbrs.")) return "PBRS";
    if(host.includes("pbb.")) return "PBB";
    if(host.includes("pseq.")) return "PSEQ";
    if(host.includes("pnc.")) return "PNC";

    return "PBS";
  }

  window.PBS_RUNTIME = {
    version: "PBS_RUNTIME_V1.0",

    boot(){
      const layer = detectLayer();

      if(window.PBS_CLEARINGHOUSE){
        window.PBS_CLEARINGHOUSE.setLayer(layer);
      }

      let core = null;
      if(window.PBS_INTELLIGENCE_CORE){
        core = window.PBS_INTELLIGENCE_CORE.bootstrap(layer);
      }

      const runtime = {
        layer,
        doctrine: window.PBS_DOCTRINE || null,
        clearinghouse: window.PBS_CLEARINGHOUSE ? window.PBS_CLEARINGHOUSE.state() : null,
        intelligence: core,
        routing: window.PBS_ROUTING || null,
        booted_at: new Date().toISOString()
      };

      window.PBS_ACTIVE_RUNTIME = runtime;
      console.log("PBS Runtime Active:", runtime);
      return runtime;
    }
  };

  window.addEventListener("DOMContentLoaded", function(){
    window.PBS_RUNTIME.boot();
  });
})(); 
