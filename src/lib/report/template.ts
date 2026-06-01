/**
 * Northbridge Tier I Structural Diagnostic — HTML Report Template
 *
 * All client-specific data is expressed as {{VARIABLE_NAME}} placeholders.
 * The inject() function replaces them with real data at generation time.
 *
 * Variables:
 *   {{CLIENT_NAME}}           – full name
 *   {{COMPANY_NAME}}          – company name
 *   {{INDUSTRY}}              – industry
 *   {{REVENUE_RANGE}}         – revenue range
 *   {{OWNER_HOURS}}           – hours per week
 *   {{PRIMARY_OBJECTIVE}}     – exit goal
 *   {{RAW_SCORE}}             – numeric score (e.g. 44)
 *   {{RAW_SCORE_MAX}}         – max raw score (50)
 *   {{SCORE_PERCENTAGE}}      – 0-100 number for arc/pct display
 *   {{WEIGHTED_SCORE}}        – weighted total (e.g. 44)
 *   {{WEIGHTED_MAX}}          – max weighted (125)
 *   {{CLASSIFICATION}}        – Founder-Dependent | Transitional | Stabilized | Transfer-Ready
 *   {{GATE_1_SCORE}}          – Gate 1 raw /10
 *   {{GATE_2_SCORE}}          – Gate 2 raw /10
 *   {{GATE_3_SCORE}}          – Gate 3 raw /10
 *   {{GATE_4_SCORE}}          – Gate 4 raw /10
 *   {{GATE_5_SCORE}}          – Gate 5 raw /10
 *   {{GATE_1_AVG}}            – Gate 1 average (score/5)
 *   {{GATE_2_AVG}}            – Gate 2 average
 *   {{GATE_3_AVG}}            – Gate 3 average
 *   {{GATE_4_AVG}}            – Gate 4 average
 *   {{GATE_5_AVG}}            – Gate 5 average
 *   {{GATE_1_FLAG}}           – OVERRIDE | BELOW 2.0 | OK
 *   {{GATE_2_FLAG}}           – same
 *   {{GATE_3_FLAG}}           – same
 *   {{GATE_4_FLAG}}           – same
 *   {{GATE_5_FLAG}}           – same
 *   {{GATE_1_FLAG_CLASS}}     – CSS class: "" (critical) or "warn"
 *   {{GATE_2_FLAG_CLASS}}     – same
 *   {{GATE_3_FLAG_CLASS}}     – same
 *   {{GATE_4_FLAG_CLASS}}     – same
 *   {{GATE_5_FLAG_CLASS}}     – same
 *   {{CLASSIFICATION_TAG}}    – short uppercase label for the tag badge
 *   {{ACTIVE_BAND_1}}         – "active" or ""
 *   {{ACTIVE_BAND_2}}         – same
 *   {{ACTIVE_BAND_3}}         – same
 *   {{ACTIVE_BAND_4}}         – same
 *   {{EXECUTIVE_SUMMARY}}     – Claude-generated HTML paragraphs
 *   {{GATE_1_ANALYSIS}}       – Claude-generated gate analysis paragraph
 *   {{GATE_2_ANALYSIS}}
 *   {{GATE_3_ANALYSIS}}
 *   {{GATE_4_ANALYSIS}}
 *   {{GATE_5_ANALYSIS}}
 *   {{FRAGILITY_1_TITLE}} {{FRAGILITY_1_BODY}} {{FRAGILITY_1_TAG}}
 *   {{FRAGILITY_2_TITLE}} {{FRAGILITY_2_BODY}} {{FRAGILITY_2_TAG}}
 *   {{FRAGILITY_3_TITLE}} {{FRAGILITY_3_BODY}} {{FRAGILITY_3_TAG}}
 *   {{MOVE_1_TITLE}} {{MOVE_1_BODY}} {{MOVE_1_TAG}}
 *   {{MOVE_2_TITLE}} {{MOVE_2_BODY}} {{MOVE_2_TAG}}
 *   {{MOVE_3_TITLE}} {{MOVE_3_BODY}} {{MOVE_3_TAG}}
 *   {{MOVE_4_TITLE}} {{MOVE_4_BODY}} {{MOVE_4_TAG}}
 *   {{MOVE_5_TITLE}} {{MOVE_5_BODY}} {{MOVE_5_TAG}}
 *   {{RESCORE_SUMMARY}}       – Claude-generated rescore summary paragraph
 *   {{REPORT_DATE}}           – e.g. "May 2026"
 *   {{REPORT_ID}}             – e.g. "NB-T1-2026-001"
 *   {{SCORE_ARC_DASHARRAY}}   – SVG stroke-dasharray for the filled arc
 *   {{SCORE_ARC_COLOR}}       – stroke color for arc (red/orange/green)
 *   {{FLAGS_CONTENT}}         – flags text block
 */

