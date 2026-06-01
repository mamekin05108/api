/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Server, 
  Globe, 
  Database, 
  Code, 
  Terminal, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  ArrowRight, 
  Settings, 
  Layers, 
  Copy, 
  Check, 
  ArrowLeftRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  DRF_SERIALIZER_CODE, 
  DRF_VIEW_CODE, 
  DRF_URLS_CODE, 
  REACT_CODE 
} from './data/snippets';
import { ResponseCode, SimulationConfig, PayloadLog, CodeTab, InspectorTab } from './types';

// Mock response schemas as interactive presets
const RESPONSE_PRESETS: Record<ResponseCode, any> = {
  200: {
    status: "APPROVED",
    customer_details: {
      first_name: "太郎",
      last_name: "山田",
      ranking: "Gold VIP Member",
      registered_at: "2024-03-12"
    },
    store_context: {
      assigned_region: "関東第一地区",
      priority_code: "HIGH-01"
    },
    points_balance: 12850,
    last_transaction_id: "TX-9983192",
    timestamp: "2026-05-29T00:27:09Z"
  },
  404: {
    error_code: "CUSTOMER_NOT_FOUND",
    message: "指定された店舗コードおよび顧客番号に合致する会員データが見つかりません。",
    hint: "会員データの有効期限が切れているか、入力された番号が誤っている可能性があります。",
    timestamp: "2026-05-29T00:27:09Z"
  },
  500: {
    error_code: "INTERNAL_SYSTEM_FAULT",
    message: "外部の基幹データベースサーバー（Mainframe）との接続中にソケット通信エラーが発生しました。",
    details: "Failed to establish handshake with auth service downstream.",
    timestamp: "2026-05-29T00:27:09Z"
  }
};

