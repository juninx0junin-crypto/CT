
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  ClipboardList, 
  TrendingUp, 
  X, 
  CheckCircle2, 
  ArrowLeft,
  ShoppingCart,
  Trash2,
  Calendar,
  AlertCircle,
  History,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { Comanda, ComandaStatus, Product, ComandaItem } from './types';
import { INITIAL_PRODUCTS, STORAGE_KEY, PRODUCTS_KEY } from './constants';

const App: React.FC = () => {
  const [comandas, setComandas] = useState<Comanda[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [view, setView] = useState<'dashboard' | 'detail' | 'report'>('dashboard');
  const [selectedComandaId, setSelectedComandaId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewComandaModal, setShowNewComandaModal] = useState(false);
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');

  // Persistência local e sincronização entre abas
  useEffect(() => {
    const savedComandas = localStorage.getItem(STORAGE_KEY);
    const savedProducts = localStorage.getItem(PRODUCTS_KEY);
    
    if (savedComandas) setComandas(JSON.parse(savedComandas));
    if (savedProducts) {
      setProducts(JSON.parse(savedProducts));
    } else {
      setProducts(INITIAL_PRODUCTS);
      localStorage.setItem(PRODUCTS_KEY, JSON.stringify(INITIAL_PRODUCTS));
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) setComandas(JSON.parse(e.newValue));
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const saveComandas = useCallback((newComandas: Comanda[]) => {
    setComandas(newComandas);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newComandas));
  }, []);

  // Handlers
  const handleCreateComanda = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim()) return;

    const newComanda: Comanda = {
      id: crypto.randomUUID(),
      customerName: newCustomerName,
      createdAt: new Date().toISOString(),
      status: ComandaStatus.OPEN,
      items: [],
      total: 0
    };

    const updated = [newComanda, ...comandas];
    saveComandas(updated);
    setNewCustomerName('');
    setShowNewComandaModal(false);
    setSelectedComandaId(newComanda.id);
    setView('detail');
  };

  const handleAddItem = (productId: string, quantity: number) => {
    if (!selectedComandaId) return;
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const updatedComandas = comandas.map(comanda => {
      if (comanda.id === selectedComandaId && comanda.status === ComandaStatus.OPEN) {
        const existingItemIndex = comanda.items.findIndex(item => item.productId === productId);
        let updatedItems = [...comanda.items];

        if (existingItemIndex > -1) {
          const item = updatedItems[existingItemIndex];
          const newQty = item.quantity + quantity;
          updatedItems[existingItemIndex] = {
            ...item,
            quantity: newQty,
            subtotal: newQty * item.unitPrice
          };
        } else {
          updatedItems.push({
            id: crypto.randomUUID(),
            productId: product.id,
            productName: product.name,
            quantity: quantity,
            unitPrice: product.price,
            subtotal: quantity * product.price
          });
        }

        const newTotal = updatedItems.reduce((acc, item) => acc + item.subtotal, 0);
        return { ...comanda, items: updatedItems, total: newTotal };
      }
      return comanda;
    });

    saveComandas(updatedComandas);
  };

  const handleRemoveItem = (itemId: string) => {
    const updatedComandas = comandas.map(comanda => {
      if (comanda.id === selectedComandaId && comanda.status === ComandaStatus.OPEN) {
        const updatedItems = comanda.items.filter(item => item.id !== itemId);
        const newTotal = updatedItems.reduce((acc, item) => acc + item.subtotal, 0);
        return { ...comanda, items: updatedItems, total: newTotal };
      }
      return comanda;
    });
    saveComandas(updatedComandas);
  };

  const handleConfirmClose = () => {
    if (!selectedComandaId) return;

    const updatedComandas = comandas.map(comanda => {
      if (comanda.id === selectedComandaId) {
        return { 
          ...comanda, 
          status: ComandaStatus.CLOSED, 
          closedAt: new Date().toISOString() 
        };
      }
      return comanda;
    });

    saveComandas(updatedComandas);
    setShowCloseConfirmation(false);
    setView('dashboard');
    setSelectedComandaId(null);
  };

  // Memoized filters for performance
  const openComandas = useMemo(() => 
    comandas.filter(c => 
      c.status === ComandaStatus.OPEN && 
      c.customerName.toLowerCase().includes(searchTerm.toLowerCase())
    ), [comandas, searchTerm]);

  const selectedComanda = useMemo(() => 
    comandas.find(c => c.id === selectedComandaId), [comandas, selectedComandaId]);

  const getTodayReport = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const closedToday = comandas.filter(c => 
      c.status === ComandaStatus.CLOSED && 
      c.closedAt?.startsWith(today)
    );
    const total = closedToday.reduce((acc, curr) => acc + curr.total, 0);
    return { total, count: closedToday.length, list: closedToday };
  }, [comandas]);

  return (
    <div className="min-h-screen pb-20 md:pb-0 bg-gray-50 text-slate-900">
      {/* Header */}
      <header className="bg-[#377b93] text-white shadow-lg p-4 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setView('dashboard'); setSelectedComandaId(null); }}>
            <div className="bg-white p-1.5 rounded-lg shadow-sm">
              <ClipboardList className="text-[#377b93] w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">CT RECANTO DA AREIA | COMANDAS</h1>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setView('report')} 
              className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${view === 'report' ? 'bg-[#2a5e70]' : 'hover:bg-[#4a8ba3]'}`}
              title="Relatório do Dia"
            >
              <TrendingUp className="w-6 h-6" />
              <span className="hidden md:inline font-semibold">Relatório</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 md:p-6">
        {view === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="Buscar comanda pelo nome..." 
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#377b93] shadow-sm bg-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button 
                onClick={() => setShowNewComandaModal(true)}
                className="bg-[#377b93] text-white px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-[#2a5e70] transition-all shadow-md active:scale-95"
              >
                <Plus className="w-5 h-5" /> Nova Comanda
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {openComandas.length > 0 ? (
                openComandas.map(comanda => (
                  <div 
                    key={comanda.id}
                    onClick={() => {
                      setSelectedComandaId(comanda.id);
                      setView('detail');
                    }}
                    className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer group border-l-4 border-l-[#377b93]"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-lg text-slate-800 line-clamp-1">{comanda.customerName}</h3>
                        <p className="text-gray-400 text-sm flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(comanda.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="block text-2xl font-black text-[#377b93]">
                          R$ {comanda.total.toFixed(2)}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-[#eef6f8] text-[#377b93] rounded-full uppercase">
                          {comanda.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-500 border-t border-gray-50 pt-3">
                      <span>{comanda.items.length} itens</span>
                      <span className="text-[#377b93] font-medium group-hover:translate-x-1 transition-transform">Lançar itens →</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-20 text-center flex flex-col items-center gap-4">
                  <div className="bg-gray-100 p-6 rounded-full">
                    <ClipboardList className="w-12 h-12 text-gray-300" />
                  </div>
                  <div>
                    <p className="text-gray-500 font-medium text-lg">Nenhuma comanda aberta</p>
                    <p className="text-gray-400">Tudo em dia por aqui!</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'detail' && selectedComanda && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <button 
              onClick={() => { setView('dashboard'); setSelectedComandaId(null); }}
              className="flex items-center gap-2 text-[#377b93] font-semibold hover:text-[#2a5e70] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" /> Voltar para lista
            </button>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className={`p-6 text-white flex justify-between items-center ${selectedComanda.status === ComandaStatus.OPEN ? 'bg-slate-800' : 'bg-slate-500'}`}>
                <div>
                  <h2 className="text-2xl font-bold">{selectedComanda.customerName}</h2>
                  <p className="text-slate-300 text-sm">Abertura: {new Date(selectedComanda.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase flex items-center gap-2 ${selectedComanda.status === ComandaStatus.OPEN ? 'bg-[#377b93]/30 text-[#4fa7c6]' : 'bg-white/20 text-white'}`}>
                  {selectedComanda.status === ComandaStatus.OPEN ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                  {selectedComanda.status}
                </div>
              </div>

              <div className="p-6 space-y-8">
                {/* Status Alert for Closed Comandas */}
                {selectedComanda.status === ComandaStatus.CLOSED && (
                  <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3 text-amber-800 items-start">
                    <History className="w-5 h-5 mt-0.5" />
                    <div>
                      <p className="font-bold">Comanda Finalizada</p>
                      <p className="text-sm">Esta comanda foi fechada às {new Date(selectedComanda.closedAt!).toLocaleTimeString()}. Não é possível alterar itens ou status.</p>
                    </div>
                  </div>
                )}

                {/* Items List */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-[#377b93]" /> Itens da Comanda
                  </h3>

                  {selectedComanda.items.length > 0 ? (
                    <div className="divide-y divide-gray-100 border border-gray-50 rounded-2xl overflow-hidden">
                      {selectedComanda.items.map(item => (
                        <div key={item.id} className="p-4 flex justify-between items-center bg-white hover:bg-gray-50 transition-colors">
                          <div className="flex-1">
                            <h4 className="font-semibold text-slate-800">{item.productName}</h4>
                            <p className="text-sm text-gray-500">
                              {item.quantity}x de R$ {item.unitPrice.toFixed(2)}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-slate-800">R$ {item.subtotal.toFixed(2)}</span>
                            {selectedComanda.status === ComandaStatus.OPEN && (
                              <button 
                                onClick={() => handleRemoveItem(item.id)}
                                className="text-gray-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-all"
                                title="Remover item"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center">
                      <p className="text-gray-400">Nenhum item lançado ainda.</p>
                    </div>
                  )}
                </div>

                {/* Total Area */}
                <div className="bg-slate-50 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-6 border border-slate-100">
                  <div className="text-center md:text-left">
                    <p className="text-gray-400 uppercase tracking-widest text-xs font-black">Total a Pagar</p>
                    <p className="text-5xl font-black text-slate-800">R$ {selectedComanda.total.toFixed(2)}</p>
                  </div>
                  {selectedComanda.status === ComandaStatus.OPEN && (
                    <button 
                      onClick={() => setShowCloseConfirmation(true)}
                      className="w-full md:w-auto bg-[#377b93] text-white px-10 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-[#2a5e70] transition-all shadow-xl active:scale-95 text-lg"
                    >
                      <CheckCircle2 className="w-6 h-6" /> Fechar Comanda
                    </button>
                  )}
                </div>

                {/* Add Item Form (Only if Open) */}
                {selectedComanda.status === ComandaStatus.OPEN && (
                  <div className="pt-6 border-t border-gray-100 animate-in fade-in duration-500">
                    <h3 className="text-lg font-bold mb-4">Adicionar Itens</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {products.map(product => (
                        <button
                          key={product.id}
                          onClick={() => handleAddItem(product.id, 1)}
                          className="flex flex-col items-center justify-center p-4 bg-white border-2 border-gray-100 rounded-2xl hover:border-[#377b93] hover:shadow-md hover:bg-[#eef6f8] transition-all active:scale-90 text-center group"
                        >
                          <span className="font-bold text-slate-700 text-sm group-hover:text-[#377b93] transition-colors">{product.name}</span>
                          <span className="text-[#377b93] font-bold text-sm mt-1">R$ {product.price.toFixed(2)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {view === 'report' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <button 
              onClick={() => { setView('dashboard'); setSelectedComandaId(null); }}
              className="flex items-center gap-2 text-[#377b93] font-semibold hover:text-[#2a5e70] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" /> Voltar para o Balcão
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                <div className="bg-[#eef6f8] p-4 rounded-full mb-4">
                  <TrendingUp className="text-[#377b93] w-8 h-8" />
                </div>
                <h3 className="text-gray-500 font-bold uppercase tracking-widest text-xs">Faturamento Hoje</h3>
                <p className="text-5xl font-black text-slate-800 mt-2">R$ {getTodayReport().total.toFixed(2)}</p>
              </div>

              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
                <div className="bg-blue-50 p-4 rounded-full mb-4">
                  <CheckCircle2 className="text-blue-600 w-8 h-8" />
                </div>
                <h3 className="text-gray-500 font-bold uppercase tracking-widest text-xs">Comandas Fechadas</h3>
                <p className="text-5xl font-black text-slate-800 mt-2">{getTodayReport().count}</p>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gray-50">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <History className="w-5 h-5 text-gray-500" /> Histórico de Vendas (Hoje)
                </h3>
              </div>
              <div className="divide-y divide-gray-100">
                {getTodayReport().list.length > 0 ? (
                  getTodayReport().list.map(c => (
                    <div 
                      key={c.id} 
                      className="p-4 flex justify-between items-center hover:bg-gray-50 cursor-pointer"
                      onClick={() => { setSelectedComandaId(c.id); setView('detail'); }}
                    >
                      <div>
                        <p className="font-bold text-slate-800">{c.customerName}</p>
                        <p className="text-xs text-gray-400">Encerrada às {new Date(c.closedAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-[#377b93]">R$ {c.total.toFixed(2)}</p>
                        <span className="text-[10px] text-gray-400 font-bold uppercase">Ver Detalhes</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="p-12 text-center text-gray-400 italic">Nenhuma venda concluída hoje.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer Mobile Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-around md:hidden z-40">
        <button 
          onClick={() => { setView('dashboard'); setSelectedComandaId(null); }}
          className={`flex flex-col items-center gap-1 ${view === 'dashboard' ? 'text-[#377b93]' : 'text-gray-400'}`}
        >
          <ClipboardList className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase">Balcão</span>
        </button>
        <button 
          onClick={() => setShowNewComandaModal(true)}
          className="flex flex-col items-center gap-1 -mt-8 bg-[#377b93] text-white p-4 rounded-full shadow-lg border-4 border-gray-50 active:scale-90 transition-transform"
        >
          <Plus className="w-6 h-6" />
        </button>
        <button 
          onClick={() => setView('report')}
          className={`flex flex-col items-center gap-1 ${view === 'report' ? 'text-[#377b93]' : 'text-gray-400'}`}
        >
          <TrendingUp className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase">Vendas</span>
        </button>
      </nav>

      {/* New Comanda Modal */}
      {showNewComandaModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#377b93] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20">
            <div className="p-6 text-white flex justify-between items-center border-b border-white/10">
              <h2 className="text-xl font-bold">Abrir Nova Comanda</h2>
              <button onClick={() => setShowNewComandaModal(false)} className="hover:bg-white/10 p-1.5 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleCreateComanda} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wide">Identificação do Cliente</label>
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Ex: Carlos - Quadra 3" 
                  className="w-full px-4 py-4 rounded-2xl bg-white/10 border border-white/20 focus:outline-none focus:ring-4 focus:ring-white/10 focus:border-white transition-all text-lg text-white placeholder:text-white/40"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  required
                />
              </div>
              <div className="bg-white/10 p-4 rounded-2xl flex gap-3 text-white/90 text-sm border border-white/5">
                <Calendar className="w-5 h-5 flex-shrink-0 text-white/70" />
                <p>Abertura automática: <strong className="text-white">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>.</p>
              </div>
              <button 
                type="submit"
                className="w-full bg-white text-[#377b93] py-5 rounded-2xl font-bold text-xl shadow-xl hover:bg-gray-100 transition-all active:scale-95 mt-2"
              >
                Abrir Comanda
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Close Confirmation Modal */}
      {showCloseConfirmation && selectedComanda && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#377b93] rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20">
            <div className="p-8 text-center space-y-6">
              <div className="bg-white/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                <AlertTriangle className="w-10 h-10 text-white animate-pulse" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Finalizar Comanda?</h2>
                <p className="text-white/70 text-lg">Confirme o encerramento da conta de:</p>
                <p className="text-white text-2xl font-black">{selectedComanda.customerName}</p>
              </div>

              <div className="bg-white/10 p-6 rounded-3xl border border-white/5">
                <p className="text-white/60 text-sm font-bold uppercase tracking-widest mb-1">Valor Total</p>
                <p className="text-5xl font-black text-white">R$ {selectedComanda.total.toFixed(2)}</p>
              </div>

              <div className="space-y-3 pt-4">
                <button 
                  onClick={handleConfirmClose}
                  className="w-full bg-white text-[#377b93] py-5 rounded-2xl font-black text-xl shadow-xl hover:bg-gray-100 transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                  <CheckCircle2 className="w-6 h-6" /> SIM, ENCERRAR
                </button>
                <button 
                  onClick={() => setShowCloseConfirmation(false)}
                  className="w-full bg-transparent text-white/70 py-4 rounded-2xl font-bold text-lg hover:text-white transition-all active:scale-95 border border-white/10"
                >
                  NÃO, VOLTAR
                </button>
              </div>
            </div>
            
            <div className="bg-black/10 p-4 text-center">
              <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest">
                Esta ação enviará o valor para o faturamento de hoje
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