export const REPORT_TEMPLATE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{{CLIENT_NAME}} · {{COMPANY_NAME}} — Tier I Structural Diagnostic · Northbridge Strategies</title>
<style>
  :root {
    --paper:#f7f5ef; --paper-2:#efece4; --paper-3:#e6e2d6;
    --ink:#0a0a0a; --ink-2:#2a2a28; --ink-3:#57554f; --ink-4:#8c8a82;
    --rule:#d8d4c7; --rule-soft:#e6e2d6; --card:#ffffff;
    --nb-green:#2D7A4F; --nb-green-2:#1f5a39; --nb-orange:#D4711E;
    --sev-1:#a63232; --sev-1-bg:#f5e0db; --sev-1-strong:#8a2222;
    --sev-2:#b07a14; --sev-2-bg:#f4e6c4;
    --sev-3:#5c8a4a; --sev-3-bg:#dde9ce;
    --sev-4:#2D7A4F; --sev-4-bg:#cde0d2;
    --serif:Georgia,'Iowan Old Style','Source Serif Pro','Times New Roman',serif;
    --sans:-apple-system,BlinkMacSystemFont,'Inter','Segoe UI','Helvetica Neue',system-ui,sans-serif;
    --mono:'SF Mono','JetBrains Mono','IBM Plex Mono',ui-monospace,Menlo,monospace;
  }
  *{box-sizing:border-box}
  html,body{margin:0;padding:0;background:var(--paper);color:var(--ink)}
  body{font-family:var(--sans);font-size:16px;line-height:1.55;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
  a{color:inherit}
  ::selection{background:var(--ink);color:var(--paper)}

  .topbar{position:sticky;top:0;z-index:50;background:rgba(247,245,239,0.92);backdrop-filter:saturate(150%) blur(8px);border-bottom:1px solid var(--rule)}
  .topbar-inner{max-width:1320px;margin:0 auto;padding:14px 32px;display:flex;align-items:center;gap:28px}
  .wordmark{display:flex;align-items:center;gap:18px;font-family:var(--serif);font-weight:500;letter-spacing:-0.005em}
  .wordmark .nb-logo{height:64px;width:auto;display:block}
  .wordmark .nb-divider{height:36px;width:1px;background:var(--rule)}
  .wordmark span.tag{font-size:11.5px;letter-spacing:0.18em;color:var(--ink-3);text-transform:uppercase;font-family:var(--mono)}
  .topnav{margin-left:auto;display:flex;gap:2px}
  .topnav a{text-decoration:none;font-size:13px;letter-spacing:0.02em;padding:7px 12px;color:var(--ink-2);border-radius:2px;cursor:pointer}
  .topnav a:hover{background:var(--paper-2);color:var(--ink)}
  .topnav a.active{color:var(--ink);font-weight:600}
  .topnav a.active::after{content:'';display:block;height:2px;background:var(--nb-orange);margin:4px 12px 0}
  .doc-id{font-family:var(--mono);font-size:11px;color:var(--ink-3);letter-spacing:0.04em}

  .page-section{display:none !important}
  .page-section.active{display:block !important}

  /* ── Overview page ─────────────────────────────────────────────── */
  main{max-width:1320px;margin:0 auto;padding:56px 32px 120px}

  .kicker{font-family:var(--mono);font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:var(--ink-3)}
  .kicker .dot{color:var(--nb-orange)}
  h1,h2,h3,h4{font-family:var(--serif);font-weight:500;letter-spacing:-0.012em}
  h1{font-size:64px;line-height:1.04;margin:0}
  h2{font-size:32px;line-height:1.15;margin:0 0 18px}
  h3{font-size:22px;line-height:1.22;margin:0 0 10px}

  .hero{padding-top:24px;border-top:1px solid var(--ink);position:relative}
  .hero-meta{display:grid;grid-template-columns:1fr auto;gap:24px;padding-bottom:22px}
  .hero-meta .left{display:flex;flex-direction:column;gap:8px}
  .hero-meta .right{text-align:right;font-family:var(--mono);font-size:11.5px;letter-spacing:0.06em;color:var(--ink-3);line-height:1.7}
  .hero h1{margin-top:10px;max-width:19ch}
  .hero-sub{margin-top:26px;max-width:70ch;font-family:var(--serif);font-size:19px;line-height:1.55;color:var(--ink-2)}

  .score-panel{margin-top:56px;display:grid;grid-template-columns:minmax(360px,1fr) 1.6fr;gap:0;background:var(--card);border:1px solid var(--ink)}
  .score-dial{padding:40px 36px;position:relative;border-right:1px solid var(--ink);display:flex;flex-direction:column;gap:22px}
  .score-label-top{display:flex;justify-content:space-between;align-items:flex-start}
  .classification-tag{display:inline-flex;align-items:center;gap:8px;background:var(--ink);color:var(--paper);font-family:var(--mono);font-size:11px;letter-spacing:0.18em;padding:6px 10px}
  .classification-tag::before{content:'';width:6px;height:6px;background:var(--nb-orange)}
  .score-arc-wrap{display:flex;align-items:center;gap:28px}
  .score-arc{width:180px;height:180px;position:relative;flex-shrink:0}
  .score-arc svg{width:100%;height:100%;transform:rotate(-90deg)}
  .score-arc-num{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center}
  .score-arc-num .big{font-family:var(--serif);font-size:56px;line-height:1;letter-spacing:-0.02em}
  .score-arc-num .over{font-family:var(--mono);font-size:12px;color:var(--ink-3);letter-spacing:0.06em;margin-top:4px}
  .score-arc-band{display:flex;flex-direction:column;gap:6px}
  .score-arc-band .h{font-family:var(--serif);font-size:28px;line-height:1;color:var(--ink)}
  .score-arc-band .s{font-family:var(--mono);font-size:11px;letter-spacing:0.12em;color:var(--ink-3);text-transform:uppercase}
  .bands{display:grid;grid-template-columns:1fr;gap:6px;border-top:1px solid var(--rule);padding-top:18px}
  .band{display:grid;grid-template-columns:38px 1fr auto;align-items:center;gap:12px;font-size:12.5px;padding:4px 0}
  .band .marker{height:4px;background:var(--rule)}
  .band.active .marker{background:var(--nb-orange)}
  .band.active .name{font-weight:600}
  .band .name{color:var(--ink-2)}
  .band .range{font-family:var(--mono);font-size:11px;color:var(--ink-3)}

  .gate-matrix{padding:32px 36px}
  .gate-matrix h3{font-size:13px;font-family:var(--mono);font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:var(--ink-3);margin-bottom:18px}
  .gate-row{display:grid;grid-template-columns:28px 1fr 80px 60px 110px;gap:14px;align-items:center;padding:16px 0;border-top:1px solid var(--rule-soft);font-size:14px}
  .gate-row:first-of-type{border-top:1px solid var(--ink)}
  .gate-row:last-of-type{border-top:1.5px solid var(--ink);border-bottom:1.5px solid var(--ink);margin-top:2px;padding:18px 0;font-weight:600}
  .gate-row .g{font-family:var(--mono);color:var(--ink-3);font-size:12px}
  .gate-row .label{font-family:var(--serif);font-size:17px}
  .gate-row .num{font-family:var(--mono);font-variant-numeric:tabular-nums;text-align:right;font-size:13px}
  .gate-row .avg{font-family:var(--mono);font-variant-numeric:tabular-nums;text-align:right;font-size:13px}
  .gate-row .flag{font-family:var(--mono);font-size:10.5px;letter-spacing:0.06em;text-transform:uppercase;padding:3px 6px;text-align:center;background:var(--sev-1-bg);color:var(--sev-1)}
  .gate-row .flag.warn{background:var(--sev-2-bg);color:var(--sev-2)}
  .gate-row .flag.ok{background:var(--sev-4-bg);color:var(--sev-4)}
  .gate-row .flag.tot{background:transparent;color:var(--ink);border:1px solid var(--ink)}
  .bar-track{height:4px;background:var(--rule-soft);position:relative;grid-column:1 / -1;margin-top:-2px}
  .bar-fill{height:100%;background:var(--sev-1)}
  .bar-fill.warn{background:var(--sev-2)}

  .metrics{margin-top:56px;display:grid;grid-template-columns:repeat(4,1fr);gap:0;border-top:1px solid var(--ink);border-bottom:1px solid var(--ink)}
  .metric{padding:28px 26px;border-right:1px solid var(--rule);display:flex;flex-direction:column;gap:8px}
  .metric:last-child{border-right:none}
  .metric .m-label{font-family:var(--mono);font-size:10.5px;letter-spacing:0.18em;text-transform:uppercase;color:var(--ink-3)}
  .metric .m-value{font-family:var(--serif);font-size:44px;line-height:1;letter-spacing:-0.02em}
  .metric .m-unit{font-family:var(--mono);font-size:13px;color:var(--ink-3)}
  .metric .m-foot{margin-top:6px;font-size:12.5px;color:var(--ink-2);line-height:1.4}

  section{margin-top:88px}
  .section-head{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:end;padding-bottom:22px;border-bottom:1px solid var(--ink);margin-bottom:32px}
  .section-head .meta{font-family:var(--mono);font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:var(--ink-3)}
  .section-head .desc{font-family:var(--serif);font-size:17px;line-height:1.5;color:var(--ink-2)}

  .vectors{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
  .vector{background:var(--card);border:1px solid var(--rule);padding:24px;display:flex;flex-direction:column;gap:12px;position:relative}
  .vector::before{content:'';position:absolute;top:0;left:0;width:36px;height:3px;background:var(--sev-1)}
  .vector .v-num{font-family:var(--mono);font-size:11px;letter-spacing:0.18em;color:var(--ink-3)}
  .vector .v-title{font-family:var(--serif);font-size:22px;line-height:1.2}
  .vector .v-body{font-size:13.5px;line-height:1.55;color:var(--ink-2)}
  .vector .v-foot{margin-top:auto;padding-top:14px;border-top:1px solid var(--rule-soft);font-family:var(--mono);font-size:10.5px;letter-spacing:0.06em;color:var(--ink-3);text-transform:uppercase}

  .path{display:grid;grid-template-columns:1fr 1fr;gap:0;border:1px solid var(--ink);background:var(--ink);color:var(--paper)}
  .path .col{padding:38px 36px}
  .path .col+.col{border-left:1px solid #2a2a28}
  .path .col h3{color:var(--paper)}
  .path .col .lbl{font-family:var(--mono);font-size:11px;letter-spacing:0.18em;color:var(--nb-orange);text-transform:uppercase}
  .path .col p{color:#c8c6bf;font-size:14.5px;line-height:1.6;max-width:50ch}
  .path .col .big{font-family:var(--serif);font-size:38px;line-height:1.1;margin:8px 0 14px}
  .path .tier-chips{display:flex;gap:0;margin-top:24px}
  .path .chip{flex:1;padding:14px 12px;text-align:left;border-right:1px solid #2a2a28;display:flex;flex-direction:column;gap:4px;font-size:12px;background:#141413}
  .path .chip:last-child{border-right:none}
  .path .chip.active{background:var(--nb-green)}
  .path .chip.locked{opacity:0.5}
  .path .chip .n{font-family:var(--mono);font-size:10.5px;letter-spacing:0.14em;color:var(--paper)}
  .path .chip .l{font-family:var(--serif);color:var(--paper);font-size:14px}
  .path .chip .s{color:#c8c6bf;font-size:11px;letter-spacing:0.04em}
  .path .chip.active .s{color:rgba(255,255,255,0.85)}

  .moves{display:grid;grid-template-columns:1fr 1fr;gap:0;border-top:1px solid var(--ink);border-left:1px solid var(--ink)}
  .move{padding:24px 26px;border-right:1px solid var(--ink);border-bottom:1px solid var(--ink);display:grid;grid-template-columns:42px 1fr;gap:18px;background:var(--card)}
  .move .n{font-family:var(--serif);font-size:32px;line-height:1;color:var(--nb-orange)}
  .move h4{font-family:var(--serif);font-weight:500;font-size:19px;margin:0 0 6px;line-height:1.25}
  .move p{margin:0;font-size:13.5px;color:var(--ink-2);line-height:1.55}
  .move .tag{display:inline-block;margin-top:10px;font-family:var(--mono);font-size:10.5px;letter-spacing:0.08em;color:var(--ink-3);text-transform:uppercase}
  .moves .move:nth-child(5){grid-column:span 2;background:var(--paper-2)}

  .cta-strip{margin-top:80px;border-top:1px solid var(--ink);border-bottom:1px solid var(--ink);padding:36px 0;display:grid;grid-template-columns:repeat(4,1fr);gap:0}
  .cta{padding:0 28px;border-right:1px solid var(--rule);text-decoration:none;color:inherit;display:flex;flex-direction:column;gap:8px;transition:background 0.15s;cursor:pointer}
  .cta:last-child{border-right:none}
  .cta:hover{background:var(--paper-2)}
  .cta .cn{font-family:var(--mono);font-size:11px;letter-spacing:0.18em;color:var(--nb-orange);text-transform:uppercase}
  .cta .ct{font-family:var(--serif);font-size:22px;line-height:1.2}
  .cta .cd{font-size:12.5px;color:var(--ink-2)}
  .cta .arrow{margin-top:auto;padding-top:14px;font-family:var(--mono);font-size:11px;letter-spacing:0.06em;color:var(--ink);text-transform:uppercase;display:flex;align-items:center;gap:6px}
  .cta .arrow::after{content:'→';transition:transform 0.15s}
  .cta:hover .arrow::after{transform:translateX(3px)}

  footer{margin-top:96px;padding-top:32px;border-top:1px solid var(--ink);display:grid;grid-template-columns:1fr 1fr 1fr;gap:32px;font-size:12.5px;color:var(--ink-3);line-height:1.65}
  footer .f-label{font-family:var(--mono);font-size:10.5px;letter-spacing:0.18em;text-transform:uppercase;color:var(--ink-3);margin-bottom:8px}
  footer strong{color:var(--ink);font-weight:500}

  /* ── Gates page ─────────────────────────────────────────────────── */
  .gates-main{max-width:1320px;margin:0 auto;padding:48px 32px 120px;display:grid;grid-template-columns:240px 1fr;gap:48px}
  .gates-aside{position:sticky;top:74px;align-self:start;max-height:calc(100vh - 100px);overflow:auto;padding:8px 0}
  .gates-aside .label{font-family:var(--mono);font-size:10.5px;letter-spacing:0.18em;text-transform:uppercase;color:var(--ink-3);margin-bottom:12px}
  .gates-aside ol{list-style:none;padding:0;margin:0;border-left:1px solid var(--rule)}
  .gates-aside ol li{padding:0}
  .gates-aside ol a{display:block;padding:10px 14px;text-decoration:none;font-size:13.5px;color:var(--ink-2);border-left:2px solid transparent;margin-left:-1px;cursor:pointer}
  .gates-aside ol a:hover{background:var(--paper-2);color:var(--ink)}
  .gates-aside ol a.active{border-left-color:var(--nb-orange);color:var(--ink);font-weight:600;background:var(--paper-2)}
  .gates-aside ol .g{font-family:var(--mono);font-size:11px;color:var(--ink-3);letter-spacing:0.08em;margin-right:6px}

  .page-hero{padding-top:14px;padding-bottom:28px;border-top:1px solid var(--ink);border-bottom:1px solid var(--ink);margin-bottom:48px}
  .page-hero .kicker{font-family:var(--mono);font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:var(--ink-3);margin-bottom:18px}
  .page-hero .kicker .dot{color:var(--nb-orange)}
  .page-hero h1{font-family:var(--serif);font-weight:500;letter-spacing:-0.012em;font-size:46px;line-height:1.05;margin:0;max-width:18ch}
  .page-hero .desc{font-family:var(--serif);font-size:18px;line-height:1.5;color:var(--ink-2);margin-top:20px;max-width:64ch}
  .page-hero .summary{display:grid;grid-template-columns:repeat(4,1fr);gap:0;margin-top:32px;border-top:1px solid var(--rule)}
  .page-hero .summary > div{padding:18px 22px 4px;border-right:1px solid var(--rule)}
  .page-hero .summary > div:last-child{border-right:none}
  .page-hero .summary .l{font-family:var(--mono);font-size:10.5px;letter-spacing:0.18em;text-transform:uppercase;color:var(--ink-3)}
  .page-hero .summary .v{font-family:var(--serif);font-size:28px;line-height:1.1;margin-top:4px}
  .page-hero .summary .v small{font-family:var(--mono);font-size:12px;color:var(--ink-3)}

  .gate{margin-bottom:80px;scroll-margin-top:90px}
  .gate-head{display:grid;grid-template-columns:64px 1fr;gap:24px;padding-bottom:18px;border-bottom:1px solid var(--ink);margin-bottom:22px;align-items:start}
  .gate-num{font-family:var(--serif);font-size:64px;line-height:0.9;color:var(--nb-orange)}
  .gate-head h2{font-family:var(--serif);font-weight:500;letter-spacing:-0.012em;font-size:30px;line-height:1.15;margin:0}
  .gate-meta{display:flex;gap:18px;margin-top:8px;flex-wrap:wrap;font-family:var(--mono);font-size:11.5px;color:var(--ink-3);letter-spacing:0.04em}
  .gate-meta span{padding:3px 0}
  .gate-meta .pill{background:var(--paper-2);padding:3px 8px;color:var(--ink-2)}
  .gate-meta .pill.flag{background:var(--sev-1-bg);color:var(--sev-1)}
  .gate-meta .pill.warn{background:var(--sev-2-bg);color:var(--sev-2)}
  .gate-meta .pill.ok{background:var(--sev-4-bg);color:var(--sev-4)}
  .gate-summary{margin-top:8px;font-family:var(--serif);font-size:16.5px;line-height:1.55;color:var(--ink-2);max-width:72ch}
  .gate-authority{margin-top:18px;padding:14px 18px;background:var(--paper-2);border-left:3px solid var(--ink);font-size:13.5px;color:var(--ink-2);line-height:1.55}
  .gate-authority strong{font-family:var(--mono);font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:var(--ink);display:block;margin-bottom:4px}

  /* ── Fragility page ─────────────────────────────────────────────── */
  .heatmap-section{display:grid;grid-template-columns:1.6fr 1fr;gap:40px;margin-bottom:64px}
  .heatmap{background:var(--card);border:1px solid var(--ink);padding:32px}
  .heatmap-head{display:flex;justify-content:space-between;align-items:end;border-bottom:1px solid var(--ink);padding-bottom:14px;margin-bottom:24px}
  .heatmap-head h3{font-family:var(--serif);font-weight:500;font-size:24px;margin:0;letter-spacing:-0.012em}
  .heatmap-head .meta{font-family:var(--mono);font-size:11px;letter-spacing:0.14em;color:var(--ink-3);text-transform:uppercase}
  .hm-grid{display:grid;grid-template-columns:180px repeat(5,1fr);gap:6px}
  .hm-corner{font-family:var(--mono);font-size:10.5px;letter-spacing:0.12em;text-transform:uppercase;color:var(--ink-3);padding:6px 8px}
  .hm-col-h{font-family:var(--mono);font-size:10.5px;letter-spacing:0.12em;text-transform:uppercase;color:var(--ink-3);text-align:center;padding:6px 0}
  .hm-row-h{display:flex;align-items:center;gap:8px;font-family:var(--serif);font-size:14px;color:var(--ink);padding:8px 6px}
  .hm-row-h .gn{font-family:var(--mono);font-size:11px;color:var(--ink-3);letter-spacing:0.08em}
  .hm-row-h .name{line-height:1.2}
  .hm-cell{aspect-ratio:1.4/1;border:1px solid var(--rule);background:var(--card);display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative}
  .hm-cell .v{font-family:var(--serif);font-size:24px;line-height:1;font-weight:500}
  .hm-cell .label{font-family:var(--mono);font-size:9px;letter-spacing:0.06em;color:rgba(0,0,0,0.55);text-transform:uppercase;margin-top:4px;line-height:1.2;text-align:center;padding:0 6px;max-width:100%}
  .hm-cell[data-score="1"]{background:var(--sev-1-bg);border-color:var(--sev-1)}
  .hm-cell[data-score="1"] .v{color:var(--sev-1-strong)}
  .hm-cell[data-score="2"]{background:var(--sev-2-bg);border-color:var(--sev-2)}
  .hm-cell[data-score="2"] .v{color:var(--sev-2)}
  .hm-cell[data-score="3"]{background:var(--sev-3-bg);border-color:var(--sev-3)}
  .hm-cell[data-score="3"] .v{color:var(--sev-3)}
  .hm-cell[data-score="4"]{background:var(--sev-4-bg);border-color:var(--sev-4)}
  .hm-cell[data-score="4"] .v{color:var(--sev-4)}
  .legend{margin-top:24px;display:flex;flex-wrap:wrap;gap:16px;font-size:12.5px;color:var(--ink-2)}
  .legend > div{display:flex;align-items:center;gap:8px;font-family:var(--mono);font-size:11px;letter-spacing:0.04em}
  .legend .sw{width:14px;height:14px;border:1px solid}
  .legend .s1 .sw{background:var(--sev-1-bg);border-color:var(--sev-1)}
  .legend .s2 .sw{background:var(--sev-2-bg);border-color:var(--sev-2)}
  .legend .s3 .sw{background:var(--sev-3-bg);border-color:var(--sev-3)}
  .legend .s4 .sw{background:var(--sev-4-bg);border-color:var(--sev-4)}

  .compression{border:1px solid var(--ink);padding:32px;display:flex;flex-direction:column;gap:18px;background:var(--ink);color:var(--paper)}
  .compression .kicker{font-family:var(--mono);font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:var(--nb-orange)}
  .compression h3{font-family:var(--serif);font-weight:500;font-size:26px;line-height:1.2;margin:0;color:var(--paper);letter-spacing:-0.012em}
  .compression p{margin:0;font-size:13.5px;line-height:1.6;color:#c8c6bf}
  .comp-stack{display:flex;flex-direction:column;gap:0;border-top:1px solid #2a2a28;margin-top:8px}
  .comp-row{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;padding:14px 0;border-bottom:1px solid #2a2a28;font-size:13px}
  .comp-row .l{color:#c8c6bf;line-height:1.4}
  .comp-row .l small{font-family:var(--mono);font-size:10.5px;color:var(--ink-4);letter-spacing:0.06em;display:block;margin-top:2px;text-transform:uppercase}
  .comp-row .v{font-family:var(--mono);font-size:14px;color:var(--paper);font-variant-numeric:tabular-nums}
  .comp-total{padding:16px 0 0;display:grid;grid-template-columns:1fr auto;font-size:13px}
  .comp-total .l{font-family:var(--mono);font-size:11px;letter-spacing:0.16em;color:var(--nb-orange);text-transform:uppercase}
  .comp-total .v{font-family:var(--serif);font-size:32px;color:var(--paper);line-height:1}

  section.frag-table{margin-bottom:56px}
  .ft-head{display:flex;align-items:end;justify-content:space-between;border-bottom:1px solid var(--ink);padding-bottom:14px;margin-bottom:0}
  .ft-head h2{font-family:var(--serif);font-weight:500;font-size:30px;letter-spacing:-0.012em;margin:0;line-height:1.15}
  .ft-head .ft-count{font-family:var(--mono);font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:var(--ink-3)}
  .ft-head .ft-count strong{color:var(--ink);font-family:var(--serif);font-size:24px;letter-spacing:-0.012em}
  .ft-table{display:grid;grid-template-columns:1.6fr 1fr 1.2fr 130px;border-left:1px solid var(--rule);border-right:1px solid var(--rule)}
  .ft-table .th{background:var(--paper-2);font-family:var(--mono);font-size:10.5px;letter-spacing:0.14em;text-transform:uppercase;color:var(--ink-3);padding:10px 14px;border-bottom:1px solid var(--ink);border-top:1px solid var(--ink)}
  .ft-table .td{padding:14px;border-bottom:1px solid var(--rule);font-size:13.5px;color:var(--ink-2);display:flex;align-items:center}
  .ft-table .td.name{font-family:var(--serif);font-size:15.5px;color:var(--ink);line-height:1.3}
  .ft-table .td.priority{font-family:var(--mono);font-size:11px;letter-spacing:0.06em}
  .ft-table .td.priority.high{color:var(--sev-1)}
  .ft-table .td.priority.med{color:var(--sev-2)}

  /* ── Roadmap page ────────────────────────────────────────────────── */
  .tl-axis{display:grid;grid-template-columns:repeat(3,1fr);gap:0;border-top:1px solid var(--ink);border-bottom:1px solid var(--ink);background:var(--ink);color:var(--paper);margin-bottom:0}
  .tl-axis .axis-col{padding:24px 28px;border-right:1px solid #2a2a28;display:flex;flex-direction:column;gap:8px;position:relative}
  .tl-axis .axis-col:last-child{border-right:none}
  .tl-axis .axis-col .n{font-family:var(--mono);font-size:11px;letter-spacing:0.22em;color:var(--nb-orange);text-transform:uppercase}
  .tl-axis .axis-col .big{font-family:var(--serif);font-size:56px;line-height:0.95;letter-spacing:-0.02em}
  .tl-axis .axis-col .l{font-family:var(--mono);font-size:11px;color:#c8c6bf;letter-spacing:0.06em;text-transform:uppercase;margin-top:4px}
  .tl-cols{display:grid;grid-template-columns:repeat(3,1fr);gap:0;border-left:1px solid var(--ink);border-right:1px solid var(--ink);border-bottom:1px solid var(--ink)}
  .tl-col{border-right:1px solid var(--ink);background:var(--card);min-height:480px}
  .tl-col:last-child{border-right:none}
  .milestone{padding:22px 24px 22px 30px;border-bottom:1px solid var(--rule);position:relative}
  .milestone:last-child{border-bottom:none}
  .milestone::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--ink);opacity:0}
  .milestone .m-num{font-family:var(--mono);font-size:11px;letter-spacing:0.12em;color:var(--ink-3)}
  .milestone .m-title{font-family:var(--serif);font-weight:500;font-size:20px;line-height:1.25;margin:6px 0 10px;letter-spacing:-0.005em}
  .milestone .m-action{font-size:13.5px;color:var(--ink-2);line-height:1.55;margin:0 0 12px}
  .milestone .m-impact{padding:10px 12px;background:var(--paper-2);font-size:12.5px;line-height:1.5;color:var(--ink-2);border-left:2px solid var(--nb-green)}
  .milestone .m-impact strong{font-family:var(--mono);font-size:10.5px;letter-spacing:0.12em;color:var(--nb-green-2);text-transform:uppercase;display:block;margin-bottom:4px}
  .milestone .m-tag{display:inline-block;margin-top:10px;font-family:var(--mono);font-size:10.5px;letter-spacing:0.08em;color:var(--ink-3);text-transform:uppercase}

  .rescore{margin-top:48px;display:grid;grid-template-columns:1fr 1fr;gap:0;border:1px solid var(--ink)}
  .rescore .left{padding:32px 36px;border-right:1px solid var(--ink);background:var(--card)}
  .rescore .right{padding:32px 36px;background:var(--paper-2)}
  .rescore .lbl{font-family:var(--mono);font-size:11px;letter-spacing:0.18em;color:var(--ink-3);text-transform:uppercase;margin-bottom:10px}
  .rescore h3{font-family:var(--serif);font-weight:500;font-size:26px;line-height:1.2;margin:0 0 14px;letter-spacing:-0.012em}
  .rescore p{margin:0 0 18px;font-size:14px;line-height:1.6;color:var(--ink-2)}
  .rescore-grid{display:grid;grid-template-columns:1fr auto auto auto;gap:0;border-top:1px solid var(--rule)}
  .rescore-grid > div{padding:12px 0;border-bottom:1px solid var(--rule-soft);font-size:13.5px;display:flex;align-items:center}
  .rescore-grid .h{font-family:var(--mono);font-size:10.5px;letter-spacing:0.12em;color:var(--ink-3);text-transform:uppercase}
  .rescore-grid .num{font-family:var(--mono);font-variant-numeric:tabular-nums;justify-content:flex-end;padding-right:14px}
  .rescore-grid .now{color:var(--sev-1);font-weight:500}
  .rescore-grid .target{color:var(--nb-green);font-weight:500}
  .rescore-grid .arrow{justify-content:center;padding:0 14px;color:var(--ink-3)}

  /* ── Methodology page ───────────────────────────────────────────── */
  .section-head-method{display:grid;grid-template-columns:auto 1fr;gap:32px;align-items:end;padding-bottom:18px;border-bottom:1px solid var(--ink);margin-bottom:32px}
  .section-head-method .kicker{font-family:var(--mono);font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:var(--ink-3)}
  .section-head-method h2{font-family:var(--serif);font-weight:500;font-size:32px;line-height:1.1;letter-spacing:-0.012em;margin:6px 0 0}
  .section-head-method .right{font-family:var(--serif);font-size:16px;line-height:1.55;color:var(--ink-2);max-width:48ch;justify-self:end}

  .anchor-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:0;border-left:1px solid var(--ink)}
  .anchor{padding:24px 22px;border-right:1px solid var(--ink);border-top:1px solid var(--ink);border-bottom:1px solid var(--ink);background:var(--card);display:flex;flex-direction:column;gap:14px;position:relative}
  .anchor::before{content:'';position:absolute;top:0;left:0;width:48px;height:4px}
  .anchor.s1::before{background:var(--sev-1)}
  .anchor.s2::before{background:var(--sev-2)}
  .anchor.s3::before{background:var(--sev-3)}
  .anchor.s4::before{background:var(--sev-4)}
  .anchor .score{font-family:var(--serif);font-size:48px;line-height:1;letter-spacing:-0.02em}
  .anchor.s1 .score{color:var(--sev-1)}
  .anchor.s2 .score{color:var(--sev-2)}
  .anchor.s3 .score{color:var(--sev-3)}
  .anchor.s4 .score{color:var(--sev-4)}
  .anchor .name{font-family:var(--serif);font-size:18px;line-height:1.2}
  .anchor .desc{font-size:13px;line-height:1.55;color:var(--ink-2);margin:0}
  .anchor .consequence{margin-top:auto;padding-top:12px;border-top:1px solid var(--rule-soft);font-family:var(--mono);font-size:10.5px;letter-spacing:0.06em;color:var(--ink-3);text-transform:uppercase}

  .weighting{border-collapse:collapse;width:100%;background:var(--card);border:1px solid var(--ink);font-size:13.5px}
  .weighting thead{background:var(--paper-2);font-family:var(--mono);font-size:10.5px;letter-spacing:0.16em;text-transform:uppercase;color:var(--ink-3)}
  .weighting th{padding:14px 20px;border-bottom:1px solid var(--ink);font-weight:400;text-align:left}
  .weighting th.num{text-align:right}
  .weighting td{padding:16px 20px;border-bottom:1px solid var(--rule);vertical-align:top;line-height:1.5}
  .weighting tr:last-child td{border-bottom:none}
  .weighting .gate-col{font-family:var(--serif);font-size:17px;font-weight:500;letter-spacing:-0.005em;white-space:nowrap}
  .weighting .gate-col small{display:block;font-family:var(--mono);font-size:10.5px;color:var(--ink-3);letter-spacing:0.06em;font-weight:400;margin-top:2px;white-space:nowrap}
  .weighting .rationale{color:var(--ink-2)}
  .weighting .weight{font-family:var(--mono);font-size:14px;color:var(--ink);text-align:right;white-space:nowrap;vertical-align:middle;font-variant-numeric:tabular-nums}
  .weighting .max{font-family:var(--mono);font-size:12px;color:var(--ink-3);text-align:right;white-space:nowrap;vertical-align:middle;font-variant-numeric:tabular-nums}

  .bands-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:0;border-left:1px solid var(--ink);border-top:1px solid var(--ink);border-bottom:1px solid var(--ink);background:var(--card)}
  .band-card{padding:24px 22px;border-right:1px solid var(--ink);display:flex;flex-direction:column;gap:10px;position:relative}
  .band-card::before{content:'';position:absolute;top:0;left:0;height:3px;width:100%;background:var(--rule)}
  .band-card.active::before{background:var(--nb-orange);height:6px}
  .band-card.active{background:var(--paper-2)}
  .band-card .lbl{font-family:var(--mono);font-size:10.5px;letter-spacing:0.14em;text-transform:uppercase;color:var(--ink-3)}
  .band-card .name{font-family:var(--serif);font-size:22px;line-height:1.2;letter-spacing:-0.005em}
  .band-card .range{font-family:var(--mono);font-size:13px;color:var(--ink)}
  .band-card .desc{font-size:13px;color:var(--ink-2);line-height:1.5;margin-top:6px}
  .band-card .tag{margin-top:auto;padding-top:12px;font-family:var(--mono);font-size:10.5px;color:var(--nb-orange);letter-spacing:0.12em;text-transform:uppercase}

  .overrides{display:grid;grid-template-columns:repeat(3,1fr);gap:0;border-top:1px solid var(--ink);border-left:1px solid var(--ink)}
  .override{background:var(--card);padding:24px 24px 28px;border-right:1px solid var(--ink);border-bottom:1px solid var(--ink);display:flex;flex-direction:column;gap:12px}
  .override .n{font-family:var(--serif);font-size:40px;line-height:1;color:var(--sev-1)}
  .override h3{font-family:var(--serif);font-weight:500;font-size:19px;line-height:1.2;margin:0}
  .override p{margin:0;font-size:13.5px;line-height:1.55;color:var(--ink-2)}

  .glossary{columns:2;column-gap:48px;column-rule:1px solid var(--rule)}
  .gl-item{break-inside:avoid;padding:14px 0;border-bottom:1px solid var(--rule-soft)}
  .gl-item dt{font-family:var(--serif);font-weight:500;font-size:16px;letter-spacing:-0.005em;margin-bottom:4px}
  .gl-item dd{margin:0;font-size:13.5px;line-height:1.55;color:var(--ink-2)}

  /* ── Responsive ──────────────────────────────────────────────────── */
  @media(max-width:1080px){
    .score-panel{grid-template-columns:1fr}
    .score-dial{border-right:none;border-bottom:1px solid var(--ink)}
    .metrics{grid-template-columns:repeat(2,1fr)}
    .metric:nth-child(2){border-right:none}
    .metric:nth-child(1),.metric:nth-child(2){border-bottom:1px solid var(--rule)}
    .vectors{grid-template-columns:1fr}
    .path{grid-template-columns:1fr}
    .cta-strip{grid-template-columns:1fr 1fr}
    .moves{grid-template-columns:1fr}
    .moves .move:nth-child(5){grid-column:1}
    h1{font-size:44px}
    .gates-main{grid-template-columns:1fr}
    .heatmap-section{grid-template-columns:1fr}
    .tl-axis,.tl-cols{grid-template-columns:1fr}
    .anchor-grid,.bands-grid{grid-template-columns:repeat(2,1fr)}
    .overrides{grid-template-columns:1fr}
    .overrides .override{border-right:none}
    .rescore{grid-template-columns:1fr}
    .rescore .left{border-right:none;border-bottom:1px solid var(--ink)}
  }
  @media(max-width:640px){
    main,.gates-main{padding:32px 18px 80px}
    .topbar-inner{padding:12px 18px;flex-wrap:wrap}
    .topnav{width:100%;overflow-x:auto}
    .metrics{grid-template-columns:1fr}
    .metric{border-right:none;border-bottom:1px solid var(--rule)}
    .cta-strip{grid-template-columns:1fr}
    .cta{border-right:none;border-bottom:1px solid var(--rule);padding:16px 0}
    h1{font-size:36px}
    .score-arc-wrap{flex-direction:column;align-items:flex-start}
    .page-hero h1{font-size:30px}
    .glossary{columns:1}
    .anchor-grid,.bands-grid{grid-template-columns:1fr}
  }
  @media print{
    .topbar{position:static;background:transparent;backdrop-filter:none;border-bottom:1px solid var(--ink)}
    .topnav,.cta-strip{display:none}
    main,.gates-main{padding:24px;max-width:none;display:block}
    section{margin-top:36px;page-break-inside:avoid}
    .score-panel,.vector,.move{page-break-inside:avoid}
    .gates-aside{display:none}
    body{background:white}
  }
</style>
</head>
<body>

<header class="topbar">
  <div class="topbar-inner">
    <div class="wordmark">
      <span class="nb-divider"></span>
      <span class="tag">Northbridge Strategies · Exit Standard™</span>
    </div>
    <nav class="topnav">
      <a href="#index" data-page="index">Overview</a>
      <a href="#gates" data-page="gates">Gate Findings</a>
      <a href="#fragility" data-page="fragility">Fragility Map</a>
      <a href="#roadmap" data-page="roadmap">Roadmap</a>
      <a href="#methodology" data-page="methodology">Methodology</a>
    </nav>
    <div class="doc-id" style="margin-left:auto">{{REPORT_ID}}</div>
  </div>
</header>

<!-- ═══════════════════════════════ OVERVIEW ═══════════════════════════════ -->
<section class="page-section" data-page="index" id="page-index">
<main>

  <div class="hero">
    <div class="hero-meta">
      <div class="left">
        <div class="kicker">Tier I Structural Diagnostic <span class="dot">●</span> Confidential</div>
      </div>
      <div class="right">
        Prepared for &nbsp;·&nbsp; {{COMPANY_NAME}}<br>
        Prepared by &nbsp;·&nbsp; Doug Royal, Principal<br>
        Northbridge Strategies &nbsp;·&nbsp; {{REPORT_DATE}}
      </div>
    </div>
    <h1>{{HERO_HEADLINE}}</h1>
    <p class="hero-sub">{{EXECUTIVE_SUMMARY}}</p>
  </div>

  <div class="score-panel">
    <div class="score-dial">
      <div class="score-label-top">
        <div class="kicker">Classification</div>
        <div class="classification-tag">{{CLASSIFICATION_TAG}}</div>
      </div>

      <div class="score-arc-wrap">
        <div class="score-arc" aria-label="Weighted score {{WEIGHTED_SCORE}} of {{WEIGHTED_MAX}}">
          <svg viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#e6e2d6" stroke-width="6"></circle>
            <circle id="arc-fill" cx="50" cy="50" r="42" fill="none" stroke="{{SCORE_ARC_COLOR}}" stroke-width="6" stroke-dasharray="0 263.89" stroke-linecap="butt"></circle>
          </svg>
          <div class="score-arc-num">
            <span class="big" id="score-big">{{WEIGHTED_SCORE}}</span>
            <span class="over">of {{WEIGHTED_MAX}} weighted</span>
          </div>
        </div>
        <div class="score-arc-band">
          <span class="s">CLASSIFICATION</span>
          <span class="h">{{CLASSIFICATION}}</span>
        </div>
      </div>

      <div class="bands">
        <div class="band {{ACTIVE_BAND_1}}"><div class="marker"></div><div class="name">Founder-Dependent</div><div class="range">0–46</div></div>
        <div class="band {{ACTIVE_BAND_2}}"><div class="marker"></div><div class="name">Transitional</div><div class="range">47–77</div></div>
        <div class="band {{ACTIVE_BAND_3}}"><div class="marker"></div><div class="name">Stabilized</div><div class="range">78–109</div></div>
        <div class="band {{ACTIVE_BAND_4}}"><div class="marker"></div><div class="name">Transfer-Ready</div><div class="range">110–125</div></div>
      </div>
    </div>

    <div class="gate-matrix">
      <h3>Score by Enforcement Gate</h3>
      <div class="gate-row">
        <div class="g">G1</div><div class="label">Authority Architecture</div>
        <div class="num">{{GATE_1_SCORE}}/10</div><div class="avg">{{GATE_1_AVG}}</div>
        <div class="flag {{GATE_1_FLAG_CLASS}}">{{GATE_1_FLAG}}</div>
      </div>
      <div class="gate-row">
        <div class="g">G2</div><div class="label">Process Independence</div>
        <div class="num">{{GATE_2_SCORE}}/10</div><div class="avg">{{GATE_2_AVG}}</div>
        <div class="flag {{GATE_2_FLAG_CLASS}}">{{GATE_2_FLAG}}</div>
      </div>
      <div class="gate-row">
        <div class="g">G3</div><div class="label">Commercial Discipline</div>
        <div class="num">{{GATE_3_SCORE}}/10</div><div class="avg">{{GATE_3_AVG}}</div>
        <div class="flag {{GATE_3_FLAG_CLASS}}">{{GATE_3_FLAG}}</div>
      </div>
      <div class="gate-row">
        <div class="g">G4</div><div class="label">Revenue Quality &amp; Durability</div>
        <div class="num">{{GATE_4_SCORE}}/10</div><div class="avg">{{GATE_4_AVG}}</div>
        <div class="flag {{GATE_4_FLAG_CLASS}}">{{GATE_4_FLAG}}</div>
      </div>
      <div class="gate-row">
        <div class="g">G5</div><div class="label">Financial Integrity</div>
        <div class="num">{{GATE_5_SCORE}}/10</div><div class="avg">{{GATE_5_AVG}}</div>
        <div class="flag {{GATE_5_FLAG_CLASS}}">{{GATE_5_FLAG}}</div>
      </div>
      <div class="gate-row">
        <div class="g">∑</div><div class="label">Total weighted</div>
        <div class="num">{{RAW_SCORE}}/50</div><div class="avg">—</div>
        <div class="flag tot">{{CLASSIFICATION}}</div>
      </div>
    </div>
  </div>

  <div class="metrics">
    <div class="metric">
      <span class="m-label">Transferability Score</span>
      <span class="m-value">{{SCORE_PERCENTAGE}}<span class="m-unit">%</span></span>
      <span class="m-foot">{{WEIGHTED_SCORE}} of {{WEIGHTED_MAX}} weighted points.</span>
    </div>
    <div class="metric">
      <span class="m-label">Revenue Range</span>
      <span class="m-value">{{REVENUE_RANGE}}</span>
      <span class="m-foot">{{INDUSTRY}} · {{COMPANY_NAME}}</span>
    </div>
    <div class="metric">
      <span class="m-label">Primary Objective</span>
      <span class="m-value" style="font-size:28px;line-height:1.2">{{PRIMARY_OBJECTIVE}}</span>
      <span class="m-foot">Stated owner objective at intake.</span>
    </div>
    <div class="metric">
      <span class="m-label">Owner Hours / Week</span>
      <span class="m-value">{{OWNER_HOURS}}<span class="m-unit"> hrs</span></span>
      <span class="m-foot">Weekly founder involvement at intake.</span>
    </div>
  </div>

  <section>
    <div class="section-head">
      <div>
        <div class="kicker">02 · Where the structure fails</div>
        <h2>Top three fragility vectors</h2>
      </div>
      <p class="desc">{{FRAGILITY_INTRO}}</p>
    </div>
    <div class="vectors">
      <article class="vector">
        <span class="v-num">VECTOR 01</span>
        <h3 class="v-title">{{FRAGILITY_1_TITLE}}</h3>
        <p class="v-body">{{FRAGILITY_1_BODY}}</p>
        <div class="v-foot">{{FRAGILITY_1_TAG}}</div>
      </article>
      <article class="vector">
        <span class="v-num">VECTOR 02</span>
        <h3 class="v-title">{{FRAGILITY_2_TITLE}}</h3>
        <p class="v-body">{{FRAGILITY_2_BODY}}</p>
        <div class="v-foot">{{FRAGILITY_2_TAG}}</div>
      </article>
      <article class="vector">
        <span class="v-num">VECTOR 03</span>
        <h3 class="v-title">{{FRAGILITY_3_TITLE}}</h3>
        <p class="v-body">{{FRAGILITY_3_BODY}}</p>
        <div class="v-foot">{{FRAGILITY_3_TAG}}</div>
      </article>
    </div>
  </section>

  <section>
    <div class="section-head">
      <div>
        <div class="kicker">03 · Recommended path</div>
        <h2>Tier II — Continuity Architecture</h2>
      </div>
      <p class="desc">Tier II is not a sales process and not a marketing engagement. It is the structural installation phase that converts a Founder-Dependent business into a transferable institution. Twelve weeks. Four to six hours per week of founder commitment.</p>
    </div>
    <div class="path">
      <div class="col">
        <div class="lbl">Why now</div>
        <div class="big">{{PATH_WHY_NOW}}</div>
        <p>{{PATH_WHY_NOW_BODY}}</p>
      </div>
      <div class="col">
        <div class="lbl">The cost of inaction</div>
        <div class="big">{{PATH_INACTION}}</div>
        <p>{{PATH_INACTION_BODY}}</p>
        <div class="tier-chips">
          <div class="chip"><span class="n">TIER I</span><span class="l">Diagnostic</span><span class="s">Complete</span></div>
          <div class="chip active"><span class="n">TIER II</span><span class="l">Continuity</span><span class="s">Recommended · 12 wk</span></div>
          <div class="chip locked"><span class="n">TIER III</span><span class="l">Narrative</span><span class="s">{{TIER3_STATUS}}</span></div>
          <div class="chip locked"><span class="n">TIER IV</span><span class="l">Scrutiny</span><span class="s">Locked</span></div>
        </div>
      </div>
    </div>
  </section>

  <section>
    <div class="section-head">
      <div>
        <div class="kicker">04 · Before Tier II begins</div>
        <h2>First five moves — within 30 days</h2>
      </div>
      <p class="desc">Five structural actions that can start without external engagement. They do not replace Tier II; they establish the foundation Tier II builds upon.</p>
    </div>
    <div class="moves">
      <article class="move"><span class="n">01</span><div><h4>{{MOVE_1_TITLE}}</h4><p>{{MOVE_1_BODY}}</p><span class="tag">{{MOVE_1_TAG}}</span></div></article>
      <article class="move"><span class="n">02</span><div><h4>{{MOVE_2_TITLE}}</h4><p>{{MOVE_2_BODY}}</p><span class="tag">{{MOVE_2_TAG}}</span></div></article>
      <article class="move"><span class="n">03</span><div><h4>{{MOVE_3_TITLE}}</h4><p>{{MOVE_3_BODY}}</p><span class="tag">{{MOVE_3_TAG}}</span></div></article>
      <article class="move"><span class="n">04</span><div><h4>{{MOVE_4_TITLE}}</h4><p>{{MOVE_4_BODY}}</p><span class="tag">{{MOVE_4_TAG}}</span></div></article>
      <article class="move"><span class="n">05</span><div><h4>{{MOVE_5_TITLE}}</h4><p>{{MOVE_5_BODY}}</p><span class="tag">{{MOVE_5_TAG}}</span></div></article>
    </div>
  </section>

  <div class="cta-strip">
    <a class="cta" href="#gates" data-page="gates"><span class="cn">Detail 01</span><span class="ct">Gate-Level Findings</span><span class="cd">Analysis for each of the five enforcement gates.</span><span class="arrow">View gate analysis</span></a>
    <a class="cta" href="#fragility" data-page="fragility"><span class="cn">Detail 02</span><span class="ct">Structural Fragility Map</span><span class="cd">Risk heatmap by gate and severity.</span><span class="arrow">Open heatmap</span></a>
    <a class="cta" href="#roadmap" data-page="roadmap"><span class="cn">Detail 03</span><span class="ct">30 / 60 / 90 Day Roadmap</span><span class="cd">Sequenced corrections plus re-score targets.</span><span class="arrow">Open roadmap</span></a>
    <a class="cta" href="#methodology" data-page="methodology"><span class="cn">Detail 04</span><span class="ct">Methodology &amp; Authorities</span><span class="cd">Five gates · four diligence authorities.</span><span class="arrow">View framework</span></a>
  </div>

  <footer>
    <div>
      <div class="f-label">Document</div>
      <strong>{{REPORT_ID}} · {{REPORT_DATE}}</strong><br>
      Tier I Structural Diagnostic Report. Principal-signed by Doug Royal, Northbridge Strategies.
    </div>
    <div>
      <div class="f-label">Confidentiality</div>
      This document is confidential and the proprietary work product of Northbridge Strategies. Distribution beyond the named client and the client's directly retained professional advisors requires written authorization.
    </div>
    <div>
      <div class="f-label">Scope</div>
      This report is not a valuation. It does not set an asking price, market the business, or advise on transaction structure. It is a defensible written record of structural conditions as of the live underwriting session.
    </div>
  </footer>

</main>
</section>

<!-- ═══════════════════════════════ GATE FINDINGS ═══════════════════════════════ -->
<section class="page-section" data-page="gates" id="page-gates">
<div class="gates-main">

  <aside class="gates-aside">
    <div class="label">Five enforcement gates</div>
    <ol id="gate-nav">
      <li><a href="#g1" class="active"><span class="g">G1</span> Authority Architecture</a></li>
      <li><a href="#g2"><span class="g">G2</span> Process Independence</a></li>
      <li><a href="#g3"><span class="g">G3</span> Commercial Discipline</a></li>
      <li><a href="#g4"><span class="g">G4</span> Revenue Quality</a></li>
      <li><a href="#g5"><span class="g">G5</span> Financial Integrity</a></li>
    </ol>
  </aside>

  <div>
    <div class="page-hero">
      <div class="kicker">Gate Findings <span class="dot">●</span> Five enforcement gates</div>
      <h1>Each gate states the structural condition and its transaction consequence.</h1>
      <p class="desc">Gate findings are generated by analyzing the diagnostic score data against the Northbridge Standard. Each gate reflects the structural reality observed, the diligence consequence, and the architectural correction required.</p>
    </div>

    <section class="gate" id="g1">
      <div class="gate-head">
        <div class="gate-num">01</div>
        <div>
          <h2>Authority Architecture</h2>
          <div class="gate-meta">
            <span class="pill">Weight 1.5×</span>
            <span class="pill">Score {{GATE_1_SCORE}}/10 · Avg {{GATE_1_AVG}}</span>
            <span class="pill {{GATE_1_META_CLASS}}">{{GATE_1_FLAG}}</span>
          </div>
          <p class="gate-summary">{{GATE_1_ANALYSIS}}</p>
          <div class="gate-authority"><strong>Diligence Authority</strong>SBA Lender Underwriting under SOP 50-10. The underwriter requires demonstrated cash-flow stability that does not depend on the seller's continued involvement post-close.</div>
        </div>
      </div>
    </section>

    <section class="gate" id="g2">
      <div class="gate-head">
        <div class="gate-num">02</div>
        <div>
          <h2>Process Independence</h2>
          <div class="gate-meta">
            <span class="pill">Weight 1.0×</span>
            <span class="pill">Score {{GATE_2_SCORE}}/10 · Avg {{GATE_2_AVG}}</span>
            <span class="pill {{GATE_2_META_CLASS}}">{{GATE_2_FLAG}}</span>
          </div>
          <p class="gate-summary">{{GATE_2_ANALYSIS}}</p>
          <div class="gate-authority"><strong>Diligence Authority</strong>Buyer Operational Diligence. Diligence interviews with staff surface dependency patterns immediately.</div>
        </div>
      </div>
    </section>

    <section class="gate" id="g3">
      <div class="gate-head">
        <div class="gate-num">03</div>
        <div>
          <h2>Commercial Discipline</h2>
          <div class="gate-meta">
            <span class="pill">Weight 1.0×</span>
            <span class="pill">Score {{GATE_3_SCORE}}/10 · Avg {{GATE_3_AVG}}</span>
            <span class="pill {{GATE_3_META_CLASS}}">{{GATE_3_FLAG}}</span>
          </div>
          <p class="gate-summary">{{GATE_3_ANALYSIS}}</p>
          <div class="gate-authority"><strong>Diligence Authority</strong>Buy-Side Quality of Earnings. EBITDA normalization gets contested throughout QoE when pricing operates by intuition and discounts lack audit trail.</div>
        </div>
      </div>
    </section>

    <section class="gate" id="g4">
      <div class="gate-head">
        <div class="gate-num">04</div>
        <div>
          <h2>Revenue Quality &amp; Durability</h2>
          <div class="gate-meta">
            <span class="pill">Weight 1.5×</span>
            <span class="pill">Score {{GATE_4_SCORE}}/10 · Avg {{GATE_4_AVG}}</span>
            <span class="pill {{GATE_4_META_CLASS}}">{{GATE_4_FLAG}}</span>
          </div>
          <p class="gate-summary">{{GATE_4_ANALYSIS}}</p>
          <div class="gate-authority"><strong>Diligence Authority</strong>M&amp;A Counsel Representation Review. Counsel scrutinizes assignability of revenue-generating contracts under change of control.</div>
        </div>
      </div>
    </section>

    <section class="gate" id="g5">
      <div class="gate-head">
        <div class="gate-num">05</div>
        <div>
          <h2>Financial Integrity</h2>
          <div class="gate-meta">
            <span class="pill">Weight 1.25×</span>
            <span class="pill">Score {{GATE_5_SCORE}}/10 · Avg {{GATE_5_AVG}}</span>
            <span class="pill {{GATE_5_META_CLASS}}">{{GATE_5_FLAG}}</span>
          </div>
          <p class="gate-summary">{{GATE_5_ANALYSIS}}</p>
          <div class="gate-authority"><strong>Diligence Authority</strong>Buy-Side QoE and SBA underwriting jointly. QoE quality is the most common cause of LOI-stage transaction termination.</div>
        </div>
      </div>
    </section>

    <footer style="margin-top:48px;padding-top:32px;border-top:1px solid var(--ink);font-size:12.5px;color:var(--ink-3)">
      <strong>{{REPORT_ID}} · Gate Findings.</strong>
      Each finding combines standardized institutional language with score data from the qualifier submission.
    </footer>
  </div>

</div>
</section>

<!-- ═══════════════════════════════ FRAGILITY MAP ═══════════════════════════════ -->
<section class="page-section" data-page="fragility" id="page-fragility">
<main>

  <div class="page-hero">
    <div class="kicker">Structural Fragility Map <span class="dot">●</span> Five gates</div>
    <h1>Gate-level severity across the five enforcement dimensions.</h1>
    <p class="desc">Each gate is mapped against its severity band. The compression panel shows the cumulative SDE multiple impact of the structural fragility identified.</p>
  </div>

  <div class="heatmap-section">
    <div class="heatmap">
      <div class="heatmap-head">
        <h3>Severity by gate</h3>
        <div class="meta">Five enforcement gates</div>
      </div>
      <div class="hm-grid">
        <div class="hm-corner">Gate</div>
        <div class="hm-col-h">Score</div>
        <div class="hm-col-h">Avg</div>
        <div class="hm-col-h">Weight</div>
        <div class="hm-col-h">Max</div>
        <div class="hm-col-h">Status</div>

        <div class="hm-row-h"><span class="gn">G1</span><span class="name">Authority</span></div>
        <div class="hm-cell" data-score="{{GATE_1_SEV}}"><span class="v">{{GATE_1_SCORE}}</span><span class="label">/ 10</span></div>
        <div class="hm-cell" data-score="{{GATE_1_SEV}}"><span class="v">{{GATE_1_AVG}}</span><span class="label">avg</span></div>
        <div class="hm-cell"><span class="v">1.5×</span><span class="label">weight</span></div>
        <div class="hm-cell"><span class="v">30</span><span class="label">pts</span></div>
        <div class="hm-cell" data-score="{{GATE_1_SEV}}"><span class="v" style="font-size:11px;text-align:center">{{GATE_1_FLAG}}</span></div>

        <div class="hm-row-h"><span class="gn">G2</span><span class="name">Process</span></div>
        <div class="hm-cell" data-score="{{GATE_2_SEV}}"><span class="v">{{GATE_2_SCORE}}</span><span class="label">/ 10</span></div>
        <div class="hm-cell" data-score="{{GATE_2_SEV}}"><span class="v">{{GATE_2_AVG}}</span><span class="label">avg</span></div>
        <div class="hm-cell"><span class="v">1.0×</span><span class="label">weight</span></div>
        <div class="hm-cell"><span class="v">20</span><span class="label">pts</span></div>
        <div class="hm-cell" data-score="{{GATE_2_SEV}}"><span class="v" style="font-size:11px;text-align:center">{{GATE_2_FLAG}}</span></div>

        <div class="hm-row-h"><span class="gn">G3</span><span class="name">Pricing</span></div>
        <div class="hm-cell" data-score="{{GATE_3_SEV}}"><span class="v">{{GATE_3_SCORE}}</span><span class="label">/ 10</span></div>
        <div class="hm-cell" data-score="{{GATE_3_SEV}}"><span class="v">{{GATE_3_AVG}}</span><span class="label">avg</span></div>
        <div class="hm-cell"><span class="v">1.0×</span><span class="label">weight</span></div>
        <div class="hm-cell"><span class="v">20</span><span class="label">pts</span></div>
        <div class="hm-cell" data-score="{{GATE_3_SEV}}"><span class="v" style="font-size:11px;text-align:center">{{GATE_3_FLAG}}</span></div>

        <div class="hm-row-h"><span class="gn">G4</span><span class="name">Revenue</span></div>
        <div class="hm-cell" data-score="{{GATE_4_SEV}}"><span class="v">{{GATE_4_SCORE}}</span><span class="label">/ 10</span></div>
        <div class="hm-cell" data-score="{{GATE_4_SEV}}"><span class="v">{{GATE_4_AVG}}</span><span class="label">avg</span></div>
        <div class="hm-cell"><span class="v">1.5×</span><span class="label">weight</span></div>
        <div class="hm-cell"><span class="v">30</span><span class="label">pts</span></div>
        <div class="hm-cell" data-score="{{GATE_4_SEV}}"><span class="v" style="font-size:11px;text-align:center">{{GATE_4_FLAG}}</span></div>

        <div class="hm-row-h"><span class="gn">G5</span><span class="name">Financial</span></div>
        <div class="hm-cell" data-score="{{GATE_5_SEV}}"><span class="v">{{GATE_5_SCORE}}</span><span class="label">/ 10</span></div>
        <div class="hm-cell" data-score="{{GATE_5_SEV}}"><span class="v">{{GATE_5_AVG}}</span><span class="label">avg</span></div>
        <div class="hm-cell"><span class="v">1.25×</span><span class="label">weight</span></div>
        <div class="hm-cell"><span class="v">25</span><span class="label">pts</span></div>
        <div class="hm-cell" data-score="{{GATE_5_SEV}}"><span class="v" style="font-size:11px;text-align:center">{{GATE_5_FLAG}}</span></div>
      </div>
      <div class="legend">
        <div class="s1"><span class="sw"></span>1–2 · Critical / Weak</div>
        <div class="s2"><span class="sw"></span>3–4 · Warning</div>
        <div class="s3"><span class="sw"></span>5–6 · Acceptable</div>
        <div class="s4"><span class="sw"></span>7–10 · Strong</div>
      </div>
    </div>

    <aside class="compression">
      <div class="kicker">Multiple compression</div>
      <h3>{{COMPRESSION_HEADLINE}}</h3>
      <p>{{COMPRESSION_BODY}}</p>
      <div class="comp-stack">
        <div class="comp-row"><div class="l">Gate 1 · Authority<small>SBA Lender Underwriting</small></div><div class="v">{{G1_COMPRESSION}}</div></div>
        <div class="comp-row"><div class="l">Gate 3 · Commercial<small>Buy-Side QoE</small></div><div class="v">{{G3_COMPRESSION}}</div></div>
        <div class="comp-row"><div class="l">Gate 5 · Financial<small>Buy-Side QoE / SBA</small></div><div class="v">{{G5_COMPRESSION}}</div></div>
      </div>
      <div class="comp-total">
        <div class="l">Classification</div>
        <div class="v">{{CLASSIFICATION}}</div>
      </div>
    </aside>
  </div>

</main>
</section>

<!-- ═══════════════════════════════ ROADMAP ═══════════════════════════════ -->
<section class="page-section" data-page="roadmap" id="page-roadmap">
<main>

  <div class="page-hero">
    <div class="kicker">Ninety-Day Correction Roadmap <span class="dot">●</span> Sequenced by structural impact</div>
    <h1>Sequencing by structural impact, not effort or cost.</h1>
    <p class="desc">The roadmap addresses the structural fragility identified in the diagnostic and initiates the conditions that Tier II installs over the subsequent twelve weeks.</p>
  </div>

  <section style="margin-top:0">
    <div class="tl-axis">
      <div class="axis-col"><span class="n">Phase 01</span><span class="big">30<span style="font-size:0.5em;color:#c8c6bf"> · days</span></span><span class="l">Authority and evidence foundation</span></div>
      <div class="axis-col"><span class="n">Phase 02</span><span class="big">60<span style="font-size:0.5em;color:#c8c6bf"> · days</span></span><span class="l">Process, pricing, contracts, brand</span></div>
      <div class="axis-col"><span class="n">Phase 03</span><span class="big">90<span style="font-size:0.5em;color:#c8c6bf"> · days</span></span><span class="l">Succession, data room, lead generation</span></div>
    </div>
    <div class="tl-cols">
      <div class="tl-col">
        <article class="milestone">
          <span class="m-num">01 · 30-day</span>
          <h3 class="m-title">{{MOVE_1_TITLE}}</h3>
          <p class="m-action">{{MOVE_1_BODY}}</p>
          <div class="m-impact"><strong>Structural impact</strong>{{MOVE_1_IMPACT}}</div>
          <span class="m-tag">{{MOVE_1_TAG}}</span>
        </article>
        <article class="milestone">
          <span class="m-num">02 · 30-day</span>
          <h3 class="m-title">{{MOVE_2_TITLE}}</h3>
          <p class="m-action">{{MOVE_2_BODY}}</p>
          <div class="m-impact"><strong>Structural impact</strong>{{MOVE_2_IMPACT}}</div>
          <span class="m-tag">{{MOVE_2_TAG}}</span>
        </article>
      </div>
      <div class="tl-col">
        <article class="milestone">
          <span class="m-num">03 · 60-day</span>
          <h3 class="m-title">{{MOVE_3_TITLE}}</h3>
          <p class="m-action">{{MOVE_3_BODY}}</p>
          <div class="m-impact"><strong>Structural impact</strong>{{MOVE_3_IMPACT}}</div>
          <span class="m-tag">{{MOVE_3_TAG}}</span>
        </article>
        <article class="milestone">
          <span class="m-num">04 · 60-day</span>
          <h3 class="m-title">{{MOVE_4_TITLE}}</h3>
          <p class="m-action">{{MOVE_4_BODY}}</p>
          <div class="m-impact"><strong>Structural impact</strong>{{MOVE_4_IMPACT}}</div>
          <span class="m-tag">{{MOVE_4_TAG}}</span>
        </article>
      </div>
      <div class="tl-col">
        <article class="milestone">
          <span class="m-num">05 · 90-day</span>
          <h3 class="m-title">{{MOVE_5_TITLE}}</h3>
          <p class="m-action">{{MOVE_5_BODY}}</p>
          <div class="m-impact"><strong>Structural impact</strong>{{MOVE_5_IMPACT}}</div>
          <span class="m-tag">{{MOVE_5_TAG}}</span>
        </article>
      </div>
    </div>
  </section>

  <div class="rescore" style="margin-top:64px">
    <div class="left">
      <div class="lbl">Tier II re-score targets</div>
      <h3>{{RESCORE_HEADLINE}}</h3>
      <p>{{RESCORE_SUMMARY}}</p>
      <div class="rescore-grid">
        <div class="h">Gate</div><div class="h num">Now</div><div class="h arrow"></div><div class="h num">Target</div>
        <div>G1 · Authority Architecture</div><div class="num now">{{GATE_1_AVG}}</div><div class="arrow">→</div><div class="num target">≥ 2.5</div>
        <div>G2 · Process Independence</div><div class="num now">{{GATE_2_AVG}}</div><div class="arrow">→</div><div class="num target">≥ 2.5</div>
        <div>G3 · Commercial Discipline</div><div class="num now">{{GATE_3_AVG}}</div><div class="arrow">→</div><div class="num target">≥ 2.5</div>
        <div>G4 · Revenue Quality</div><div class="num now">{{GATE_4_AVG}}</div><div class="arrow">→</div><div class="num target">≥ 2.5</div>
        <div>G5 · Financial Integrity</div><div class="num now">{{GATE_5_AVG}}</div><div class="arrow">→</div><div class="num target">≥ 2.0</div>
      </div>
    </div>
    <div class="right">
      <div class="lbl">Multiple expansion path</div>
      <h3>Buyer pool widens. Multiple expands.</h3>
      <p>Structural correction expands eligibility from individual buyers absorbing extended founder transition to SBA-financed buyers and small-platform PE add-on acquirers.</p>
    </div>
  </div>

</main>
</section>

<!-- ═══════════════════════════════ METHODOLOGY ═══════════════════════════════ -->
<section class="page-section" data-page="methodology" id="page-methodology">
<main>

  <div class="page-hero">
    <div class="kicker">Methodology Reference <span class="dot">●</span> Five gates · four authorities</div>
    <h1>The framework, the authorities, and the rules behind the score.</h1>
    <p class="desc">The Northbridge Standard calibrates against the four diligence authorities that govern whether a founder-led acquisition closes. Each gate measures the structural condition that one authority scrutinizes most directly.</p>
  </div>

  <section style="margin-top:0">
    <div class="section-head-method"><div><div class="kicker">01 · Score scale</div><h2>Four behavioral anchors</h2></div><div class="right">Each criterion scores against four anchors that describe what is structurally present and what consequence the score carries in a diligence process.</div></div>
    <div class="anchor-grid">
      <article class="anchor s1"><span class="score">1</span><div class="name">Critical Fragility</div><p class="desc">Structural failure confirmed. The finding appears in the fragility map and correction roadmap without exception.</p><span class="consequence">Severe · Deal risk · Lender rejection</span></article>
      <article class="anchor s2"><span class="score">2</span><div class="name">Material Weakness</div><p class="desc">Deficiency is present and material. The condition is remediable within a defined program but consequential at transaction.</p><span class="consequence">Meaningful · Discount · Earnout · Pre-close</span></article>
      <article class="anchor s3"><span class="score">3</span><div class="name">Institutionally Acceptable</div><p class="desc">Structure is present and functional. The condition does not trigger discount under standard institutional review.</p><span class="consequence">Neutral · Mildly positive</span></article>
      <article class="anchor s4"><span class="score">4</span><div class="name">Premium Grade</div><p class="desc">Structure is documented, tested, and independently verifiable. The condition supports premium multiple and compresses diligence timeline.</p><span class="consequence">Additive · Premium multiple</span></article>
    </div>
  </section>

  <section>
    <div class="section-head-method"><div><div class="kicker">02 · Weighting</div><h2>Gate weights reflect transaction sensitivity</h2></div><div class="right">Authority and Revenue Quality carry 1.5× weight. Financial Integrity carries 1.25×. Process and Commercial carry 1.0× base. Maximum weighted score is 125.</div></div>
    <table class="weighting">
      <thead><tr><th>Gate</th><th>Rationale</th><th class="num">Weight</th><th class="num">Max</th></tr></thead>
      <tbody>
        <tr><td class="gate-col">G1 · Authority Architecture<small>SBA Lender Underwriter</small></td><td class="rationale">Highest buyer risk. Key-person concentration directly suppresses multiple and drives earnout requirement.</td><td class="weight">1.5×</td><td class="max">30</td></tr>
        <tr><td class="gate-col">G2 · Process Independence<small>Buyer Op. Diligence</small></td><td class="rationale">Base weight. Process fragility is material but more remediable than authority or revenue risk.</td><td class="weight">1.0×</td><td class="max">20</td></tr>
        <tr><td class="gate-col">G3 · Commercial Discipline<small>Buy-Side QoE</small></td><td class="rationale">Base weight. Pricing and margin weakness is significant but addressable within a defined remediation program.</td><td class="weight">1.0×</td><td class="max">20</td></tr>
        <tr><td class="gate-col">G4 · Revenue Quality &amp; Durability<small>M&amp;A Counsel</small></td><td class="rationale">Highest buyer risk. Revenue transferability is the most contested valuation category in founder-led transactions.</td><td class="weight">1.5×</td><td class="max">30</td></tr>
        <tr><td class="gate-col">G5 · Financial Integrity<small>Buy-Side QoE / SBA / Forensic</small></td><td class="rationale">Elevated weight. Financial evidence quality determines whether any valuation number is defensible under QoE scrutiny.</td><td class="weight">1.25×</td><td class="max">25</td></tr>
      </tbody>
    </table>
  </section>

  <section>
    <div class="section-head-method"><div><div class="kicker">03 · Classification</div><h2>Four bands across the 125-point scale</h2></div><div class="right">Bands describe the eligible buyer pool and the structural posture of the business. {{COMPANY_NAME}} scores at {{WEIGHTED_SCORE}}/125.</div></div>
    <div class="bands-grid">
      <article class="band-card {{ACTIVE_BAND_1}}"><div class="lbl">Band 1</div><div class="name">Founder-Dependent</div><div class="range">0 — 46</div><div class="desc">Structural fragility is substantial. Tier II is strongly indicated.</div><div class="tag">{{BAND_1_TAG}}</div></article>
      <article class="band-card {{ACTIVE_BAND_2}}"><div class="lbl">Band 2</div><div class="name">Transitional</div><div class="range">47 — 77</div><div class="desc">Some systems exist but buyer-readiness is incomplete.</div><div class="tag">{{BAND_2_TAG}}</div></article>
      <article class="band-card {{ACTIVE_BAND_3}}"><div class="lbl">Band 3</div><div class="name">Stabilized</div><div class="range">78 — 109</div><div class="desc">Structural base is credible. Tier III path potentially viable.</div><div class="tag">{{BAND_3_TAG}}</div></article>
      <article class="band-card {{ACTIVE_BAND_4}}"><div class="lbl">Band 4</div><div class="name">Transfer-Ready</div><div class="range">110 — 125</div><div class="desc">Defensible under third-party scrutiny across all five gates.</div><div class="tag">{{BAND_4_TAG}}</div></article>
    </div>
  </section>

  <section>
    <div class="section-head-method"><div><div class="kicker">04 · Overrides</div><h2>Rules that apply regardless of total score</h2></div><div class="right">Overrides protect against false-positive band assignment. A high cumulative score cannot mask a structural failure in a single critical condition.</div></div>
    <div class="overrides">
      <article class="override"><span class="n">01</span><h3>High-consequence Critical Fragility</h3><p>Any criterion scored 1 with a high or very-high transaction consequence caps the classification at Transitional or below — regardless of total weighted score.</p></article>
      <article class="override"><span class="n">02</span><h3>Gate average below 1.5</h3><p>Any gate averaging below 1.5 forces a Founder-Dependent classification, regardless of overall weighted score. The structural failure of a single gate carries the verdict.</p></article>
      <article class="override"><span class="n">03</span><h3>Gate 5 below 2.0 blocks Tier III</h3><p>Gate 5 — Financial Integrity — averaging below 2.0 blocks Tier III progression regardless of all other gate performance.</p></article>
    </div>
  </section>

  <section>
    <div class="section-head-method"><div><div class="kicker">07 · Vocabulary</div><h2>Glossary of terms</h2></div><div class="right">Terms used in this report follow institutional transaction-services usage.</div></div>
    <dl class="glossary">
      <div class="gl-item"><dt>Add-back</dt><dd>An adjustment that increases reported EBITDA to reflect a non-recurring, owner-related, or non-operating expense. Defensibility requires contemporaneous documentation.</dd></div>
      <div class="gl-item"><dt>Buy-Side QoE</dt><dd>Quality of Earnings analysis conducted by an accounting firm engaged by the buyer to verify the seller's adjusted EBITDA presentation before closing.</dd></div>
      <div class="gl-item"><dt>DSCR</dt><dd>Debt Service Coverage Ratio. Adjusted EBITDA divided by annual debt service. Lenders typically require DSCR above 1.25× for SBA-financed acquisitions.</dd></div>
      <div class="gl-item"><dt>EBITDA</dt><dd>Earnings Before Interest, Taxes, Depreciation, and Amortization. The standard measure of operating cash flow for businesses with separable owner compensation.</dd></div>
      <div class="gl-item"><dt>Earnout</dt><dd>Contingent purchase price paid to the seller post-close based on the business achieving specified performance milestones.</dd></div>
      <div class="gl-item"><dt>Key-Person Risk</dt><dd>The risk that the business cannot operate without the continued involvement of a specific individual, typically the founder.</dd></div>
      <div class="gl-item"><dt>Normalization</dt><dd>The process of adjusting reported financial results to reflect the cash flow available to a new owner.</dd></div>
      <div class="gl-item"><dt>SDE</dt><dd>Seller's Discretionary Earnings. EBITDA plus the owner's compensation and discretionary benefits.</dd></div>
      <div class="gl-item"><dt>Transferability</dt><dd>The structural property of a business that determines whether it can be acquired and operated successfully by a new owner.</dd></div>
    </dl>
  </section>

</main>
</section>

<script>
(function(){
  var SLUGS = ['index','gates','fragility','roadmap','methodology'];
  function show(slug){
    if (!SLUGS.includes(slug)) slug = 'index';
    document.querySelectorAll('.page-section').forEach(function(s){
      s.classList.toggle('active', s.dataset.page === slug);
    });
    document.querySelectorAll('.topnav a[data-page]').forEach(function(a){
      a.classList.toggle('active', a.dataset.page === slug);
    });
    try { window.scrollTo(0,0); } catch(_){}
    try { if (location.hash !== '#'+slug) location.hash = '#'+slug; } catch(_){}
  }
  window.showPage = show;
  document.querySelectorAll('[data-page]').forEach(function(el){
    el.addEventListener('click', function(e){
      var slug = el.getAttribute('data-page');
      if (slug) { e.preventDefault(); show(slug); }
    });
  });
  window.addEventListener('hashchange', function(){
    show((location.hash || '#index').slice(1));
  });
  show((location.hash || '#index').slice(1));

  // Animate score arc
  (function(){
    var arc = document.getElementById('arc-fill');
    if (!arc) return;
    var C = 2 * Math.PI * 42;
    var pct = {{SCORE_PCT_DECIMAL}};
    arc.setAttribute('stroke-dasharray', '0 ' + C);
    requestAnimationFrame(function(){
      arc.style.transition = 'stroke-dasharray 1100ms cubic-bezier(.22,.61,.36,1)';
      arc.setAttribute('stroke-dasharray', (C * pct).toFixed(2) + ' ' + C);
    });
  })();

  // Count up score number
  (function(){
    var el = document.getElementById('score-big');
    if (!el) return;
    var target = {{WEIGHTED_SCORE}};
    var dur = 1100; var start = performance.now();
    function tick(t){
      var p = Math.min(1,(t-start)/dur);
      var eased = 1 - Math.pow(1-p,3);
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  })();

  // Gate bar fills
  (function(){
    var gates = [
      { val: {{GATE_1_AVG}}, type: '{{GATE_1_BAR_TYPE}}' },
      { val: {{GATE_2_AVG}}, type: '{{GATE_2_BAR_TYPE}}' },
      { val: {{GATE_3_AVG}}, type: '{{GATE_3_BAR_TYPE}}' },
      { val: {{GATE_4_AVG}}, type: '{{GATE_4_BAR_TYPE}}' },
      { val: {{GATE_5_AVG}}, type: '{{GATE_5_BAR_TYPE}}' },
    ];
    var rows = document.querySelectorAll('.gate-matrix .gate-row');
    gates.forEach(function(g, i){
      var r = rows[i]; if (!r) return;
      var track = document.createElement('div');
      track.className = 'bar-track';
      var fill = document.createElement('div');
      fill.className = 'bar-fill' + (g.type === 'warn' ? ' warn' : '');
      fill.style.width = '0%';
      track.appendChild(fill);
      r.parentNode.insertBefore(track, r.nextSibling);
      setTimeout(function(){
        fill.style.transition = 'width 900ms cubic-bezier(.22,.61,.36,1)';
        fill.style.width = ((g.val / 4) * 100).toFixed(1) + '%';
      }, 200 + i * 80);
    });
  })();
})();
</script>

</body>
</html>`;

/**
 * Replace all {{VARIABLE}} placeholders in the template with actual values.
 */
export function injectTemplate(vars: Record<string, string | number>): string {
  let html = REPORT_TEMPLATE;
  for (const [key, value] of Object.entries(vars)) {
    const placeholder = `{{${key}}}`;
    html = html.split(placeholder).join(String(value));
  }
  return html;
}
