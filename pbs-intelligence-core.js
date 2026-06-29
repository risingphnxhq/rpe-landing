/* ============================================================
   PHOENIX BUSINESS SYSTEM — PBS INTELLIGENCE CORE
   CEP-001 GOVERNANCE + INTELLIGENCE STACK
   VERSION: PBS_INTELLIGENCE_CORE_V1.0
   STATUS: CANONICAL INSTALL
   ============================================================ */

(function(){
  "use strict";

  const PBS_VERSION = "PBS_INTELLIGENCE_CORE_V1.0";

  /* ============================================================
     UTILITY
     ============================================================ */

  function nowISO(){
    return new Date().toISOString();
  }

  function safeJSON(key, fallback = {}){
    try{
      return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
    }catch(e){
      return fallback;
    }
  }

  function saveJSON(key, value){
    localStorage.setItem(key, JSON.stringify(value));
    return value;
  }

  function makeId(prefix){
    return `${prefix}-${new Date().toISOString().slice(0,10).replaceAll("-","")}-${Math.random().toString(36).slice(2,8).toUpperCase()}`;
  }

  function hasValue(value){
    return value !== undefined && value !== null && String(value).trim() !== "";
  }

  /* ============================================================
     CEP-001 — GOVERNANCE & EXECUTION PROTOCOL
     ============================================================ */

  const CEP001 = {
    id: "CEP-001",
    name: "Controlled Execution Protocol",
    version: "1.0",

    doctrine: {
      paymentDoesNotEqualProgression: true,
      artifactDoesNotGovernCompletion: true,
      tokenGovernsCompletion: true,
      progressionRequiresClosedExecutionRecords: true,
      subscriptionMayRemainActiveWhileProgressionLocked: true
    },

    authorizeProgression(context = {}){
      const result = {
        protocol: this.id,
        checked_at: nowISO(),
        authorized: false,
        state: "LOCKED",
        reason: "Progression requires governed closure.",
        required: [],
        satisfied: [],
        next_action: "Continue governed execution."
      };

      if(context.layer === "PQS"){
        result.authorized = true;
        result.state = "AUTHORIZED";
        result.reason = "PQS may progress into PBRS after QuickScore signal generation.";
        result.satisfied.push("PQS_SIGNAL_GENERATED");
        result.next_action = "Proceed to PBRS diagnostic.";
        return result;
      }

      if(context.layer === "PBRS"){
        if(context.pbrs_result){
          result.authorized = true;
          result.state = "AUTHORIZED";
          result.reason = "PBRS diagnostic result exists and may route into PBB.";
          result.satisfied.push("PBRS_RESULT_EXISTS");
          result.next_action = "Proceed to controlled build path.";
        }else{
          result.required.push("PBRS_RESULT_REQUIRED");
          result.reason = "PBRS result missing.";
        }
        return result;
      }

      if(context.layer === "PBB"){
        if(context.build_tier){
          result.authorized = true;
          result.state = "AUTHORIZED";
          result.reason = "Build tier selected. PSEQ may initialize execution governance.";
          result.satisfied.push("BUILD_TIER_SELECTED");
          result.next_action = "Proceed to PSEQ.";
        }else{
          result.required.push("BUILD_TIER_REQUIRED");
          result.reason = "Build tier selection required before PSEQ.";
        }
        return result;
      }

      if(context.layer === "PSEQ"){
        const issued = Number(context.tokens_issued || 0);
        if(issued >= 4){
          result.authorized = true;
          result.state = "AUTHORIZED";
          result.reason = "Four execution tokens issued. Monthly progression may unlock.";
          result.satisfied.push("FOUR_TOKENS_ISSUED");
          result.next_action = "Generate next month execution intelligence.";
        }else{
          result.required.push("FOUR_EXECUTION_TOKENS");
          result.reason = `Only ${issued}/4 tokens issued. Progression remains locked.`;
          result.next_action = "Complete remaining weekly execution records.";
        }
        return result;
      }

      if(context.layer === "PNC"){
        result.authorized = true;
        result.state = "ACTIVE_RECORD";
        result.reason = "PNC consumes historical record and client lifecycle state.";
        result.next_action = "Display client history and progression record.";
        return result;
      }

      result.required.push("VALID_LAYER_CONTEXT");
      return result;
    },

    issueReceipt(type, payload = {}){
      const receipt = {
        receipt_id: makeId("CEP"),
        protocol: this.id,
        type,
        issued_at: nowISO(),
        payload
      };

      const receipts = safeJSON("pbs_cep_receipts", []);
      receipts.push(receipt);
      saveJSON("pbs_cep_receipts", receipts);
      return receipt;
    }
  };

  /* ============================================================
     CLEARINGHOUSE INTELLIGENCE
     Owns continuity identity/state.
     ============================================================ */

  const ClearinghouseIntelligence = {
    getOrCreateClientRecord(){
      let record = safeJSON("pbs_client_record", null);

      if(record && record.client_record_id){
        return record;
      }

      const pqs = safeJSON("pqs_intake", {});
      const pbrs = safeJSON("pbrs_intake", {});

      record = {
        client_record_id: makeId("PBS-CLIENT"),
        business_record_id: makeId("PBS-BUSINESS"),
        created_at: nowISO(),
        updated_at: nowISO(),
        legal_name: pbrs.legal_name || pqs.legal_name || "",
        entity_type: pbrs.entity_type || pqs.entity_type || "",
        state_country: pbrs.state_country || pqs.state_country || "",
        current_layer: "PBRS",
        lifecycle: ["PQS", "PBRS"],
        source: pbrs.source || "pqs_to_pbrs"
      };

      return saveJSON("pbs_client_record", record);
    },

    updateLayer(layer){
      const record = this.getOrCreateClientRecord();
      record.current_layer = layer;
      record.updated_at = nowISO();

      if(!record.lifecycle.includes(layer)){
        record.lifecycle.push(layer);
      }

      return saveJSON("pbs_client_record", record);
    },

    getState(){
      return {
        client: safeJSON("pbs_client_record", {}),
        pqs: safeJSON("pqs_intake", {}),
        pbrs: safeJSON("pbrs_intake", {}),
        pbrs_result: safeJSON("pbrs_result", {}),
        pbb: safeJSON("pbb_selection", {}),
        pseq: safeJSON("pseq_cycle", {})
      };
    }
  };

  /* ============================================================
     READINESS INTELLIGENCE
     Owns readiness condition and diagnostic meaning.
     ============================================================ */

  const ReadinessIntelligence = {
    classify(score){
      if(score >= 90) return { label:"INSTITUTIONAL READINESS", state:"advanced", color:"green" };
      if(score >= 75) return { label:"STRUCTURED READINESS", state:"structured", color:"green" };
      if(score >= 60) return { label:"OPERATIONALLY CONDITIONAL", state:"conditional", color:"yellow" };
      if(score >= 40) return { label:"STRUCTURALLY CONSTRAINED", state:"constrained", color:"red" };
      return { label:"CRITICAL INSTABILITY", state:"critical", color:"red" };
    },

    summarize(score){
      const tier = this.classify(score);
      return {
        score,
        tier,
        meaning:
          score >= 75
            ? "Business demonstrates stronger structural readiness, but controlled execution is still recommended before expansion."
            : score >= 60
            ? "Business is functional but execution gaps are limiting scalable consistency."
            : "Business requires structural correction before aggressive growth activity."
      };
    }
  };

  /* ============================================================
     BUILD PATH INTELLIGENCE
     Owns PBB tier recommendation.
     ============================================================ */

  const BuildPathIntelligence = {
    recommend(pbrsResult = safeJSON("pbrs_result", {})){
      const score = Number(pbrsResult.score || 0);
      const buildPath = pbrsResult.buildPath || {};
      const risk = pbrsResult.risks || {};

      let tier = "STRUCTURE";
      let reason = "Operational structuring is recommended to create disciplined workflow and controlled execution.";

      if(score < 60 || risk.workflowVolatility === "HIGH"){
        tier = "FOUNDATION";
        reason = "Foundational stabilization is recommended because operating structure requires immediate correction.";
      }

      if(score >= 75 && risk.scaleResistance !== "HIGH"){
        tier = "SCALE";
        reason = "Scale positioning may be appropriate because readiness indicators show stronger structural maturity.";
      }

      if(buildPath.path && /foundation/i.test(buildPath.path)){
        tier = "FOUNDATION";
      }

      if(buildPath.path && /scale/i.test(buildPath.path)){
        tier = "SCALE";
      }

      return {
        recommended_tier: tier,
        reason,
        generated_at: nowISO(),
        source: "PBRS_RESULT"
      };
    },

    saveSelection(tier){
      const selection = {
        pbb_selection_id: makeId("PBB"),
        selected_tier: tier,
        selected_at: nowISO(),
        source: "PBB_CLIENT_SELECTION"
      };

      ClearinghouseIntelligence.updateLayer("PBB");
      return saveJSON("pbb_selection", selection);
    }
  };

  /* ============================================================
     EXECUTION INTELLIGENCE
     Owns weekly execution cycle state.
     ============================================================ */

  const ExecutionIntelligence = {
    createCycle(monthLabel){
      const cycle = {
        pseq_cycle_id: makeId("PSEQ-CYCLE"),
        cycle_label: monthLabel || new Date().toLocaleString("en-US", { month:"long", year:"numeric" }),
        cadence: "Weekly",
        token_threshold: 4,
        billing_status: "Active",
        progression_state: "Locked",
        created_at: nowISO(),
        executions: [1,2,3,4].map(n => ({
          execution_id: makeId(`PSEQ-W${n}`),
          week: n,
          title: `Week ${n} Execution`,
          submission_state: "Awaiting Submission",
          artifact_state: "Not Submitted",
          review_state: "Pending",
          token_state: "Not Issued Yet",
          token_id: null,
          submitted_at: null,
          closed_at: null
        }))
      };

      ClearinghouseIntelligence.updateLayer("PSEQ");
      return saveJSON("pseq_cycle", cycle);
    },

    getCycle(){
      const existing = safeJSON("pseq_cycle", null);
      return existing && existing.pseq_cycle_id ? existing : this.createCycle();
    },

    submitExecution(week, artifact = {}){
      const cycle = this.getCycle();
      const execution = cycle.executions.find(e => e.week === Number(week));

      if(!execution) return null;

      execution.submission_state = "Submitted";
      execution.artifact_state = "Artifact Received";
      execution.review_state = "Ready For NACE Review";
      execution.artifact = artifact;
      execution.submitted_at = nowISO();

      saveJSON("pseq_cycle", cycle);

      CEP001.issueReceipt("EXECUTION_SUBMITTED", {
        cycle_id: cycle.pseq_cycle_id,
        execution_id: execution.execution_id,
        week
      });

      return execution;
    },

    issueToken(week, note = "Client submitted execution as complete."){
      const cycle = this.getCycle();
      const execution = cycle.executions.find(e => e.week === Number(week));

      if(!execution) return null;

      const token = {
        token_id: makeId(`PSEQ-TOKEN-W${week}`),
        week: Number(week),
        issued_at: nowISO(),
        note,
        governing_record: true
      };

      execution.review_state = "Closed";
      execution.token_state = "Issued";
      execution.token_id = token.token_id;
      execution.closed_at = nowISO();

      const tokens = safeJSON("pseq_tokens", []);
      tokens.push(token);

      saveJSON("pseq_tokens", tokens);
      saveJSON("pseq_cycle", cycle);

      CEP001.issueReceipt("EXECUTION_TOKEN_ISSUED", {
        cycle_id: cycle.pseq_cycle_id,
        execution_id: execution.execution_id,
        token_id: token.token_id,
        week
      });

      ProgressionIntelligence.evaluate();

      return token;
    },

    tokenCount(){
      return safeJSON("pseq_tokens", []).length;
    }
  };

  /* ============================================================
     PROGRESSION INTELLIGENCE
     Owns lock/unlock and monthly continuation.
     ============================================================ */

  const ProgressionIntelligence = {
    evaluate(){
      const cycle = ExecutionIntelligence.getCycle();
      const tokensIssued = cycle.executions.filter(e => e.token_state === "Issued").length;

      const decision = CEP001.authorizeProgression({
        layer: "PSEQ",
        tokens_issued: tokensIssued
      });

      cycle.tokens_issued = tokensIssued;
      cycle.progression_state = decision.authorized ? "Unlocked" : "Locked";
      cycle.progression_decision = decision;
      cycle.updated_at = nowISO();

      saveJSON("pseq_cycle", cycle);
      return decision;
    },

    generateNextMonth(){
      const decision = this.evaluate();

      if(!decision.authorized){
        return {
          generated: false,
          reason: decision.reason
        };
      }

      const next = ExecutionIntelligence.createCycle();
      CEP001.issueReceipt("NEXT_MONTH_EXECUTION_GENERATED", {
        new_cycle_id: next.pseq_cycle_id
      });

      return {
        generated: true,
        cycle: next
      };
    }
  };

  /* ============================================================
     NACE GUIDANCE INTELLIGENCE
     Owns explainable guidance.
     ============================================================ */

  const NACEGuidanceIntelligence = {
    guidance(layer){
      const state = ClearinghouseIntelligence.getState();

      if(layer === "PQS"){
        return "PQS gives the initial readiness signal. Continue to PBRS for diagnostic clarity.";
      }

      if(layer === "PBRS"){
        return "PBRS converts intake signals into diagnostic meaning, constraints, and recommended build direction.";
      }

      if(layer === "PBB"){
        const recommendation = BuildPathIntelligence.recommend(state.pbrs_result);
        return `Recommended build tier: ${recommendation.recommended_tier}. ${recommendation.reason}`;
      }

      if(layer === "PSEQ"){
        const cycle = ExecutionIntelligence.getCycle();
        const tokens = cycle.executions.filter(e => e.token_state === "Issued").length;
        return `PSEQ governs execution closure. Current token count: ${tokens}/4. Progression remains ${cycle.progression_state || "Locked"} until token threshold is satisfied.`;
      }

      if(layer === "PNC"){
        return "PNC displays the long-term client record, completion history, reports, and progression history.";
      }

      return "PBS guidance requires a valid system layer.";
    }
  };

  /* ============================================================
     EXPORT GLOBAL PBS CORE
     ============================================================ */

  window.PBS_INTELLIGENCE_CORE = {
    version: PBS_VERSION,
    CEP001,
    ClearinghouseIntelligence,
    ReadinessIntelligence,
    BuildPathIntelligence,
    ExecutionIntelligence,
    ProgressionIntelligence,
    NACEGuidanceIntelligence,

    bootstrap(layer){
      ClearinghouseIntelligence.updateLayer(layer);

      const context = {
        layer,
        pbrs_result: safeJSON("pbrs_result", null),
        build_tier: safeJSON("pbb_selection", {}).selected_tier,
        tokens_issued: ExecutionIntelligence.tokenCount()
      };

      const governance = CEP001.authorizeProgression(context);

      return {
        version: PBS_VERSION,
        layer,
        state: ClearinghouseIntelligence.getState(),
        governance,
        guidance: NACEGuidanceIntelligence.guidance(layer)
      };
    }
  };

})(); 
