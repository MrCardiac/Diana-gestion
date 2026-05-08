import { useState, useEffect } from "react";

const STORAGE_KEY = "diana_data";
const RED = "#8B1A1A";

const DEFAULT_DATA = {
  products: [
    { id: 1, ref: "DIA-001", name: "DIANA 30X50 COULEUR", puctn: 1008, qteParCtn: 144, pu: 7 },
    { id: 2, ref: "DIA-002", name: "DIANA 40X70 COULEUR", puctn: 1620, qteParCtn: 120, pu: 13.5 },
    { id: 3, ref: "DIA-003", name: "DIANA 50X90 COULEUR", puctn: 1260, qteParCtn: 60, pu: 21 },
    { id: 4, ref: "DIA-004", name: "SERVIETTE 50X70 (108)", puctn: 756, qteParCtn: 108, pu: 7 },
    { id: 5, ref: "DIA-005", name: "MANTA ENFANT 1.050KG", puctn: 1000, qteParCtn: 10, pu: 100 },
  ],
  clients: [
    { id: 1, name: "HASSAN AITBELLA", phone: "0662712919", solde: 2628 },
    { id: 2, name: "RACHID BORGONE", phone: "", solde: 15552 },
    { id: 3, name: "HICHAM AITBELLA", phone: "", solde: 2520 },
    { id: 4, name: "YOUSSEF RAHAL", phone: "", solde: 3780 },
    { id: 5, name: "BOULMELF MOHAMMED", phone: "", solde: 2000 },
  ],
  orders: [],
  payments: [],
  counters: { bon: 7, client: 6, product: 6 },
};

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_DATA;
  } catch { return DEFAULT_DATA; }
}

