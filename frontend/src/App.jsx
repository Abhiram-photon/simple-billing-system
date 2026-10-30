import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Printer, RotateCcw, ReceiptText, Store, AlertCircle, CheckCircle2 } from 'lucide-react';

const money = value => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(value);
const today = () => new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export default function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [name, setName] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState('');
  const [generated, setGenerated] = useState(false);

  const loadProducts = () => {
    setLoading(true); setApiError('');
    fetch('/api/products').then(r => { if (!r.ok) throw new Error(`Server returned ${r.status}`); return r.json(); })
      .then(data => { setProducts(data); setLoading(false); if (!data.length) setApiError('No products are available yet. Check your database seed data.'); })
      .catch(() => { setApiError('Could not connect to the billing service. Make sure Spring Boot and MySQL are running, then try again.'); setLoading(false); });
  };
  useEffect(() => { loadProducts(); }, []);

  const chosen = products.find(p => String(p.id) === selectedId);
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);
  const discount = subtotal > 1000 ? Math.round(subtotal * 10) / 100 : 0;
  const total = subtotal - discount;
  const addItem = () => {
    setMessage('');
    const qty = Number(quantity);
    if (!chosen) { setMessage('Choose a product before adding it.'); return; }
    if (!Number.isInteger(qty) || qty <= 0) { setMessage('Quantity must be a positive whole number.'); return; }
    setItems(current => {
      const existing = current.find(item => item.id === chosen.id);
      return existing ? current.map(item => item.id === chosen.id ? { ...item, quantity: item.quantity + qty } : item) : [...current, { ...chosen, quantity: qty }];
    });
    setGenerated(false); setQuantity('1');
  };
  const updateQuantity = (id, raw) => {
    if (raw === '') { setItems(cur => cur.map(i => i.id === id ? { ...i, quantity: 1 } : i)); return; }
    const qty = Number(raw);
    if (Number.isInteger(qty) && qty > 0) { setItems(cur => cur.map(i => i.id === id ? { ...i, quantity: qty } : i)); setGenerated(false); }
  };
  const generate = () => {
    setMessage('');
    if (!name.trim()) { setMessage('Please enter the customer name to generate the bill.'); return; }
    if (!items.length) { setMessage('Add at least one product to generate a bill.'); return; }
    setGenerated(true);
  };
  const reset = () => { setName(''); setItems([]); setSelectedId(''); setQuantity('1'); setMessage(''); setGenerated(false); };
  const printBill = () => { if (!generated) { generate(); return; } window.print(); };

  return <div className="app-shell">
    <header className="topbar"><div className="brand-mark"><Store size={21}/></div><div className="brand-copy"><strong>My Shop</strong><span>RETAIL BILLING</span></div><div className="top-divider"/><div className="page-name">Shop Billing System</div><div className="top-status"><span className="status-dot"/> Billing desk</div></header>
    <main className="layout">
      <section className="workspace">
        <div className="intro"><div><div className="eyebrow">POINT OF SALE <span>•</span> NEW TRANSACTION</div><h1>Create a bill</h1><p>Add items to prepare a customer receipt.</p></div><div className="date-chip"><span>DATE</span><strong>{today()}</strong></div></div>
        {apiError && <div className="alert error"><AlertCircle size={18}/><span>{apiError}</span>{!loading && <button className="text-button" onClick={loadProducts}>Retry</button>}</div>}
        <div className="card customer-card"><div className="section-heading"><span className="step">01</span><div><h2>Customer details</h2><p>Who are we preparing this bill for?</p></div></div><label className="field-label" htmlFor="customer">Customer name <em>Required</em></label><input id="customer" className="text-input" value={name} onChange={e => { setName(e.target.value); setGenerated(false); }} placeholder="e.g. Priya Sharma" autoComplete="off"/></div>
        <div className="card add-card"><div className="section-heading"><span className="step">02</span><div><h2>Add products</h2><p>Select from your shop inventory.</p></div></div>
          <div className="product-form"><div className="product-select"><label className="field-label" htmlFor="product">Product</label><select id="product" className="text-input" value={selectedId} onChange={e => setSelectedId(e.target.value)} disabled={loading || products.length === 0}><option value="">{loading ? 'Loading products…' : 'Select a product'}</option>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div><div className="price-display"><label className="field-label">Unit price</label><div className="price-value">{chosen ? money(Number(chosen.price)) : '—'}</div></div><div className="quantity-field"><label className="field-label" htmlFor="quantity">Quantity</label><input id="quantity" className="text-input" type="number" min="1" step="1" value={quantity} onChange={e => setQuantity(e.target.value)} onKeyDown={e => e.key === 'Enter' && addItem()}/></div><button className="button primary add-button" onClick={addItem} disabled={!chosen}><Plus size={17}/> Add item</button></div>
        </div>
        <div className="items-area"><div className="items-title"><div><h2>Bill items <span className="count-badge">{items.length}</span></h2><p>Review quantities and line totals.</p></div></div>
          {items.length ? <div className="table-wrap"><table><thead><tr><th>PRODUCT</th><th>UNIT PRICE</th><th>QUANTITY</th><th className="align-right">ITEM TOTAL</th><th></th></tr></thead><tbody>{items.map(item => <tr key={item.id}><td><strong>{item.name}</strong><small>Product #{item.id}</small></td><td>{money(Number(item.price))}</td><td><input className="qty-input" type="number" min="1" step="1" value={item.quantity} aria-label={`${item.name} quantity`} onChange={e => updateQuantity(item.id, e.target.value)}/></td><td className="align-right line-total">{money(Number(item.price) * item.quantity)}</td><td><button className="icon-button" aria-label={`Remove ${item.name}`} onClick={() => { setItems(cur => cur.filter(i => i.id !== item.id)); setGenerated(false); }}><Trash2 size={16}/></button></td></tr>)}</tbody></table></div> : <div className="empty-state"><div className="empty-icon"><ReceiptText size={23}/></div><strong>No items added yet</strong><span>Choose a product above to start building this bill.</span></div>}
        </div>
        {message && <div className="alert validation"><AlertCircle size={17}/>{message}</div>}
        <div className="actions"><button className="button secondary" onClick={reset}><RotateCcw size={16}/> New bill</button><div className="action-right"><button className="button secondary" onClick={printBill} disabled={!generated}><Printer size={16}/> Print bill</button><button className="button primary generate-button" onClick={generate}>Generate bill <span>→</span></button></div></div>
      </section>
      <aside className="summary-column"><div className="summary-card"><div className="summary-header"><div className="summary-icon"><ReceiptText size={19}/></div><div><h2>Bill summary</h2><span>LIVE CALCULATION</span></div><span className="live-indicator"/></div><div className="summary-body"><div className="summary-person"><div className="avatar">{name.trim() ? name.trim()[0].toUpperCase() : '—'}</div><div><small>BILLING TO</small><strong>{name.trim() || 'Customer name'}</strong></div></div><div className="summary-date"><span>Bill date</span><strong>{today()}</strong></div><div className="summary-divider"/><div className="sum-row"><span>Subtotal <small>({items.length} {items.length === 1 ? 'item' : 'items'})</small></span><strong>{money(subtotal)}</strong></div><div className="sum-row"><span>Discount {subtotal > 1000 && <small className="discount-tag">10%</small>}</span><strong className={discount ? 'discount-amount' : ''}>− {money(discount)}</strong></div><div className="summary-divider lower"/><div className="total-label">TOTAL AMOUNT DUE</div><div className="total-amount">{money(total)}</div><div className="discount-note">{subtotal > 1000 ? <><CheckCircle2 size={14}/> 10% discount applied</> : <span>10% discount on bills over ₹1,000</span>}</div></div><div className="summary-footer"><span>Thank you for shopping with us</span><span>MY SHOP&nbsp; · &nbsp;{today().toUpperCase()}</span></div></div>
        <div className="tip-card"><div className="tip-bulb">✦</div><div><strong>Quick tip</strong><p>A 10% discount is automatically applied when the subtotal is over ₹1,000.</p></div></div>
      </aside>
    </main>
    {generated && <div className="print-receipt"><div className="receipt-top"><Store size={22}/><div><h1>My Shop</h1><span>SHOP BILLING SYSTEM</span></div></div><div className="receipt-meta"><span>DATE <b>{today()}</b></span><span>CUSTOMER <b>{name.trim()}</b></span></div><table><thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>{items.map(item => <tr key={item.id}><td>{item.name}</td><td>{item.quantity}</td><td>{money(Number(item.price))}</td><td>{money(Number(item.price) * item.quantity)}</td></tr>)}</tbody></table><div className="receipt-totals"><div><span>Subtotal</span><b>{money(subtotal)}</b></div><div><span>Discount {discount ? '(10%)' : ''}</span><b>− {money(discount)}</b></div><div className="receipt-grand"><span>Amount payable</span><b>{money(total)}</b></div></div><p className="receipt-thanks">Thank you for shopping with us!</p></div>}
  </div>;
}
