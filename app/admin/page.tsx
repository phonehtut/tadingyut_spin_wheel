'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  adminLogin,
  adminLogout,
  verifyAdmin,
  getAllPrizes,
  updatePrize,
  addPrize,
  deletePrize,
  getSpinLogs,
  markRedeemed,
} from '@/app/actions/admin';
import {
  Gift,
  History,
  LogOut,
  Plus,
  Search,
  CheckCircle2,
  Trash2,
  Edit2,
  Lock,
  Save,
  X,
  Sparkles,
} from 'lucide-react';

interface Prize {
  id: number;
  name: string;
  totalQty: number;
  remainingQty: number;
  weight: number;
  color: string;
  isWinning: boolean;
}

interface SpinLogEntry {
  id: number;
  macAddress: string;
  ipAddress: string;
  prizeId: number;
  redeemCode: string;
  isRedeemed: boolean;
  createdAt: Date | null;
  prizeName: string | null;
}

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(true);

  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [logs, setLogs] = useState<SpinLogEntry[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'prizes' | 'logs'>('prizes');

  // New prize form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPrize, setNewPrize] = useState({
    name: '',
    totalQty: 10,
    remainingQty: 10,
    weight: 10,
    color: '#FFD700',
    isWinning: true,
  });

  // Editing
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState<Partial<Prize>>({});

  const loadData = useCallback(async () => {
    try {
      const [prizeData, logData] = await Promise.all([
        getAllPrizes(),
        getSpinLogs(search || undefined),
      ]);
      setPrizes(prizeData);
      setLogs(logData as SpinLogEntry[]);
    } catch {
      // Likely unauthorized
    }
  }, [search]);

  // Check auth on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const isAdmin = await verifyAdmin();
        setIsLoggedIn(isAdmin);
        if (isAdmin) {
          await loadData();
        }
      } catch {
        setIsLoggedIn(false);
      }
      setLoading(false);
    }
    checkAuth();
  }, [loadData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const success = await adminLogin(password);
    if (success) {
      setIsLoggedIn(true);
      setPassword('');
      await loadData();
    } else {
      setLoginError('လျှို့ဝှက်နံပါတ် မှားယွင်းနေပါသည် (Incorrect password)');
    }
  };

  const handleLogout = async () => {
    await adminLogout();
    setIsLoggedIn(false);
  };

  const handleSearch = async () => {
    const logData = await getSpinLogs(search || undefined);
    setLogs(logData as SpinLogEntry[]);
  };

  const handleMarkRedeemed = async (logId: number) => {
    const updated = await markRedeemed(logId);
    setLogs(updated as SpinLogEntry[]);
  };

  const handleAddPrize = async () => {
    if (!newPrize.name.trim()) return;
    await addPrize(newPrize);
    setNewPrize({
      name: '',
      totalQty: 10,
      remainingQty: 10,
      weight: 10,
      color: '#FFD700',
      isWinning: true,
    });
    setShowAddForm(false);
    await loadData();
  };

  const handleSaveEdit = async (id: number) => {
    await updatePrize(id, editData);
    setEditingId(null);
    setEditData({});
    await loadData();
  };

  const handleDeletePrize = async (id: number) => {
    if (confirm('ဤဆုမဲကို ဖျက်ရန် သေချာပါသလား? (Delete this prize?)')) {
      await deletePrize(id);
      await loadData();
    }
  };

  const startEditing = (prize: Prize) => {
    setEditingId(prize.id);
    setEditData({
      name: prize.name,
      totalQty: prize.totalQty,
      remainingQty: prize.remainingQty,
      weight: prize.weight,
      color: prize.color,
      isWinning: prize.isWinning,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#110804] flex items-center justify-center">
        <div className="text-yellow-400 flex items-center gap-2">
          <Sparkles className="animate-spin h-5 w-5" />
          <span>ခေတ္တစောင့်ဆိုင်းပါ...</span>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#110804] flex items-center justify-center p-4">
        <form
          onSubmit={handleLogin}
          className="bg-[#1f1008] border border-amber-800/60 rounded-2xl p-8 max-w-sm w-full shadow-2xl"
        >
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-amber-500/10 rounded-full border border-amber-500/30">
              <Lock className="w-8 h-8 text-amber-400" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-amber-300 mb-1 text-center">
            🏮 Admin Dashboard
          </h1>
          <p className="text-xs text-amber-200/60 text-center mb-6">
            စီမံခန့်ခွဲမှုစနစ်သို့ ဝင်ရောက်ရန် လျှို့ဝှက်ကုဒ်ရိုက်ထည့်ပါ
          </p>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password ရိုက်ထည့်ပါ..."
            className="w-full px-4 py-3 bg-[#130904] border border-amber-900/60 rounded-xl text-white placeholder-amber-200/30 focus:outline-none focus:border-amber-400 mb-4"
            autoFocus
          />
          {loginError && (
            <p className="text-red-400 text-xs mb-4 text-center">{loginError}</p>
          )}
          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-950/50 cursor-pointer"
          >
            ဝင်ရောက်မည် (Login)
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#110804] text-white p-4 md:p-8">
      {/* Top Bar */}
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-amber-900/40">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent flex items-center gap-2">
            <span>🏮</span> သီတင်းကျွတ် စီမံခန့်ခွဲမှုစနစ် (Admin Portal)
          </h1>
          <p className="text-xs text-amber-200/60 mt-1">
            ကံစမ်းမဲဆုစာရင်းနှင့် လဲလှယ်မှုမှတ်တမ်းများ
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-red-950/60 hover:bg-red-900 border border-red-800/60 text-red-200 rounded-xl text-sm transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>ထွက်မည် (Logout)</span>
        </button>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('prizes')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm transition-all cursor-pointer ${
              activeTab === 'prizes'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/30'
                : 'bg-[#1f1008] text-amber-200/70 hover:bg-[#2c170d] border border-amber-900/30'
            }`}
          >
            <Gift className="w-4 h-4" />
            <span>ဆုမဲစာရင်း (Prize Pool)</span>
            <span className="ml-1 px-1.5 py-0.2 bg-black/30 rounded-md text-xs">
              {prizes.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm transition-all cursor-pointer ${
              activeTab === 'logs'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/30'
                : 'bg-[#1f1008] text-amber-200/70 hover:bg-[#2c170d] border border-amber-900/30'
            }`}
          >
            <History className="w-4 h-4" />
            <span>လှည့်လည်မှုမှတ်တမ်းများ (Spin Logs)</span>
            <span className="ml-1 px-1.5 py-0.2 bg-black/30 rounded-md text-xs">
              {logs.length}
            </span>
          </button>
        </div>

        {/* Prize Pool Tab */}
        {activeTab === 'prizes' && (
          <div className="bg-[#1a0d07] border border-amber-900/40 rounded-2xl p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-lg font-semibold text-amber-300">
                  Prize Inventory & Probability
                </h2>
                <p className="text-xs text-amber-200/50">
                  ဆုမဲတစ်ခုချင်းစီ၏ အရေအတွက်နှင့် ဖြစ်တန်စွမ်း (Weight) ကို ပြင်ဆင်နိုင်ပါသည်
                </p>
              </div>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 rounded-xl text-sm font-medium transition-all shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{showAddForm ? 'ပိတ်မည် (Close)' : 'ဆုအသစ်ထည့်မည် (+ Add Prize)'}</span>
              </button>
            </div>

            {/* Add Prize Form */}
            {showAddForm && (
              <div className="bg-[#24130a] border border-amber-700/40 rounded-xl p-5 mb-6">
                <h3 className="text-sm font-bold text-amber-300 mb-3">
                  ဆုမဲအသစ် သတ်မှတ်ချက်များ (New Prize Details)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  <div>
                    <label className="block text-xs text-amber-200/60 mb-1">အမည် (Prize Name)</label>
                    <input
                      type="text"
                      placeholder="e.g. 500 Ks Off"
                      value={newPrize.name}
                      onChange={(e) =>
                        setNewPrize({ ...newPrize, name: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-[#120804] border border-amber-900/60 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-amber-200/60 mb-1">အရေအတွက် (Quantity)</label>
                    <input
                      type="number"
                      placeholder="Total Qty"
                      value={newPrize.totalQty}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        setNewPrize({
                          ...newPrize,
                          totalQty: val,
                          remainingQty: val,
                        });
                      }}
                      className="w-full px-3 py-2 bg-[#120804] border border-amber-900/60 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-amber-200/60 mb-1">ဖြစ်တန်စွမ်းအလေးချိန် (Weight)</label>
                    <input
                      type="number"
                      placeholder="Weight"
                      value={newPrize.weight}
                      onChange={(e) =>
                        setNewPrize({
                          ...newPrize,
                          weight: parseInt(e.target.value) || 1,
                        })
                      }
                      className="w-full px-3 py-2 bg-[#120804] border border-amber-900/60 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-amber-200/60 mb-1">အရောင် (Slice Color)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={newPrize.color}
                        onChange={(e) =>
                          setNewPrize({ ...newPrize, color: e.target.value })
                        }
                        className="h-10 w-16 bg-transparent rounded cursor-pointer border border-amber-800"
                      />
                      <span className="text-xs font-mono text-amber-200/60">{newPrize.color}</span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center gap-2 text-sm text-amber-200/80 cursor-pointer pt-4">
                      <input
                        type="checkbox"
                        checked={newPrize.isWinning}
                        onChange={(e) =>
                          setNewPrize({ ...newPrize, isWinning: e.target.checked })
                        }
                        className="w-4 h-4 rounded accent-amber-500"
                      />
                      <span>အစစ်အမှန်ဆုမဲဖြစ်သည် (Winning Prize)</span>
                    </label>
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={handleAddPrize}
                      className="w-full py-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 rounded-lg text-sm font-bold transition-all cursor-pointer"
                    >
                      သိမ်းဆည်းမည် (Save Prize)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Prize Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-amber-900/40 text-amber-200/60 text-xs">
                    <th className="text-left py-3 px-3">Slice</th>
                    <th className="text-left py-3 px-3">ဆုအမည် (Name)</th>
                    <th className="text-center py-3 px-3">လက်ကျန် / စုစုပေါင်း (Remaining/Total)</th>
                    <th className="text-center py-3 px-3">ဖြစ်တန်စွမ်း (Weight)</th>
                    <th className="text-center py-3 px-3">ဆုမဲအမျိုးအစား</th>
                    <th className="text-right py-3 px-3">လုပ်ဆောင်ချက်</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-950/40">
                  {prizes.map((prize) => (
                    <tr key={prize.id} className="hover:bg-amber-950/20 transition-colors">
                      {editingId === prize.id ? (
                        <>
                          <td className="py-3 px-3">
                            <input
                              type="color"
                              value={editData.color || prize.color}
                              onChange={(e) =>
                                setEditData({ ...editData, color: e.target.value })
                              }
                              className="w-7 h-7 rounded cursor-pointer border border-amber-700"
                            />
                          </td>
                          <td className="py-3 px-3">
                            <input
                              type="text"
                              value={editData.name ?? prize.name}
                              onChange={(e) =>
                                setEditData({ ...editData, name: e.target.value })
                              }
                              className="px-3 py-1.5 bg-[#120804] border border-amber-800 rounded-lg text-sm w-full text-white"
                            />
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <input
                                type="number"
                                value={editData.remainingQty ?? prize.remainingQty}
                                onChange={(e) =>
                                  setEditData({
                                    ...editData,
                                    remainingQty: parseInt(e.target.value) || 0,
                                  })
                                }
                                className="px-2 py-1 bg-[#120804] border border-amber-800 rounded-lg text-sm w-16 text-center text-white"
                              />
                              <span className="text-amber-500/50">/</span>
                              <input
                                type="number"
                                value={editData.totalQty ?? prize.totalQty}
                                onChange={(e) =>
                                  setEditData({
                                    ...editData,
                                    totalQty: parseInt(e.target.value) || 0,
                                  })
                                }
                                className="px-2 py-1 bg-[#120804] border border-amber-800 rounded-lg text-sm w-16 text-center text-white"
                              />
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <input
                              type="number"
                              value={editData.weight ?? prize.weight}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  weight: parseInt(e.target.value) || 1,
                                })
                              }
                              className="px-2 py-1 bg-[#120804] border border-amber-800 rounded-lg text-sm w-16 text-center text-white"
                            />
                          </td>
                          <td className="py-3 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={editData.isWinning ?? prize.isWinning}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  isWinning: e.target.checked,
                                })
                              }
                              className="w-4 h-4 rounded accent-amber-500"
                            />
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleSaveEdit(prize.id)}
                                className="flex items-center gap-1 px-3 py-1 bg-emerald-700 hover:bg-emerald-600 rounded-lg text-xs font-semibold cursor-pointer"
                              >
                                <Save className="w-3.5 h-3.5" />
                                <span>Save</span>
                              </button>
                              <button
                                onClick={() => {
                                  setEditingId(null);
                                  setEditData({});
                                }}
                                className="flex items-center gap-1 px-3 py-1 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-xs cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Cancel</span>
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-3 px-3">
                            <div
                              className="w-6 h-6 rounded-full border border-white/20 shadow-sm"
                              style={{ backgroundColor: prize.color }}
                            />
                          </td>
                          <td className="py-3 px-3 font-medium text-white">{prize.name}</td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`font-bold ${
                                prize.remainingQty === 0
                                  ? 'text-red-400'
                                  : prize.remainingQty <= 5
                                  ? 'text-amber-400'
                                  : 'text-emerald-400'
                              }`}
                            >
                              {prize.remainingQty}
                            </span>
                            <span className="text-amber-200/40"> / {prize.totalQty}</span>
                          </td>
                          <td className="py-3 px-3 text-center text-amber-200/70 font-mono">
                            {prize.weight}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {prize.isWinning ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 rounded-full text-xs">
                                Real Prize
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-900 border border-neutral-700 text-neutral-400 rounded-full text-xs">
                                Try Again / Thanks
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => startEditing(prize)}
                                className="flex items-center gap-1 px-2.5 py-1 bg-amber-950/70 hover:bg-amber-900 border border-amber-800/50 text-amber-200 rounded-lg text-xs transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>
                              <button
                                onClick={() => handleDeletePrize(prize.id)}
                                className="flex items-center gap-1 px-2.5 py-1 bg-red-950/70 hover:bg-red-900 border border-red-800/50 text-red-200 rounded-lg text-xs transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Spin Logs Tab */}
        {activeTab === 'logs' && (
          <div className="bg-[#1a0d07] border border-amber-900/40 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h2 className="text-lg font-semibold text-amber-300">
                  Spin History & Verification
                </h2>
                <p className="text-xs text-amber-200/50">
                  Redeem Code သို့မဟုတ် MAC Address ဖြင့် ရှာဖွေစစ်ဆေးနိုင်ပါသည်
                </p>
              </div>

              <div className="flex gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-amber-400/50" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="TDG-XXXXX သို့မဟုတ် MAC..."
                    className="w-full pl-9 pr-4 py-2 bg-[#120804] border border-amber-900/60 rounded-xl text-sm text-white placeholder-amber-200/30 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-xl text-sm font-medium transition-colors cursor-pointer"
                >
                  ရှာမည်
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-amber-900/40 text-amber-200/60 text-xs">
                    <th className="text-left py-3 px-3">MAC Address</th>
                    <th className="text-left py-3 px-3">IP Address</th>
                    <th className="text-left py-3 px-3">ရရှိသောဆု (Won Prize)</th>
                    <th className="text-left py-3 px-3">Redeem Code</th>
                    <th className="text-center py-3 px-3">အခြေအနေ</th>
                    <th className="text-left py-3 px-3">အချိန်</th>
                    <th className="text-right py-3 px-3">ဆုထုတ်ယူမှုအတည်ပြုရန်</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-950/40">
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-amber-950/20 transition-colors"
                    >
                      <td className="py-3 px-3 font-mono text-xs text-amber-200/80">
                        {log.macAddress}
                      </td>
                      <td className="py-3 px-3 text-xs text-amber-200/60 font-mono">{log.ipAddress}</td>
                      <td className="py-3 px-3 font-medium text-white">{log.prizeName}</td>
                      <td className="py-3 px-3 font-mono font-bold text-amber-300 text-sm tracking-wider">
                        {log.redeemCode}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {log.isRedeemed ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 rounded-full text-xs">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Redeemed</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-950/60 border border-amber-800/40 text-amber-400 rounded-full text-xs">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-xs text-amber-200/40">
                        {log.createdAt
                          ? new Date(log.createdAt).toLocaleString()
                          : '-'}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {!log.isRedeemed && (
                          <button
                            onClick={() => handleMarkRedeemed(log.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>ထုတ်ပေးပြီး (Mark Redeemed)</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {logs.length === 0 && (
                <div className="text-center py-12 text-amber-200/40">
                  <p className="text-sm">မှတ်တမ်းမတွေ့ရှိပါ (No spin records found)</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