function saveData(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

export default function App() {
  const [data, setData] = useState(() => loadData());
  const [page, setPage] = useState("dashboard");
  const [search, setSearch] = useState("");
  const [filterClient, setFilterClient] = useState("");
  const [modal, setModal] = useState(null);

  const { products, clients, orders, payments, counters } = data;

  useEffect(() => { saveData(data); }, [data]);

  const update = (patch) => setData(d => ({ ...d, ...patch }));

  const totalImpaye = clients.reduce((s, c) => s + c.solde, 0);
  const totalCA = orders.reduce((s, o) => s + o.total, 0);
  const todayStr = new Date().toLocaleDateString("fr-FR");
  const todayOrders = orders.filter(o => o.date.startsWith(todayStr));
  const todayCA = todayOrders.reduce((s, o) => s + o.total, 0);

  const addProduct = (p) => {
    const id = counters.product;
    update({ products: [...products, { ...p, id }], counters: { ...counters, product: id + 1 } });
  };
  const editProduct = (p) => update({ products: products.map(x => x.id === p.id ? p : x) });
  const deleteProduct = (id) => update({ products: products.filter(x => x.id !== id) });

  const addClient = (c) => {
    const id = counters.client;
    update({ clients: [...clients, { ...c, id, solde: 0 }], counters: { ...counters, client: id + 1 } });
  };
  const editClient = (c) => update({ clients: clients.map(x => x.id === c.id ? c : x) });

  const addOrder = (order) => {
    const bonNo = counters.bon;
    const newOrder = { ...order, id: Date.now(), bonNo };
    update({
      orders: [newOrder, ...orders],
      clients: clients.map(c => c.id === order.clientId ? { ...c, solde: c.solde + order.total } : c),
      counters: { ...counters, bon: bonNo + 1 },
    });
    setModal({ type: "bl", payload: newOrder });
  };

  const deleteOrder = (order) => {
    update({
      orders: orders.filter(o => o.id !== order.id),
      clients: clients.map(c => c.id === order.clientId ? { ...c, solde: Math.max(0, c.solde - order.total) } : c),
    });
  };

  const addPayment = (clientId, montant) => {
    const pmt = { id: Date.now(), clientId, montant, date: new Date().toLocaleString("fr-FR") };
    update({
      payments: [...payments, pmt],
      clients: clients.map(c => c.id === clientId ? { ...c, solde: Math.max(0, c.solde - montant) } : c),
    });
  };

  const nav = [
    { id: "dashboard", label: "📊 Dashboard" },
    { id: "products", label: "📦 Produits" },
    { id: "clients", label: "👥 Clients" },
    { id: "orders", label: "🧾 Commandes" },
    { id: "stats", label: "📈 Statistiques" },
  ];

  const filteredOrders = orders.filter(o => {
    const mc = filterClient ? o.clientId === parseInt(filterClient) : true;
    const ms = search ? o.clientName.toLowerCase().includes(search.toLowerCase()) || String(o.bonNo).includes(search) : true;
    return mc && ms;
  });
  const filteredProducts = products.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.ref.toLowerCase().includes(search.toLowerCase()));
  const filteredClients = clients.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ fontFamily: "Arial, sans-serif", minHeight: "100vh", background: "#f5f4f0" }}>
      <div style={{ background: RED, padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ color: "white", fontSize: 26, fontWeight: 700, fontStyle: "italic", letterSpacing: 2 }}>Diana</div>
        <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 12 }}>Système de Gestion</div>
      </div>

      <div style={{ background: "white", borderBottom: "1px solid #e0e0e0", display: "flex", overflowX: "auto" }}>
        {nav.map(n => (
          <button key={n.id} onClick={() => { setPage(n.id); setSearch(""); }} style={{
            padding: "11px 18px", border: "none", background: "none", cursor: "pointer",
            borderBottom: page === n.id ? `2px solid ${RED}` : "2px solid transparent",
            color: page === n.id ? RED : "#555", fontWeight: page === n.id ? 700 : 400, fontSize: 13, whiteSpace: "nowrap"
          }}>{n.label}</button>
        ))}
      </div>

      {["products","clients","orders"].includes(page) && (
        <div style={{ background: "white", borderBottom: "1px solid #eee", padding: "10px 20px", display: "flex", gap: 10 }}>
          <input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, padding: "7px 12px", border: "1px solid #ddd", borderRadius: 7, fontSize: 13 }} />
          {page === "orders" && (
            <select value={filterClient} onChange={e => setFilterClient(e.target.value)} style={{ padding: "7px 10px", border: "1px solid #ddd", borderRadius: 7, fontSize: 13 }}>
              <option value="">Tous les clients</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
        </div>
      )}

      <div style={{ padding: "20px", maxWidth: 920, margin: "0 auto" }}>

        {page === "dashboard" && (
          <div>
            <h2 style={{ margin: "0 0 16px", fontSize: 17 }}>Vue Générale</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px,1fr))", gap: 12, marginBottom: 24 }}>
              {[
                { label: "Total Impayé", value: totalImpaye.toLocaleString("fr-FR") + " DH", color: RED },
                { label: "CA Total", value: totalCA.toLocaleString("fr-FR") + " DH", color: "#1a5fa8" },
                { label: "CA Aujourd'hui", value: todayCA.toLocaleString("fr-FR") + " DH", color: "#1a7a4a" },
                { label: "Clients", value: clients.length, color: "#666" },
                { label: "BL Aujourd'hui", value: todayOrders.length, color: "#7a4a1a" },
              ].map(c => (
                <div key={c.label} style={{ background: "white", border: "0.5px solid #ddd", borderRadius: 10, padding: "14px 16px" }}>
                  <div style={{ fontSize: 11, color: "#999", marginBottom: 6 }}>{c.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: c.color }}>{c.value}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ background: "white", border: "0.5px solid #ddd", borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Top soldes impayés</div>
                {clients.filter(c => c.solde > 0).sort((a,b) => b.solde-a.solde).slice(0,5).map(c => (
                  <div key={c.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "0.5px solid #f5f5f5", fontSize: 13 }}>
                    <span>{c.name}</span><span style={{ fontWeight: 700, color: RED }}>{c.solde.toLocaleString("fr-FR")} DH</span>
                  </div>
                ))}
              </div>
              <div style={{ background: "white", border: "0.5px solid #ddd", borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Dernières commandes</div>
                {orders.slice(0,5).map(o => (
                  <div key={o.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "0.5px solid #f5f5f5", fontSize: 12 }}>
                    <span>BL #{String(o.bonNo).padStart(3,"0")} · {o.clientName}</span>
                    <span style={{ fontWeight: 600, color: "#1a5fa8" }}>{o.total.toLocaleString("fr-FR")} DH</span>
                  </div>
                ))}
                {orders.length === 0 && <div style={{ color: "#bbb", fontSize: 13 }}>Aucune commande</div>}
              </div>
            </div>
          </div>
        )}

        {page === "products" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h2 style={{ margin: 0, fontSize: 17 }}>Catalogue ({filteredProducts.length})</h2>
              <button onClick={() => setModal({ type: "addProduct" })} style={btnStyle(RED)}>+ Ajouter</button>
            </div>
            <div style={{ background: "white", borderRadius: 10, border: "0.5px solid #ddd", overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f5f5f5" }}>
                    {["Réf","Article","PU(CTN)","Qté/CTN","PU pièce",""].map(h => (
                      <th key={h} style={{ padding: "9px 12px", textAlign: "left", fontWeight: 700, color: "#555", borderBottom: "1px solid #eee", fontSize: 12 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(p => (
                    <tr key={p.id} style={{ borderBottom: "0.5px solid #f5f5f5" }}>
                      <td style={{ padding: "9px 12px", color: "#999", fontSize: 11 }}>{p.ref}</td>
                      <td style={{ padding: "9px 12px", fontWeight: 600 }}>{p.name}</td>
                      <td style={{ padding: "9px 12px" }}>{p.puctn.toLocaleString("fr-FR")} DH</td>
                      <td style={{ padding: "9px 12px" }}>{p.qteParCtn} pcs</td>
                      <td style={{ padding: "9px 12px" }}>{p.pu} DH</td>
                      <td style={{ padding: "9px 12px" }}>
                        <button onClick={() => setModal({ type: "editProduct", payload: p })} style={btnSmall("#555")}>✏️</button>
                        <button onClick={() => deleteProduct(p.id)} style={{ ...btnSmall("#c00"), marginLeft: 6 }}>🗑</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {page === "clients" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h2 style={{ margin: 0, fontSize: 17 }}>Clients ({filteredClients.length})</h2>
              <button onClick={() => setModal({ type: "addClient" })} style={btnStyle(RED)}>+ Ajouter</button>
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {filteredClients.map(c => (
                <div key={c.id} style={{ background: "white", border: "0.5px solid #ddd", borderRadius: 10, padding: "13px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</div>
                    <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>{c.phone || "—"}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ textAlign: "right", marginRight: 6 }}>
                      <div style={{ fontSize: 11, color: "#999" }}>Solde</div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: c.solde > 0 ? RED : "#1a7a4a" }}>{c.solde.toLocaleString("fr-FR")} DH</div>
                    </div>
                    <button onClick={() => setModal({ type: "payment", payload: c })} style={btnSmall("#1a5fa8", "white")}>💳</button>
                    <button onClick={() => setModal({ type: "clientDetail", payload: c })} style={btnSmall("#555")}>📋</button>
                    <button onClick={() => setModal({ type: "editClient", payload: c })} style={btnSmall("#444")}>✏️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {page === "orders" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h2 style={{ margin: 0, fontSize: 17 }}>Bons de Livraison ({filteredOrders.length})</h2>
              <button onClick={() => setModal({ type: "newOrder" })} style={btnStyle(RED)}>+ Nouvelle commande</button>
            </div>
            {filteredOrders.length === 0 ? (
              <div style={{ background: "white", borderRadius: 10, border: "0.5px solid #ddd", padding: 40, textAlign: "center", color: "#bbb" }}>Aucune commande trouvée.</div>
            ) : filteredOrders.map(o => (
              <div key={o.id} style={{ background: "white", border: "0.5px solid #ddd", borderRadius: 10, padding: "13px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>BON No. {String(o.bonNo).padStart(3,"0")} — {o.clientName}</div>
                  <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>{o.date} · {o.items.length} article(s)</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ fontWeight: 700, color: RED, fontSize: 15, marginRight: 4 }}>{o.total.toLocaleString("fr-FR")} DH</div>
                  <button onClick={() => setModal({ type: "bl", payload: o })} style={btnSmall(RED, "white")}>🖨 BL</button>
                  <button onClick={() => { if(window.confirm(`Annuler BL #${String(o.bonNo).padStart(3,"0")} ?`)) deleteOrder(o); }} style={btnSmall("#c00")}>🗑 Annuler</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {page === "stats" && <StatsPage orders={orders} clients={clients} payments={payments} />}
      </div>

      {modal?.type === "addProduct" && <ProductModal onClose={() => setModal(null)} onSave={p => { addProduct(p); setModal(null); }} />}
      {modal?.type === "editProduct" && <ProductModal product={modal.payload} onClose={() => setModal(null)} onSave={p => { editProduct(p); setModal(null); }} />}
      {modal?.type === "addClient" && <ClientModal onClose={() => setModal(null)} onSave={c => { addClient(c); setModal(null); }} />}
      {modal?.type === "editClient" && <ClientModal client={modal.payload} onClose={() => setModal(null)} onSave={c => { editClient(c); setModal(null); }} />}
      {modal?.type === "newOrder" && <OrderModal products={products} clients={clients} onClose={() => setModal(null)} onSave={addOrder} />}
      {modal?.type === "payment" && <PaymentModal client={modal.payload} payments={payments.filter(p => p.clientId === modal.payload.id)} onClose={() => setModal(null)} onSave={(id, m) => { addPayment(id, m); setModal(null); }} />}
      {modal?.type === "clientDetail" && <ClientDetailModal client={modal.payload} orders={orders.filter(o => o.clientId === modal.payload.id)} payments={payments.filter(p => p.clientId === modal.payload.id)} onClose={() => setModal(null)} />}
      {modal?.type === "bl" && <BLModal order={modal.payload} onClose={() => setModal(null)} />}
    </div>
  );
}

const btnStyle = (bg, color="white") => ({ background: bg, color, border: "none", borderRadius: 7, padding: "8px 16px", cursor: "pointer", fontSize: 13, fontWeight: 600 });
const btnSmall = (bg, color="inherit") => ({ background: color === "inherit" ? "transparent" : bg, color: color === "inherit" ? bg : color, border: `1px solid ${bg}`, borderRadius: 6, padding: "5px 10px", cursor: "pointer", fontSize: 12 });

function Modal({ title, onClose, children, wide }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 16 }}>
      <div style={{ background: "white", borderRadius: 12, width: "100%", maxWidth: wide ? 800 : 500, maxHeight: "92vh", overflowY: "auto" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, background: "white", zIndex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{title}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#888" }}>×</button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}

const inputStyle = { width: "100%", padding: "8px 10px", border: "1px solid #ddd", borderRadius: 7, fontSize: 14, boxSizing: "border-box" };
function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 13 }}>
      <label style={{ fontSize: 12, color: "#777", display: "block", marginBottom: 4, fontWeight: 600 }}>{label}</label>
      {children}
    </div>
  );
}

function ProductModal({ product, onClose, onSave }) {
  const [f, setF] = useState(product || { ref: "", name: "", puctn: "", qteParCtn: "", pu: "" });
  const s = (k, v) => setF(x => ({ ...x, [k]: v }));
  return (
    <Modal title={product ? "Modifier produit" : "Nouveau produit"} onClose={onClose}>
      <Field label="Référence"><input value={f.ref} onChange={e => s("ref", e.target.value)} style={inputStyle} /></Field>
      <Field label="Nom article"><input value={f.name} onChange={e => s("name", e.target.value)} style={inputStyle} /></Field>
      <Field label="Prix par carton (DH)"><input type="number" value={f.puctn} onChange={e => s("puctn", parseFloat(e.target.value))} style={inputStyle} /></Field>
      <Field label="Quantité pièces / carton"><input type="number" value={f.qteParCtn} onChange={e => s("qteParCtn", parseInt(e.target.value))} style={inputStyle} /></Field>
      <Field label="Prix unitaire pièce (DH)"><input type="number" value={f.pu} onChange={e => s("pu", parseFloat(e.target.value))} style={inputStyle} /></Field>
      <button onClick={() => onSave(f)} style={{ ...btnStyle("#8B1A1A"), width: "100%", padding: "10px", marginTop: 4 }}>Enregistrer</button>
    </Modal>
  );
}

function ClientModal({ client, onClose, onSave }) {
  const [f, setF] = useState(client || { name: "", phone: "" });
  return (
    <Modal title={client ? "Modifier client" : "Nouveau client"} onClose={onClose}>
      <Field label="Nom complet"><input value={f.name} onChange={e => setF(x => ({ ...x, name: e.target.value }))} style={inputStyle} /></Field>
      <Field label="Téléphone"><input value={f.phone} onChange={e => setF(x => ({ ...x, phone: e.target.value }))} style={inputStyle} /></Field>
      <button onClick={() => onSave(f)} style={{ ...btnStyle("#8B1A1A"), width: "100%", padding: "10px", marginTop: 4 }}>Enregistrer</button>
    </Modal>
  );
}

function OrderModal({ products, clients, onClose, onSave }) {
  const [clientId, setClientId] = useState(clients[0]?.id || "");
  const [items, setItems] = useState([{ productId: products[0]?.id, ctn: 1 }]);
  const [avance, setAvance] = useState(0);

  const client = clients.find(c => c.id === parseInt(clientId));
  const ancienCredit = client?.solde || 0;

  const computed = items.map(item => {
    const p = products.find(x => x.id === parseInt(item.productId));
    if (!p) return { ...item, qte: 0, mt: 0, name: "?", puctn: 0, pu: 0 };
    return { ...item, qte: p.qteParCtn * item.ctn, mt: p.puctn * item.ctn, name: p.name, puctn: p.puctn, pu: p.pu };
  });

  const venteEnCours = computed.reduce((s, i) => s + i.mt, 0);
  const impayeTotal = venteEnCours + ancienCredit - (parseFloat(avance) || 0);

  return (
    <Modal title="Nouvelle commande" onClose={onClose} wide>
      <Field label="Client">
        <select value={clientId} onChange={e => setClientId(e.target.value)} style={inputStyle}>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name} — crédit: {c.solde.toLocaleString("fr-FR")} DH</option>)}
        </select>
      </Field>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Articles</div>
      <div style={{ background: "#fafafa", borderRadius: 8, padding: 12, marginBottom: 12 }}>
        {computed.map((item, idx) => (
          <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 70px 1fr 36px", gap: 8, marginBottom: 8, alignItems: "center" }}>
            <select value={item.productId} onChange={e => setItems(it => it.map((x,j) => j===idx ? {...x, productId: e.target.value} : x))} style={{ ...inputStyle, fontSize: 12 }}>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <input type="number" min="1" value={item.ctn} onChange={e => setItems(it => it.map((x,j) => j===idx ? {...x, ctn: parseInt(e.target.value)||1} : x))} style={{ ...inputStyle, textAlign: "center" }} placeholder="CTN" />
            <div style={{ fontSize: 12, color: "#555", background: "white", border: "1px solid #eee", borderRadius: 7, padding: "8px 10px" }}>
              {item.qte} pcs · <strong>{item.mt.toLocaleString("fr-FR")} DH</strong>
            </div>
            <button onClick={() => setItems(it => it.filter((_,j) => j !== idx))} style={{ background: "none", border: "1px solid #fcc", borderRadius: 6, padding: "7px", cursor: "pointer", color: "#c00" }}>×</button>
          </div>
        ))}
        <button onClick={() => setItems(it => [...it, { productId: products[0]?.id, ctn: 1 }])} style={{ background: "none", border: "1px dashed #ccc", borderRadius: 7, padding: "6px 14px", cursor: "pointer", fontSize: 13, color: "#888" }}>+ Ajouter article</button>
      </div>
      <Field label="Avance reçue (DH)"><input type="number" min="0" value={avance} onChange={e => setAvance(e.target.value)} style={inputStyle} /></Field>
      <div style={{ background: "#fff8f8", border: "1px solid #f0d0d0", borderRadius: 8, padding: 14, marginBottom: 16 }}>
        {[["Vente en cours", venteEnCours], ["Ancien crédit compte", ancienCredit], ["Avance", parseFloat(avance)||0]].map(([l,v]) => (
          <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
            <span style={{ color: "#666" }}>{l}</span><span>{v.toLocaleString("fr-FR")} DH</span>
          </div>
        ))}
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, color: "#8B1A1A", borderTop: "1px solid #e0c0c0", paddingTop: 8, marginTop: 6, fontSize: 14 }}>
          <span>Impayé Total</span><span>{impayeTotal.toLocaleString("fr-FR")} DH</span>
        </div>
      </div>
      <button onClick={() => onSave({ clientId: parseInt(clientId), clientName: client?.name || "", items: computed, total: venteEnCours, ancienCredit, avance: parseFloat(avance)||0, impayeTotal, date: new Date().toLocaleString("fr-FR") })}
        style={{ ...btnStyle("#8B1A1A"), width: "100%", padding: "11px", fontSize: 14 }}>Générer le Bon de Livraison</button>
    </Modal>
  );
}

function PaymentModal({ client, payments, onClose, onSave }) {
  const [montant, setMontant] = useState("");
  return (
    <Modal title={`Paiement — ${client.name}`} onClose={onClose}>
      <div style={{ background: "#fff0f0", borderRadius: 8, padding: 14, marginBottom: 16, textAlign: "center" }}>
        <div style={{ fontSize: 12, color: "#999" }}>Solde impayé actuel</div>
        <div style={{ fontSize: 26, fontWeight: 700, color: "#8B1A1A" }}>{client.solde.toLocaleString("fr-FR")} DH</div>
      </div>
      {payments.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Historique paiements</div>
          <div style={{ maxHeight: 150, overflowY: "auto" }}>
            {payments.map((p, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "5px 0", borderBottom: "0.5px solid #f0f0f0" }}>
                <span style={{ color: "#888" }}>{p.date}</span>
                <span style={{ fontWeight: 700, color: "#1a7a4a" }}>+{p.montant.toLocaleString("fr-FR")} DH</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <Field label="Montant reçu (DH)"><input type="number" value={montant} onChange={e => setMontant(e.target.value)} placeholder="0.00" style={{ ...inputStyle, fontSize: 16 }} /></Field>
      <button onClick={() => onSave(client.id, parseFloat(montant)||0)} style={{ ...btnStyle("#1a5fa8"), width: "100%", padding: "11px", marginTop: 4 }}>Confirmer paiement</button>
    </Modal>
  );
}

function ClientDetailModal({ client, orders, payments, onClose }) {
  const totalCmd = orders.reduce((s,o) => s+o.total, 0);
  const totalPay = payments.reduce((s,p) => s+p.montant, 0);
  return (
    <Modal title={`Fiche — ${client.name}`} onClose={onClose} wide>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 20 }}>
        {[
          { label: "Solde impayé", value: client.solde.toLocaleString("fr-FR")+" DH", color: "#8B1A1A" },
          { label: "Total commandé", value: totalCmd.toLocaleString("fr-FR")+" DH", color: "#1a5fa8" },
          { label: "Total payé", value: totalPay.toLocaleString("fr-FR")+" DH", color: "#1a7a4a" },
        ].map(c => (
          <div key={c.label} style={{ background: "#fafafa", borderRadius: 8, padding: 12, textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#999" }}>{c.label}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: c.color, marginTop: 4 }}>{c.value}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Commandes</div>
      <div style={{ maxHeight: 180, overflowY: "auto", marginBottom: 16 }}>
        {orders.length === 0 ? <div style={{ color: "#bbb", fontSize: 13 }}>Aucune commande</div> : orders.map(o => (
          <div key={o.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: "0.5px solid #f5f5f5" }}>
            <span>BL #{String(o.bonNo).padStart(3,"0")} · {o.date}</span>
            <span style={{ fontWeight: 600 }}>{o.total.toLocaleString("fr-FR")} DH</span>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Paiements</div>
      <div style={{ maxHeight: 160, overflowY: "auto" }}>
        {payments.length === 0 ? <div style={{ color: "#bbb", fontSize: 13 }}>Aucun paiement</div> : payments.map((p,i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: "0.5px solid #f5f5f5" }}>
            <span style={{ color: "#888" }}>{p.date}</span>
            <span style={{ fontWeight: 700, color: "#1a7a4a" }}>+{p.montant.toLocaleString("fr-FR")} DH</span>
          </div>
        ))}
      </div>
    </Modal>
  );
}

function StatsPage({ orders, clients, payments }) {
  const totalCA = orders.reduce((s,o) => s+o.total, 0);
  const totalPay = payments.reduce((s,p) => s+p.montant, 0);
  const totalImpaye = clients.reduce((s,c) => s+c.solde, 0);
  const caByClient = clients.map(c => ({
    name: c.name,
    ca: orders.filter(o => o.clientId === c.id).reduce((s,o) => s+o.total, 0),
    paye: payments.filter(p => p.clientId === c.id).reduce((s,p) => s+p.montant, 0),
    solde: c.solde
  })).filter(x => x.ca > 0).sort((a,b) => b.ca-a.ca);
  const maxCA = Math.max(...caByClient.map(x => x.ca), 1);

  return (
    <div>
      <h2 style={{ margin: "0 0 16px", fontSize: 17 }}>Statistiques</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px,1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Chiffre d'affaires", value: totalCA.toLocaleString("fr-FR")+" DH", color: "#1a5fa8" },
          { label: "Total encaissé", value: totalPay.toLocaleString("fr-FR")+" DH", color: "#1a7a4a" },
          { label: "Total impayé", value: totalImpaye.toLocaleString("fr-FR")+" DH", color: "#8B1A1A" },
          { label: "Nb commandes", value: orders.length, color: "#555" },
        ].map(c => (
          <div key={c.label} style={{ background: "white", border: "0.5px solid #ddd", borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ fontSize: 11, color: "#999", marginBottom: 6 }}>{c.label}</div>
            <div style={{ fontSize: 19, fontWeight: 700, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>
      <div style={{ background: "white", border: "0.5px solid #ddd", borderRadius: 10, padding: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>CA par client</div>
        {caByClient.length === 0 ? <div style={{ color: "#bbb" }}>Aucune donnée</div> : caByClient.map(x => (
          <div key={x.name} style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
              <span style={{ fontWeight: 600 }}>{x.name}</span>
              <span style={{ color: "#555" }}>{x.ca.toLocaleString("fr-FR")} DH</span>
            </div>
            <div style={{ background: "#f0f0f0", borderRadius: 20, height: 10, overflow: "hidden" }}>
              <div style={{ width: `${(x.ca/maxCA)*100}%`, background: "#8B1A1A", height: "100%", borderRadius: 20 }} />
            </div>
            <div style={{ display: "flex", gap: 16, marginTop: 4, fontSize: 11, color: "#999" }}>
              <span style={{ color: "#1a7a4a" }}>Payé: {x.paye.toLocaleString("fr-FR")} DH</span>
              <span style={{ color: "#8B1A1A" }}>Restant: {x.solde.toLocaleString("fr-FR")} DH</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BLModal({ order, onClose }) {
  const totalCtn = order.items.reduce((s,i) => s+parseInt(i.ctn), 0);
  const totalPcs = order.items.reduce((s,i) => s+i.qte, 0);
  const emptyRows = Math.max(0, 10 - order.items.length);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 16 }}>
      <div style={{ background: "white", borderRadius: 12, width: "100%", maxWidth: 700, maxHeight: "94vh", overflowY: "auto" }}>
        <div style={{ padding: "10px 20px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center", background: "white", position: "sticky", top: 0 }}>
          <button onClick={() => window.print()} style={btnStyle("#8B1A1A")}>🖨 Imprimer / PDF</button>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: "#888" }}>×</button>
        </div>
        <div style={{ padding: "28px 40px", fontFamily: "Arial, sans-serif", fontSize: 13, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "35%", left: "50%", transform: "translate(-50%,-50%) rotate(-15deg)", fontSize: 90, fontWeight: 900, fontStyle: "italic", color: "rgba(139,26,26,0.07)", pointerEvents: "none", whiteSpace: "nowrap", zIndex: 0 }}>Diana</div>
          <div style={{ textAlign: "center", marginBottom: 6, position: "relative", zIndex: 1 }}>
            <div style={{ fontSize: 38, fontWeight: 900, fontStyle: "italic", color: "#8B1A1A", letterSpacing: 3, fontFamily: "Georgia, serif" }}>Diana</div>
            <div style={{ fontSize: 11, letterSpacing: 6, color: "#888", marginTop: 2 }}>BON DE LIVRAISON</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, margin: "16px 0", position: "relative", zIndex: 1 }}>
            <div style={{ border: "1px solid #ccc", borderRadius: 4, padding: "10px 14px" }}>
              <div style={{ color: "#555" }}>BON No. &nbsp;<strong>{String(order.bonNo).padStart(3,"0")}</strong></div>
              <div style={{ color: "#555", marginTop: 4 }}>Date: &nbsp;{order.date}</div>
            </div>
            <div style={{ border: "1px solid #ccc", borderRadius: 4, padding: "10px 14px" }}>
              <div style={{ fontSize: 10, color: "#aaa" }}>Client:</div>
              <div style={{ fontWeight: 700, fontSize: 15, marginTop: 2 }}>{order.clientName}</div>
            </div>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, position: "relative", zIndex: 1 }}>
            <thead>
              <tr style={{ background: "#7a7a7a" }}>
                {["#","CTN","PU(CTN)","Articles","Qté","PU","MT"].map((h,i) => (
                  <th key={h} style={{ padding: "7px 8px", textAlign: i===3?"left":"center", color: "white", fontWeight: 700, border: "1px solid #999" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, idx) => (
                <tr key={idx} style={{ background: idx%2===0?"#f9f9f9":"white" }}>
                  <td style={{ padding: "7px 8px", textAlign: "center", border: "1px solid #e5e5e5" }}>{idx+1}</td>
                  <td style={{ padding: "7px 8px", textAlign: "center", border: "1px solid #e5e5e5" }}>{item.ctn}</td>
                  <td style={{ padding: "7px 8px", textAlign: "center", border: "1px solid #e5e5e5" }}>{item.puctn?.toFixed(2)}</td>
                  <td style={{ padding: "7px 8px", border: "1px solid #e5e5e5" }}>{item.name}</td>
                  <td style={{ padding: "7px 8px", textAlign: "center", border: "1px solid #e5e5e5" }}>{item.qte}</td>
                  <td style={{ padding: "7px 8px", textAlign: "center", border: "1px solid #e5e5e5" }}>{item.pu}</td>
                  <td style={{ padding: "7px 8px", textAlign: "center", border: "1px solid #e5e5e5" }}>{item.mt?.toFixed(2)}</td>
                </tr>
              ))}
              {Array(emptyRows).fill(0).map((_,i) => (
                <tr key={`e${i}`} style={{ background: (order.items.length+i)%2===0?"#f9f9f9":"white" }}>
                  {[1,2,3,4,5,6,7].map(j => <td key={j} style={{ padding: "7px 8px", height: 28, border: "1px solid #e5e5e5" }}>&nbsp;</td>)}
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, border: "1px solid #e5e5e5", borderTop: "2px solid #999", padding: "7px 10px", background: "#f5f5f5", marginBottom: 16, position: "relative", zIndex: 1 }}>
            <span><strong>Total CTN: {totalCtn.toFixed(2)}</strong></span>
            <span><strong>Total P: {totalPcs}</strong></span>
            <span><strong>Nombre articles: {order.items.length}</strong></span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, position: "relative", zIndex: 1 }}>
            <div style={{ border: "1px solid #ddd", borderRadius: 4, overflow: "hidden" }}>
              {[["Vente en cours", order.total, false],["Ancien Credit compte", order.ancienCredit||0, false],["AVANCE", order.avance||0, false],["Impayé TOTAL", order.impayeTotal, true]].map(([l,v,bold]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "7px 12px", borderBottom: "0.5px solid #eee", background: bold?"#fff0f0":"white" }}>
                  <span style={{ fontWeight: bold?700:400, color: bold?"#8B1A1A":"#333", fontSize: bold?13:12 }}>{l}</span>
                  <span style={{ fontWeight: bold?700:400, color: bold?"#8B1A1A":"#333", fontSize: bold?13:12 }}>{(v||0).toFixed(2)} DH</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{ background: "#2a2a2a", color: "white", borderRadius: 8, padding: "14px 18px", textAlign: "center" }}>
                <div style={{ fontSize: 11, color: "#aaa", letterSpacing: 1 }}>NET A PAYER:</div>
                <div style={{ fontSize: 22, fontWeight: 900, marginTop: 4 }}>{(order.impayeTotal||order.total)?.toFixed(2)} DH</div>
              </div>
              <div style={{ textAlign: "center", marginTop: 10, fontSize: 12 }}>
                <span style={{ border: "1px solid #ccc", borderRadius: 20, padding: "4px 14px", color: "#555" }}>Tél : 0662712919</span>
              </div>
            </div>
          </div>
          <div style={{ textAlign: "center", marginTop: 24, fontSize: 11, color: "#aaa", letterSpacing: 1 }}>Merci pour Votre Visite</div>
        </div>
      </div>
    </div>
  );
}
