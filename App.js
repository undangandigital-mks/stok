import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  collection,
  onSnapshot,
  query,
  deleteDoc
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  Package, 
  Plus, 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  Archive, 
  BarChart3, 
  RefreshCw,
  MoreVertical,
  TrendingDown,
  LayoutDashboard,
  Tag,
  Trash2,
  Edit2,
  X
} from 'lucide-react';

// KONFIGURASI FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyCpvlQvDoKyPiiXbe_S9Cyod6xngcNIyrM",
  authDomain: "stokmasterpro.firebaseapp.com",
  projectId: "stokmasterpro",
  storageBucket: "stokmasterpro.firebasestorage.app",
  messagingSenderId: "173852334756",
  appId: "1:173852334756:web:8826a78a85ca1f81ef2431"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'stok-master-pro';

export default function App() {
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "",
    stock: 0,
    minStock: 5,
    unit: "Pcs"
  });

  // 1. Inisialisasi Auth
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInAnonymously(auth);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        setError("Koneksi gagal. Silakan periksa konfigurasi Firebase Anda.");
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // 2. Sinkronisasi Data Real-time
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'inventory_items'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const itemList = [];
      snapshot.forEach((doc) => {
        itemList.push({ id: doc.id, ...doc.data() });
      });
      itemList.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      setItems(itemList);
      setLoading(false);
    }, (err) => {
      setError("Gagal mengambil data: " + err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      const docId = editingId || formData.sku || Date.now().toString();
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'inventory_items', docId);
      
      await setDoc(docRef, {
        ...formData,
        updatedAt: new Date().toISOString(),
        updatedBy: user.uid
      });

      setIsAdding(false);
      setEditingId(null);
      setFormData({ name: "", sku: "", category: "", stock: 0, minStock: 5, unit: "Pcs" });
    } catch (err) {
      setError("Gagal menyimpan: " + err.message);
    }
  };

  const handleEdit = (item) => {
    setFormData({
      name: item.name,
      sku: item.sku,
      category: item.category,
      stock: item.stock,
      minStock: item.minStock,
      unit: item.unit || "Pcs"
    });
    setEditingId(item.id);
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus barang ini?")) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'inventory_items', id));
    } catch (err) {
      setError("Gagal menghapus: " + err.message);
    }
  };

  const filteredItems = items.filter(item => 
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockCount = items.filter(item => item.stock <= item.minStock && item.stock > 0).length;
  const outOfStockCount = items.filter(item => item.stock <= 0).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-blue-100">
      
      <nav className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <Package size={20} />
            </div>
            <h1 className="font-bold text-lg tracking-tight">StokMaster<span className="text-blue-600">Pro</span></h1>
          </div>
          
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${user ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${user ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`} />
              {user ? 'Sistem Online' : 'Offline'}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Barang" value={items.length} icon={<Archive className="text-blue-500" />} />
          <StatCard title="Stok Menipis" value={lowStockCount} icon={<TrendingDown className="text-amber-500" />} color="bg-amber-50" />
          <StatCard title="Habis" value={outOfStockCount} icon={<AlertTriangle className="text-red-500" />} color="bg-red-50" />
          <StatCard title="Aktivitas" value="Live" icon={<BarChart3 className="text-emerald-500" />} />
        </div>

        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari Nama, SKU, atau Kategori..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => {
              setIsAdding(!isAdding);
              if (isAdding) setEditingId(null);
            }}
            className="w-full md:w-auto px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200"
          >
            {isAdding ? <X size={18} /> : <Plus size={18} />}
            {isAdding ? 'Batal' : 'Tambah Barang'}
          </button>
        </div>

        {isAdding && (
          <div className="bg-white rounded-2xl border border-blue-100 p-6 shadow-xl shadow-blue-50 animate-in fade-in slide-in-from-top-4">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              {editingId ? <Edit2 className="text-blue-600" size={20} /> : <PlusCircle className="text-blue-600" size={20} />}
              {editingId ? 'Edit Informasi Barang' : 'Informasi Barang Baru'}
            </h3>
            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4 md:col-span-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputGroup 
                    label="Nama Barang" 
                    value={formData.name} 
                    onChange={v => setFormData({...formData, name: v})} 
                    placeholder="Contoh: Kertas A4" 
                    required 
                  />
                  <InputGroup 
                    label="SKU / Barcode" 
                    value={formData.sku} 
                    onChange={v => setFormData({...formData, sku: v})} 
                    placeholder="KS-A4-001" 
                    disabled={!!editingId}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">Kategori</label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-3 text-slate-400" size={16} />
                      <input 
                        type="text"
                        placeholder="Ketik..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        value={formData.category}
                        onChange={e => setFormData({...formData, category: e.target.value})}
                      />
                    </div>
                  </div>
                  <InputGroup 
                    label="Stok" 
                    type="number" 
                    value={formData.stock} 
                    onChange={v => setFormData({...formData, stock: parseInt(v) || 0})} 
                  />
                  <InputGroup 
                    label="Min. Stok" 
                    type="number" 
                    value={formData.minStock} 
                    onChange={v => setFormData({...formData, minStock: parseInt(v) || 0})} 
                  />
                  <InputGroup 
                    label="Satuan" 
                    value={formData.unit} 
                    onChange={v => setFormData({...formData, unit: v})} 
                    placeholder="Pcs/Box/Kg" 
                  />
                </div>
              </div>
              <div className="flex flex-col justify-end gap-3">
                <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">
                  {editingId ? 'Update Data' : 'Simpan Barang'}
                </button>
                {editingId && (
                  <button 
                    type="button" 
                    onClick={() => { setIsAdding(false); setEditingId(null); }}
                    className="w-full py-2 text-slate-500 text-xs font-bold hover:text-slate-800 transition-all"
                  >
                    Batal Edit
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200">
                  <th className="px-6 py-4">Barang</th>
                  <th className="px-6 py-4">Kategori</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Stok</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400">
                      <RefreshCw className="animate-spin mx-auto mb-2" />
                      Memuat database...
                    </td>
                  </tr>
                ) : filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800">{item.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{item.sku || 'No SKU'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold uppercase tracking-tight">
                          {item.category || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StockBadge stock={item.stock} min={item.minStock} />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-700">{item.stock}</span>
                          <span className="text-[10px] text-slate-400 uppercase">{item.unit || 'Pcs'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleEdit(item)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Edit Barang"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(item.id)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="Hapus Barang"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400 italic">
                      Tidak ada barang ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex gap-3 text-red-600 text-xs font-medium">
            <AlertTriangle className="shrink-0" />
            {error}
          </div>
        )}
      </main>

      <footer className="max-w-7xl mx-auto px-4 pb-12">
        <div className="bg-slate-100 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 border border-slate-200">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <LayoutDashboard size={14} />
            Database: <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200">inventory_items</span>
          </div>
          <div className="text-[10px] text-slate-400 uppercase tracking-tighter">
            © 2024 StokMasterPro • Update Terakhir: {new Date().toLocaleDateString('id-ID')}
          </div>
        </div>
      </footer>
    </div>
  );
}

function StatCard({ title, value, icon, color = "bg-white" }) {
  return (
    <div className={`${color} p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between`}>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{title}</p>
        <p className="text-2xl font-black text-slate-800">{value}</p>
      </div>
      <div className="p-3 bg-white rounded-xl shadow-inner border border-slate-100">
        {icon}
      </div>
    </div>
  );
}

function InputGroup({ label, type = "text", value, onChange, placeholder, required = false, disabled = false }) {
  return (
    <div className="w-full">
      <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block tracking-wide">{label}</label>
      <input 
        type={type} 
        required={required}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-4 py-2.5 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all ${disabled ? 'bg-slate-100 cursor-not-allowed opacity-60' : 'bg-slate-50'}`}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}

function StockBadge({ stock, min }) {
  if (stock <= 0) return (
    <span className="flex items-center gap-1.5 px-2 py-1 bg-red-100 text-red-700 rounded-md text-[10px] font-bold w-fit uppercase tracking-tighter">
      <AlertTriangle size={12} /> Habis
    </span>
  );
  if (stock <= min) return (
    <span className="flex items-center gap-1.5 px-2 py-1 bg-amber-100 text-amber-700 rounded-md text-[10px] font-bold w-fit uppercase tracking-tighter">
      <TrendingDown size={12} /> Menipis
    </span>
  );
  return (
    <span className="flex items-center gap-1.5 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-md text-[10px] font-bold w-fit uppercase tracking-tighter">
      <CheckCircle size={12} /> Aman
    </span>
  );
}

function PlusCircle({ size, className }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" /><path d="M12 8v8" /><path d="M8 12h8" />
    </svg>
  );
}