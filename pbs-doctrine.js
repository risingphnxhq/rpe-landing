/* pbs-doctrine.js */
(function(){
  "use strict";

  window.PBS_DOCTRINE = {
    version: "PBS_DOCTRINE_V1.0",
    status: "CANONICAL",
    stack: ["PQS", "PBRS", "PBB", "PSEQ", "PNC"],

    layerResponsibilities: {
      PQS: "Rapid readiness signal only. Does not perform deep diagnosis.",
      PBRS: "Business readiness diagnostic. Seeds Clearinghouse continuity.",
      PBB: "Controlled business build path. Does not govern execution closure.",
      PSEQ: "Execution governance, weekly assignments, artifacts, tokens, and progression.",
      PNC: "Long-term dashboard, history, reports, completion, and subscription relationship."
    },

    governance: {
      paymentDoesNotEqualProgression: true,
      artifactDoesNotGovernCompletion: true,
      tokenGovernsExecutionClosure: true,
      fourTokensCloseMonthlyCycle: true,
      subscriptionCanRemainActiveWhileProgressionLocked: true
    },

    sourceOfTruth: {
      clientIdentity: "Clearinghouse",
      readiness: "PQS/PBRS Readiness Intelligence",
      buildTier: "PBB Build Path Intelligence",
      executionState: "PSEQ Execution Intelligence",
      progressionState: "CEP-001 / Progression Intelligence",
      longTermRecord: "PNC"
    }
  };
})(); 