export default function App() {
  // Transactions History items for High Density Sidebar
  const [transactions, setTransactions] = useState<Array<{
    id: string;
    method: 'POST';
    time: string;
    store: string;
    customer: string;
    status: 'success' | 'notFound' | 'error';
    presetCode: ResponseCode;
  }>>([
    { id: 'tx-1', method: 'POST', time: '10:42:15', store: '1001', customer: 'C-98765', status: 'success', presetCode: 200 },
    { id: 'tx-2', method: 'POST', time: '10:38:04', store: '8842', customer: 'Cust-99120', status: 'notFound', presetCode: 404 },
    { id: 'tx-3', method: 'POST', time: '10:35:12', store: '1105', customer: 'Cust-22100', status: 'error', presetCode: 500 },
  ]);

  // Load a transaction from sidebar history
  const loadTransaction = (tx: any) => {
    setIsCustomResponse(false);
    setConfig({
      shopId: tx.store,
      customerId: tx.customer,
      responseCode: tx.presetCode,
      customResponseText: JSON.stringify(RESPONSE_PRESETS[tx.presetCode], null, 2),
      networkLatency: 800
    });
    addLog(`履歴から店舗: ${tx.store}、顧客: ${tx.customer} をロードしました。`, 'info');
  };

  // Simulator configurations
  const [config, setConfig] = useState<SimulationConfig>({
    shopId: '1001',
    customerId: 'C-98765',
    responseCode: 200,
    customResponseText: JSON.stringify(RESPONSE_PRESETS[200], null, 2),
    networkLatency: 800
  });

  // State to custom response custom value vs preset select
  const [isCustomResponse, setIsCustomResponse] = useState(false);

  // Payload tracking logs
  const [log, setLog] = useState<PayloadLog>({
    reactRequest: null,
    drfRequest: null,
    externalResponse: null,
    finalResponse: null,
    status: 'idle'
  });

  // UI Tabs and active UI states
  const [activeCodeTab, setActiveCodeTab] = useState<CodeTab>('drf');
  const [activeCodeSubTab, setActiveCodeSubTab] = useState<'view' | 'serializer' | 'urls'>('view');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [visualStep, setVisualStep] = useState<number>(0);
  const [logsList, setLogsList] = useState<Array<{ time: string; text: string; type: 'info' | 'success' | 'warn' | 'err' }>>([]);

  // Handle preset switching
  const handlePresetChange = (code: ResponseCode) => {
    setConfig(prev => ({
      ...prev,
      responseCode: code,
      customResponseText: JSON.stringify(RESPONSE_PRESETS[code], null, 2)
    }));
  };

  // Log message helper
  const addLog = (text: string, type: 'info' | 'success' | 'warn' | 'err' = 'info') => {
    const time = new Date().toLocaleTimeString('ja-JP', { hour12: false });
    setLogsList(prev => [{ time, text, type }, ...prev]);
  };

  // Trigger copy to clipboard
  const handleCopy = (codeText: string, label: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedText(label);
    setTimeout(() => {
      setCopiedText(null);
    }, 2000);
  };

  // Simulated transmission process
  const triggerSimulation = async () => {
    if (!config.shopId.trim() || !config.customerId.trim()) {
      addLog('エラー: 店番または顧客番号を入力してください。', 'err');
      return;
    }

    setLog({
      reactRequest: null,
      drfRequest: null,
      externalResponse: null,
      finalResponse: null,
      status: 'sending'
    });
    setLogsList([]);
    setVisualStep(1);
    
    // Step 1: React sets JSON payload
    const reactPayload = {
      shop_id: config.shopId,
      customer_id: config.customerId
    };
    addLog('【React 画面】リクエストJSONを作成しました。', 'info');
    addLog(`送信データ: ${JSON.stringify(reactPayload)}`, 'info');
    
    await new Promise(r => setTimeout(r, 600));
    setVisualStep(2);
    setLog(prev => ({ ...prev, reactRequest: reactPayload, status: 'drf_processing' }));
    addLog('【Django REST Framework】リクエストを受信。バリデーション（CustomerQuerySerializer）を開始...', 'info');

    await new Promise(r => setTimeout(r, 800));
    setVisualStep(3);
    
    // Step 2: Django transforms keys for external API backend
    const drfPayload = {
      store_code: config.shopId,
      customer_number: config.customerId,
      source_system: 'DRF-Proxy-Gateway',
      requested_at: new Date().toISOString()
    };
    setLog(prev => ({ ...prev, drfRequest: drfPayload, status: 'external_calling' }));
    addLog('【Django REST Framework】バリデーション完了。外部サーバー用JSONを作成しました。', 'success');
    addLog(`送信データ (DRF -> 外部API): ${JSON.stringify(drfPayload)}`, 'info');
    addLog('【Django REST Framework】requests.post()を実行中。外部サーバーへ接続しています...', 'warn');

    // Network latency delay
    await new Promise(r => setTimeout(r, config.networkLatency));
    setVisualStep(4);

    // Get external response based on preset or custom text
    let rawResponse: any;
    try {
      rawResponse = JSON.parse(config.customResponseText);
    } catch (e) {
      rawResponse = { error: "JSONパースエラー", raw: config.customResponseText };
    }

    setLog(prev => ({ ...prev, externalResponse: rawResponse }));
    addLog(`【外部サーバー】リクエストを受信しました。HTTPステータス: ${config.responseCode}`, config.responseCode === 200 ? 'success' : 'err');
    addLog('【外部サーバー】レスポンスJSONを返却しました。', 'info');

    await new Promise(r => setTimeout(r, 700));
    setVisualStep(5);

    // Step 3: DRF formats final response and replies to React client
    const finalReply = {
      message: config.responseCode === 200 ? "外部連携が完了しました" : "外部サーバーとの連携でエラーが発生しました",
      status_code: config.responseCode,
      external_data: rawResponse
    };

    setLog(prev => ({ 
      ...prev, 
      finalResponse: finalReply, 
      status: config.responseCode === 200 ? 'done' : 'error' 
    }));
    
    if (config.responseCode === 200) {
      addLog('【Django REST Framework】レスポンスを受信。DjangoからReact画面へデータを返却しました。', 'success');
      addLog('【React 画面】通信成功！受信したJSONを画面にバインドしました。', 'success');
    } else {
      addLog(`【Django REST Framework】外部通信エラーを検知（HTTP ${config.responseCode}）。クライアント向けのエラーJSONを生成しました。`, 'err');
      addLog('【React 画面】通信エラーをハンドリングし、エラー内容を画面に描画しました。', 'err');
    }

    // Append to transactions history list
    const transactionTime = new Date().toLocaleTimeString('ja-JP', { hour12: false });
    const transactionStatus = config.responseCode === 200 ? 'success' : config.responseCode === 404 ? 'notFound' : 'error';
    setTransactions(prev => [
      {
        id: `tx-${Date.now()}`,
        method: 'POST',
        time: transactionTime,
        store: config.shopId,
        customer: config.customerId,
        status: transactionStatus,
        presetCode: config.responseCode
      },
      ...prev
    ]);
  };

  // Initialize custom text with default preset on mounting
  useEffect(() => {
    addLog('シミュレーターの準備が完了しました。店番と顧客番号を入力し、送信をお試しください。', 'info');
  }, []);

  return (
    <div className="min-h-screen bg-[#f8f9fa] font-sans text-[#1a1a1a] flex flex-col antialiased">
      
      {/* High Density Top Navigation Bar */}
      <header className="h-14 bg-[#1e293b] text-white flex items-center px-6 justify-between shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-1.5 rounded">
            <ArrowLeftRight className="w-4 h-4 text-white" />
          </div>
          <h1 className="font-bold text-sm md:text-base tracking-tight flex items-center gap-2">
            <span>DRF API Gateway Proxy</span>
            <span className="text-blue-400 font-mono text-[10px] uppercase bg-slate-800 px-1.5 py-0.5 rounded tracking-widest font-bold">
              v2.4.1-stable
            </span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <span className="text-[10px] md:text-xs font-mono uppercase text-slate-300">Django Backend: Active</span>
          </div>
          <button 
            type="button"
            onClick={() => addLog('システムステータス: 稼働中 (HTTP/1.1 CORS許可済み、DRF中継エンドポイント活性)', 'info')}
            className="hidden sm:block bg-slate-700 hover:bg-slate-600 px-2.5 py-1 rounded text-[10px] font-semibold border border-slate-600 font-mono transition-colors text-slate-200"
          >
            SYS STATUS
          </button>
        </div>
      </header>

      {/* Main Full-Width Split Work Area */}
      <div className="grow flex flex-col lg:flex-row overflow-hidden">
        
        {/* Sidebar: Request History list */}
        <aside className="w-full lg:w-64 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col shrink-0">
          <div className="p-3 bg-slate-50 border-b border-slate-250 flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-1.5 font-mono">
              <Terminal className="w-3.5 h-3.5 text-slate-500" />
              Recent Transactions
            </span>
            <span className="text-[9px] font-mono text-slate-400">Total: {transactions.length}</span>
          </div>
          <div className="p-3 flex flex-col gap-2 overflow-y-auto max-h-[180px] lg:max-h-[calc(100vh-140px)]">
            {transactions.map((tx) => (
              <div 
                key={tx.id}
                onClick={() => loadTransaction(tx)}
                className={`p-2.5 rounded border text-left cursor-pointer transition-all hover:bg-slate-50 relative group ${
                  tx.status === 'success' ? 'bg-emerald-50/45 border-l-4 border-l-emerald-500 border-slate-200' :
                  tx.status === 'notFound' ? 'bg-amber-50/45 border-l-4 border-l-amber-500 border-slate-200' :
                  'bg-rose-50/45 border-l-4 border-l-rose-500 border-slate-200'
                }`}
              >
                <div className="flex justify-between items-center text-[10px] mb-1">
                  <span className={`font-mono font-bold ${
                    tx.status === 'success' ? 'text-emerald-700' :
                    tx.status === 'notFound' ? 'text-amber-700' : 'text-rose-700'
                  }`}>
                    {tx.method} ({tx.presetCode})
                  </span>
                  <span className="text-slate-400 text-[9px] italic">{tx.time}</span>
                </div>
                <div className="text-xs font-semibold text-slate-700 font-mono truncate">
                  Store: {tx.store} &bull; Cust: {tx.customer}
                </div>
                <div className="absolute right-2 bottom-1 text-[8px] text-blue-600 opacity-0 group-hover:opacity-100 font-bold transition-opacity">
                  クリックで適用
                </div>
              </div>
            ))}
          </div>
          <div className="p-3.5 mt-auto border-t border-slate-200 text-[10px] text-slate-450 font-mono hidden lg:block bg-slate-50 select-text">
            <div className="truncate text-slate-400">ENDPOINT: https://ext-svc.internal/v1</div>
            <div className="text-[9px] mt-1 text-slate-400 font-sans">Method: POST only (Secure)</div>
          </div>
        </aside>

        {/* Content Area Container (Split into Center & Right) */}
        <div className="grow overflow-hidden flex flex-col lg:overflow-y-auto">

          {/* Main Workspace Frame */}
          <main className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl w-full mx-auto">
        
        {/* Left Interactive Playground Frame (7 columns) */}
        <section className="lg:col-span-7 flex flex-col gap-6" id="simulator-section">
          
          {/* Interactive Form */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" id="form-card">
            <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-slate-800 text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                1. ユーザー入力 & 動作オプション
              </div>
              <span className="text-xs text-slate-400 font-mono">React Screen Form</span>
            </div>

            <div className="p-5 flex flex-col gap-5">
              
              {/* React inputs row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5 font-sans">
                    店番 (shop_id) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input 
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:bg-white transition-all shadow-xs"
                      value={config.shopId}
                      onChange={(e) => setConfig(prev => ({ ...prev, shopId: e.target.value }))}
                      placeholder="例: 1001"
                      maxLength={10}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5 font-sans">
                    顧客番号 (customer_id) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input 
                      type="text"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 focus:bg-white transition-all shadow-xs"
                      value={config.customerId}
                      onChange={(e) => setConfig(prev => ({ ...prev, customerId: e.target.value }))}
                      placeholder="例: C-98765"
                      maxLength={20}
                    />
                  </div>
                </div>
              </div>

              {/* Simulation Options */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-150">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Settings className="w-3.5 h-3.5 text-slate-500" />
                    シミュレート設定 (外部サーバー応答)
                  </h3>
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Info className="w-3 h-3" />
                    モックの動作テスト用
                  </div>
                </div>

                {/* Switch HTTP Code or Custom Response */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">HTTPレスポンス状況</label>
                    <div className="flex gap-1.5 bg-white p-1 rounded-lg border border-slate-200">
                      {( [200, 404, 500] as ResponseCode[] ).map((code) => (
                        <button
                          key={code}
                          type="button"
                          onClick={() => {
                            setIsCustomResponse(false);
                            handlePresetChange(code);
                          }}
                          className={`flex-1 text-center py-1 rounded-md text-xs font-mono font-medium transition-all ${
                            !isCustomResponse && config.responseCode === code
                              ? code === 200
                                ? 'bg-emerald-500 text-white shadow-xs'
                                : code === 404
                                ? 'bg-amber-500 text-white shadow-xs'
                                : 'bg-rose-500 text-white shadow-xs'
                              : 'text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          {code}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      ネットワーク遅延 (レイテンシ)
                    </label>
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
                      <input 
                        type="range" 
                        min="200" 
                        max="3000" 
                        step="100"
                        value={config.networkLatency}
                        onChange={(e) => setConfig(prev => ({ ...prev, networkLatency: parseInt(e.target.value) }))}
                        className="w-full h-1.5 bg-slate-200 rounded-lg appearance-auto cursor-pointer accent-sky-600"
                      />
                      <span className="font-mono text-slate-600 whitespace-nowrap">{config.networkLatency}ms</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] text-slate-400">
                      外部サーバー返却値 (JSON)
                    </label>
                    <button 
                      type="button"
                      onClick={() => {
                        const nextState = !isCustomResponse;
                        setIsCustomResponse(nextState);
                        if (!nextState) {
                          // Restores preset
                          handlePresetChange(config.responseCode);
                        }
                      }}
                      className="text-[10px] text-sky-600 hover:underline font-medium"
                    >
                      {isCustomResponse ? 'プリセットを復元' : 'JSONを直接編集する'}
                    </button>
                  </div>
                  <textarea
                    className="w-full bg-slate-900 text-emerald-400 font-mono text-xs p-3 rounded-lg h-32 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 border border-slate-800 shadow-inner"
                    value={config.customResponseText}
                    onChange={(e) => {
                      setIsCustomResponse(true);
                      setConfig(prev => ({ ...prev, customResponseText: e.target.value }));
                    }}
                    placeholder="JSONを入力してください..."
                  />
                </div>
              </div>

              {/* Action trigger button */}
              <button
                type="button"
                onClick={triggerSimulation}
                disabled={log.status === 'sending' || log.status === 'drf_processing' || log.status === 'external_calling'}
                className="w-full relative overflow-hidden bg-gradient-to-r from-sky-600 to-indigo-600 hover:tracking-wide disabled:from-slate-400 disabled:to-slate-500 text-white font-medium py-3 px-4 rounded-xl shadow-md cursor-pointer hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 focus:outline-hidden focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
              >
                {['sending', 'drf_processing', 'external_calling'].includes(log.status) ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>通信処理中 (ステップ {visualStep}/5)...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Django経由で送信テストを実行する</span>
                  </>
                )}
              </button>

            </div>
          </div>

          {/* Interactive Flow Visualizer Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden grow" id="flow-card">
            <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-slate-800 text-sm">
                <Layers className="w-4 h-4 text-indigo-500" />
                2. リアルタイム・アーキテクチャフロー
              </div>
              <span className="text-xs text-slate-400 font-mono">Live Execution Pipeline</span>
            </div>

            <div className="p-6 flex flex-col justify-between grow gap-6 min-h-[340px]">
              
              {/* Nodes and Pipes Map */}
              <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-8 md:gap-4 mt-4 mb-2">
                
                {/* Visual Connection line bg for desktop */}
                <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-slate-100 -translate-y-1/2 z-0"></div>

                {/* Node 1: React UI Client */}
                <div className="relative z-10 flex flex-col items-center flex-1 bg-white">
                  <motion.div 
                    animate={{ 
                      scale: visualStep === 1 ? 1.08 : 1,
                      borderColor: visualStep === 1 ? '#0284c7' : '#e2e8f0',
                      boxShadow: visualStep === 1 ? '0 10px 15px -3px rgba(14, 165, 233, 0.15)' : '0 1px 2px 0 rgba(0,0,0,0.05)'
                    }}
                    transition={{ duration: 0.3 }}
                    className="w-16 h-16 rounded-2xl border-2 flex items-center justify-center bg-slate-50 text-sky-600 select-none cursor-default"
                  >
                    <Code className="w-8 h-8" />
                  </motion.div>
                  <div className="text-xs font-bold text-slate-800 mt-2 text-center">React Frontend</div>
                  <div className="text-[10px] text-slate-400 text-center uppercase tracking-wide font-mono mt-0.5">画面クライアント</div>
                  
                  {/* Status Indicator pill */}
                  <div className="mt-2">
                    {visualStep === 1 ? (
                      <span className="bg-sky-50 text-sky-700 text-[9px] font-semibold px-2 py-0.5 rounded-full border border-sky-100 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-ping"></span>
                        JSON作成・送信
                      </span>
                    ) : visualStep > 1 ? (
                      <span className="bg-emerald-50 text-emerald-700 text-[9px] font-semibold px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                        <Check className="w-2.5 h-2.5" />
                        送信完了
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-500 text-[9px] font-semibold px-2 py-0.5 rounded-full border border-slate-200">
                        待機中
                      </span>
                    )}
                  </div>
                </div>

                {/* Connector Path React->DRF */}
                <div className="hidden md:flex flex-col items-center justify-center shrink-0 w-8 z-10">
                  <ArrowRight className={`w-5 h-5 transition-colors ${visualStep === 1 ? 'text-sky-500 animate-pulse' : visualStep > 1 ? 'text-emerald-500' : 'text-slate-300'}`} />
                </div>

                {/* Node 2: Django REST Framework API Proxy Router */}
                <div className="relative z-10 flex flex-col items-center flex-2">
                  <motion.div 
                    animate={{ 
                      scale: [2, 3].includes(visualStep) || visualStep === 5 ? 1.08 : 1,
                      borderColor: [2, 3].includes(visualStep) ? '#4f46e5' : visualStep === 5 ? '#10b981' : '#e2e8f0',
                      boxShadow: [2, 3].includes(visualStep) ? '0 10px 15px -3px rgba(79, 70, 229, 0.15)' : '0 1px 2px 0 rgba(0,0,0,0.05)'
                    }}
                    transition={{ duration: 0.3 }}
                    className="w-16 h-16 rounded-2xl border-2 flex items-center justify-center bg-indigo-50/20 text-indigo-600 select-none cursor-default"
                  >
                    <Server className="w-8 h-8" />
                  </motion.div>
                  <div className="text-xs font-bold text-indigo-900 mt-2 text-center flex items-center gap-1">
                    Django REST Framework
                  </div>
                  <div className="text-[10px] text-indigo-500 uppercase tracking-wide font-mono mt-0.5">安全プロキシ・自社中継</div>

                  {/* Django active status */}
                  <div className="mt-2">
                    {visualStep === 2 ? (
                      <span className="bg-indigo-50 text-indigo-700 text-[9px] font-semibold px-2 py-0.5 rounded-full border border-indigo-150 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-spin border border-t-white duration-1000"></span>
                        データ検証中
                      </span>
                    ) : visualStep === 3 ? (
                      <span className="bg-purple-50 text-purple-700 text-[9px] font-semibold px-2 py-0.5 rounded-full border border-purple-150 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce"></span>
                        外部へPOST開始
                      </span>
                    ) : visualStep === 5 ? (
                      <span className="bg-emerald-50 text-emerald-700 text-[9px] font-semibold px-2 py-0.5 rounded-full border border-emerald-150 flex items-center gap-1">
                        <Check className="w-2.5 h-2.5" />
                        受信＆Reactへ
                      </span>
                    ) : visualStep > 3 ? (
                      <span className="bg-emerald-50 text-emerald-700 text-[9px] font-semibold px-2 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1">
                        検証通過
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-400 text-[9px] font-semibold px-2 py-0.5 rounded-full border border-slate-200">
                        待機中
                      </span>
                    )}
                  </div>
                </div>

                {/* Connector Path DRF->External */}
                <div className="hidden md:flex flex-col items-center justify-center shrink-0 w-8 z-10">
                  <ArrowRight className={`w-5 h-5 transition-colors ${visualStep === 3 ? 'text-indigo-500 animate-pulse' : visualStep > 3 ? 'text-emerald-500' : 'text-slate-300'}`} />
                </div>

                {/* Node 3: External Web Service Endpoint */}
                <div className="relative z-10 flex flex-col items-center flex-1 bg-white">
                  <motion.div 
                    animate={{ 
                      scale: visualStep === 4 ? 1.08 : 1,
                      borderColor: visualStep === 4 ? '#d97706' : '#e2e8f0',
                      boxShadow: visualStep === 4 ? '0 10px 15px -3px rgba(217, 119, 6, 0.15)' : '0 1px 2px 0 rgba(0,0,0,0.05)'
                    }}
                    transition={{ duration: 0.3 }}
                    className="w-16 h-16 rounded-2xl border-2 flex items-center justify-center bg-slate-50 text-amber-600 select-none cursor-default"
                  >
                    <Globe className="w-8 h-8" />
                  </motion.div>
                  <div className="text-xs font-bold text-slate-800 mt-2 text-center">External API</div>
                  <div className="text-[10px] text-slate-400 text-center uppercase tracking-wide font-mono mt-0.5">外部会員システム</div>

                  {/* Target Server status */}
                  <div className="mt-2">
                    {visualStep === 4 ? (
                      <span className="bg-amber-50 text-amber-700 text-[9px] font-semibold px-2 py-0.5 rounded-full border border-amber-100 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
                        リクエスト処理
                      </span>
                    ) : visualStep > 4 ? (
                      <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full border ${
                        config.responseCode === 200 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                          : 'bg-rose-50 text-rose-700 border-rose-100'
                      }`}>
                        HTTP {config.responseCode}
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-400 text-[9px] font-semibold px-2 py-0.5 rounded-full border border-slate-200">
                        待機中
                      </span>
                    )}
                  </div>
                </div>

              </div>

              {/* Progress Detail Log Monitor */}
              <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 font-mono text-xs text-slate-300 grow shadow-inner flex flex-col gap-2 min-h-[140px] max-h-[160px] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1.5 shrink-0">
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 tracking-wider uppercase font-bold">
                    <Terminal className="w-3.5 h-3.5 text-sky-400" />
                    リアルタイム処理ログ
                  </div>
                  <span className="text-[9px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 transition-all font-sans">
                    {['idle'].includes(log.status) ? 'STANDBY' : 'PROCESSING'}
                  </span>
                </div>
                
                <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto pr-1">
                  <AnimatePresence initial={false}>
                    {logsList.map((l, index) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }} 
                        animate={{ opacity: 1, x: 0 }}
                        key={index} 
                        className="flex items-start gap-2 text-[11px] leading-relaxed select-text"
                      >
                        <span className="text-slate-600 block shrink-0">{l.time}</span>
                        <span className={
                          l.type === 'success' ? 'text-emerald-400 font-semibold' :
                          l.type === 'warn' ? 'text-amber-400' :
                          l.type === 'err' ? 'text-rose-400 font-semibold' : 'text-slate-300'
                        }>
                          {l.text}
                        </span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>

            </div>
          </div>

        </section>

        {/* Right Data Payload & Code References (5 columns) */}
        <section className="lg:col-span-12 xl:col-span-5 flex flex-col gap-6" id="reference-section">
          
          {/* Section Selector Tab panel */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col grow">
            
            {/* Nav Tabs */}
            <div className="flex bg-slate-50 border-b border-slate-200 shrink-0">
              <button
                type="button"
                onClick={() => setActiveCodeTab('drf')}
                className={`flex-1 py-3.5 px-4 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${
                  activeCodeTab === 'drf' 
                    ? 'border-indigo-600 text-indigo-600 bg-white' 
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                }`}
              >
                <div className="w-5 h-5 bg-indigo-50 rounded-md flex items-center justify-center font-mono font-bold text-[10px] text-indigo-600">Py</div>
                <span>Python DRF側実装</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveCodeTab('react')}
                className={`flex-1 py-3.5 px-4 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-all ${
                  activeCodeTab === 'react' 
                    ? 'border-sky-600 text-sky-600 bg-white' 
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                }`}
              >
                <div className="w-5 h-5 bg-sky-50 rounded-md flex items-center justify-center font-mono font-bold text-[10px] text-sky-600">Js</div>
                <span>React 画面側実装</span>
              </button>
            </div>

            {/* Custom dynamic codes rendering or live response inspector */}
            <div className="p-5 flex flex-col grow select-none bg-white">
              <AnimatePresence mode="wait">
                
                {/* PYTHON DJANGO REST FRAMEWORK REFERENCE */}
                {activeCodeTab === 'drf' && (
                  <motion.div
                    key="drf-section"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="flex flex-col grow gap-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-[11px] font-sans font-medium">
                        <button
                          type="button"
                          onClick={() => setActiveCodeSubTab('view')}
                          className={`px-3 py-1 rounded-md transition-all ${activeCodeSubTab === 'view' ? 'bg-white shadow-xs text-indigo-700 font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                          views.py (API本体)
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveCodeSubTab('serializer')}
                          className={`px-3 py-1 rounded-md transition-all ${activeCodeSubTab === 'serializer' ? 'bg-white shadow-xs text-indigo-700 font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                          serializers.py
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveCodeSubTab('urls')}
                          className={`px-3 py-1 rounded-md transition-all ${activeCodeSubTab === 'urls' ? 'bg-white shadow-xs text-indigo-700 font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
                        >
                          urls.py
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const codeMap = {
                            view: DRF_VIEW_CODE,
                            serializer: DRF_SERIALIZER_CODE,
                            urls: DRF_URLS_CODE
                          };
                          handleCopy(codeMap[activeCodeSubTab], activeCodeSubTab);
                        }}
                        className="text-[11px] flex items-center gap-1 text-slate-500 hover:text-slate-800 border border-slate-200 hover:bg-slate-50 py-1.5 px-2.5 rounded-lg font-medium transition-all"
                      >
                        {copiedText === activeCodeSubTab ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600">コピー完了!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>コードをコピー</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="grow flex flex-col">
                      <div className="bg-slate-900 rounded-xl p-3 border border-slate-850 font-mono text-sm overflow-x-auto text-emerald-400 max-h-[460px] select-text">
                        <pre className="text-[11px] md:text-xs leading-relaxed">
                          {activeCodeSubTab === 'view' && DRF_VIEW_CODE}
                          {activeCodeSubTab === 'serializer' && DRF_SERIALIZER_CODE}
                          {activeCodeSubTab === 'urls' && DRF_URLS_CODE}
                        </pre>
                      </div>
                      <div className="mt-3 bg-indigo-50/50 border border-indigo-100 p-3 rounded-xl flex items-start gap-2 text-xs text-indigo-950">
                        <Info className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold mb-0.5">Django側の処理のポイント:</p>
                          <ul className="list-disc pl-4 space-y-1 text-slate-600 leading-relaxed font-sans mt-1">
                            <li><strong>Serializer</strong>で入力内容に対する安全なバリデーションを実施します (空欄チェックや安全な文字判定)。</li>
                            <li>Pythonの <strong>requests</strong> ライブラリを使い、安全なバックエンドから外部HTTP POSTを行います（シークレットキーをブラウザに公開せず、安全なバックエンド環境（サーバーサイド）で通信を行います）。</li>
                            <li><strong>タイムアウト・接続エラー・例外処理</strong>を完璧に実装することで、外部サーバーが予期せず停止していても、自社のDjangoサーバーまでクラッシュすることを防ぎます。</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* REACT FRONTEND VIEW */}
                {activeCodeTab === 'react' && (
                  <motion.div
                    key="react-section"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="flex flex-col grow gap-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500 font-semibold font-mono">React Component Example</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(REACT_CODE, 'react-code')}
                        className="text-[11px] flex items-center gap-1 text-slate-500 hover:text-slate-800 border border-slate-200 hover:bg-slate-50 py-1.5 px-2.5 rounded-lg font-medium transition-all"
                      >
                        {copiedText === 'react-code' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600">コピー完了!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>コードをコピー</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="grow flex flex-col">
                      <div className="bg-slate-900 rounded-xl p-3 border border-slate-850 font-mono text-sm overflow-x-auto text-sky-400 max-h-[460px] select-text">
                        <pre className="text-[11px] md:text-xs leading-relaxed">{REACT_CODE}</pre>
                      </div>
                      <div className="mt-3 bg-sky-50/50 border border-sky-100 p-3 rounded-xl flex items-start gap-2 text-xs text-sky-950">
                        <Info className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold mb-0.5">React側の処理のポイント:</p>
                          <ul className="list-disc pl-4 space-y-1 text-slate-600 leading-relaxed font-sans mt-1">
                            <li>ユーザーが<strong>店番</strong>と<strong>顧客番号</strong>を入力すると、入力内容をReactのStateに即時連動させます。</li>
                            <li>送信ボタンのクリックイベントから `fetch()` APIを用いて、<strong>Django REST FrameworkのプロキシAPI (例 `/api/external/customer-lookup/`)</strong> へPOSTリクエストを発火させます。</li>
                            <li>送信中は `loading` フラグを真にしてローディング表示を行い、二重送信を防ぎます。レスポンスJSON受信後に、データを画面に表示させます。</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </div>

          {/* Dynamic Payload Inspector Panel */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" id="payload-inspector-card">
            <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-slate-800 text-sm">
                <Database className="w-4 h-4 text-emerald-500" />
                3. 行き来するJSONデータの変化インスペクタ
              </div>
              <span className="text-xs text-slate-400 font-mono">Payload Schema Checker</span>
            </div>

            <div className="p-5 flex flex-col gap-4">
              
              {/* React -> DRF Request Data */}
              <div className="rounded-xl border border-slate-100 p-3 bg-slate-50">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                    <span className="w-2.5 h-2.5 text-sky-600 font-bold text-[10px] leading-none">A</span>
                    【React画面】 → 【Django REST Framework】
                  </span>
                  <span className="px-1.5 py-0.5 text-[9px] font-mono bg-sky-50 border border-sky-100 text-sky-700 rounded-md font-semibold">
                    POST Payload
                  </span>
                </div>
                <div className="bg-white rounded-lg p-2.5 font-mono text-[11px] text-slate-700 border border-slate-200 select-text overflow-x-auto min-h-[50px] flex items-center">
                  {log.reactRequest ? (
                    <pre className="leading-snug">{JSON.stringify(log.reactRequest, null, 2)}</pre>
                  ) : (
                    <span className="text-slate-400 italic">フォーム送信時に、店番と顧客番号を含むJSONキーが生成されてここにセットされます。</span>
                  )}
                </div>
              </div>

              {/* DRF -> External Server Request Data */}
              <div className="rounded-xl border border-slate-100 p-3 bg-slate-50">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                    <span className="w-2.5 h-2.5 text-indigo-600 font-bold text-[10px] leading-none">B</span>
                    【Django REST Framework】 → 【外部サーバー】
                  </span>
                  <span className="px-1.5 py-0.5 text-[9px] font-mono bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-md font-semibold">
                    Transformed POST (requests.post)
                  </span>
                </div>
                <div className="bg-white rounded-lg p-2.5 font-mono text-[11px] text-slate-700 border border-slate-200 select-text overflow-x-auto min-h-[50px] flex items-center">
                  {log.drfRequest ? (
                    <pre className="leading-snug">{JSON.stringify(log.drfRequest, null, 2)}</pre>
                  ) : (
                    <span className="text-slate-400 italic">Django側でバリデーションを通過した後、外部APIのフォーマットに合わせて整形された安全なJSON。</span>
                  )}
                </div>
              </div>

              {/* External Server -> DRF -> React Final Response */}
              <div className="rounded-xl border border-slate-100 p-3 bg-slate-50">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                    <span className="w-2.5 h-2.5 text-emerald-600 font-bold text-[10px] leading-none">C</span>
                    【Django REST Framework】 → 【React画面レスポンス】
                  </span>
                  <span className={`px-1.5 py-0.5 text-[9px] font-mono rounded-md font-semibold ${
                    !log.finalResponse ? 'bg-slate-100 text-slate-500' :
                    config.responseCode === 200 ? 'bg-emerald-50 border border-emerald-100 text-emerald-700' : 'bg-rose-50 border border-rose-100 text-rose-700'
                  }`}>
                    {log.finalResponse ? `Received HTTP ${config.responseCode}` : 'HTTP Final Response'}
                  </span>
                </div>
                <div className={`rounded-lg p-3 font-mono text-[11px] select-text overflow-x-auto min-h-[140px] flex items-center border ${
                  log.status === 'done' ? 'bg-emerald-950/5 text-emerald-900 border-emerald-200/50' :
                  log.status === 'error' ? 'bg-rose-950/5 text-rose-900 border-rose-200/50' :
                  'bg-white text-slate-700 border-slate-200'
                }`}>
                  {log.finalResponse ? (
                    <pre className="leading-snug w-full">{JSON.stringify(log.finalResponse, null, 2)}</pre>
                  ) : (
                    <span className="text-slate-400 italic">外部から送り返された生のデータを、Django経由で画面に受信・レンダリングした結果がここに表示されます。</span>
                  )}
                </div>
              </div>

            </div>
          </div>

        </section>

      </main>
          
        </div>
      </div>

      {/* High Density Footer with active server metadata */}
      <footer className="h-8 bg-slate-100 border-t border-slate-200 px-6 flex items-center justify-between shrink-0 text-[10px] text-slate-500 font-medium select-none">
        <div>
          Connected Gateway Target: <span className="font-mono text-slate-600">external-api-prod-01.local:8080</span>
        </div>
        <div className="flex items-center gap-4 font-mono text-slate-400">
          <span>MEM: 142MB</span>
          <span>CPU: 1.2%</span>
          <span className="text-blue-600 font-extrabold uppercase tracking-widest">READY</span>
        </div>
      </footer>
    </div>
  );
}
