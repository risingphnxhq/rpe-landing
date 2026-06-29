/* pbs-routing.js */
(function(){
  "use strict";

  window.PBS_ROUTING = {
    version: "PBS_ROUTING_V1.0",

    routes: {
      PQS: "https://pqs.risingphoenixhq.com/index.html",
      PQS_INTAKE: "https://pqs.risingphoenixhq.com/intake.html",
      PQS_OUTPUT: "https://pqs.risingphoenixhq.com/output.html",

      PBRS: "https://pbrs.risingphoenixhq.com/index.html",
      PBRS_OUTPUT: "https://pbrs.risingphoenixhq.com/output.html",

      PBB: "https://pbb.risingphoenixhq.com/index.html",

      PSEQ: "https://pseq.risingphoenixhq.com/dashboard.html",
      PSEQ_DASHBOARD: "https://pseq.risingphoenixhq.com/dashboard.html",

      PNC: "https://pnc.risingphoenixhq.com/index.html"
    },

    nextLayer(layer){
      const flow = ["PQS", "PBRS", "PBB", "PSEQ", "PNC"];
      const index = flow.indexOf(layer);
      return index >= 0 ? flow[index + 1] || null : null;
    },

    go(routeKey){
      const url = this.routes[routeKey];
      if(!url){
        console.warn("PBS Routing: unknown route", routeKey);
        return false;
      }
      window.location.href = url;
      return true;
    },

    governedNext(currentLayer){
      const next = this.nextLayer(currentLayer);
      if(!next) return false;
      return this.go(next);
    }
  };
})(); 
