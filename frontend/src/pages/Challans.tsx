import { useState, useEffect } from 'react';
import api from '../utils/api';
import '../components/DataTable.css';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Customer { id: number; name: string; businessName?: string; address?: string; gst?: string; }
interface Product { id: number; name: string; sku: string; unitPrice: number; currentStock: number; }
interface ChallanItem { id?: number; snapshotName: string; quantity: number; snapshotPrice: number; productId: number; }
interface Challan {
  id: number;
  challanNo: string;
  status: string;
  totalQty: number;
  createdAt: string;
  customerId: number;
  customer: Customer;
  items: ChallanItem[];
}

export default function Challans() {
  const [challans, setChallans] = useState<Challan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Confirm modal state
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [confirmingChallanNo, setConfirmingChallanNo] = useState('');
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Result modal state
  const [resultModal, setResultModal] = useState<{ open: boolean; success: boolean; message: string }>({ open: false, success: true, message: '' });

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const role = localStorage.getItem('role') || '';
  const canEdit = ['ADMIN', 'SALES'].includes(role);

  // Form State
  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState([{ productId: '', quantity: 1 }]);

  const fetchData = async (page = 1) => {
    try {
      setLoading(true);
      const [challansRes, customersRes, productsRes] = await Promise.all([
        api.get(`/challans?page=${page}&limit=10`),
        api.get('/customers?limit=100'),
        api.get('/products?limit=100')
      ]);
      setChallans(challansRes.data.data);
      setCurrentPage(challansRes.data.meta.page);
      setTotalPages(challansRes.data.meta.totalPages);
      setCustomers(customersRes.data.data);
      setProducts(productsRes.data.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(currentPage).catch(() => setChallans([]));
  }, [currentPage]);

  const handleAddItem = () => {
    setItems([...items, { productId: '', quantity: 1 }]);
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const handleSubmitDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Frontend Validation
    for (const item of items) {
      const product = products.find(p => p.id === Number(item.productId));
      if (product && Number(item.quantity) > product.currentStock) {
        alert(`Cannot create draft: Quantity for ${product.name} exceeds current stock (${product.currentStock}).`);
        return;
      }
    }

    try {
      const formattedItems = items.map(item => {
        const product = products.find(p => p.id === Number(item.productId));
        return {
          productId: Number(item.productId),
          quantity: Number(item.quantity),
          snapshotName: product?.name,
          snapshotSku: product?.sku,
          snapshotPrice: product?.unitPrice
        };
      });

      const payload = {
        challanNo: `CH-${Date.now().toString().slice(-6)}`,
        customerId: Number(customerId),
        createdBy: 'admin@erp.com',
        items: formattedItems
      };

      await api.post('/challans', payload);
      setIsModalOpen(false);
      setCustomerId('');
      setItems([{ productId: '', quantity: 1 }]);
      fetchData(currentPage);
    } catch (error: any) {
      alert(error.response?.data?.details?.[0]?.message || error.response?.data?.error || 'Failed to create challan draft');
    }
  };

  const openConfirmModal = (challan: Challan) => {
    setConfirmingId(challan.id);
    setConfirmingChallanNo(challan.challanNo);
    setConfirmModalOpen(true);
  };

  const handleConfirmChallan = async () => {
    if (!confirmingId) return;
    setConfirmLoading(true);
    try {
      await api.put(`/challans/${confirmingId}/confirm`, { email: localStorage.getItem('email') || 'admin@erp.com' });
      setConfirmModalOpen(false);
      setConfirmingId(null);
      fetchData(currentPage);
      setResultModal({ open: true, success: true, message: `Challan #${confirmingChallanNo} confirmed successfully! Stock has been deducted.` });
    } catch (error: any) {
      setConfirmModalOpen(false);
      setResultModal({ open: true, success: false, message: error.response?.data?.error || 'Failed to confirm challan. Check stock levels.' });
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleExportPDF = (challan: Challan) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header styling (Indigo background)
    doc.setFillColor(99, 102, 241);
    doc.rect(0, 0, pageWidth, 28, 'F');
    
    // Header text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('ORBIT CRM', 14, 19);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('SALES CHALLAN / INVOICE', pageWidth - 14, 18, { align: 'right' });
    
    // Reset text color for body
    doc.setTextColor(30, 30, 45);

    // Customer Info (Left)
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', 14, 45);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${challan.customer.name}`, 14, 52);
    if (challan.customer.businessName) doc.text(`${challan.customer.businessName}`, 14, 58);
    if (challan.customer.address) doc.text(`${challan.customer.address}`, 14, 64);
    if (challan.customer.gst) doc.text(`GST No: ${challan.customer.gst}`, 14, 70);

    // Challan Info (Right)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Challan Details', pageWidth - 14, 45, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 90);
    doc.text(`Challan No: ${challan.challanNo}`, pageWidth - 14, 52, { align: 'right' });
    doc.text(`Date: ${new Date(challan.createdAt).toLocaleDateString()}`, pageWidth - 14, 58, { align: 'right' });
    doc.text(`Status: ${challan.status}`, pageWidth - 14, 64, { align: 'right' });
    
    // Reset color
    doc.setTextColor(30, 30, 45);

    // Table
    const tableColumn = ["Item Description", "Quantity", "Unit Price", "Total"];
    const tableRows: any[] = [];
    
    let grandTotal = 0;
    challan.items.forEach(item => {
      const itemTotal = item.quantity * item.snapshotPrice;
      grandTotal += itemTotal;
      tableRows.push([
        item.snapshotName,
        item.quantity,
        `Rs. ${item.snapshotPrice.toFixed(2)}`,
        `Rs. ${itemTotal.toFixed(2)}`
      ]);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 85,
      theme: 'grid',
      headStyles: {
        fillColor: [99, 102, 241],
        textColor: 255,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 40, halign: 'right' },
        3: { cellWidth: 40, halign: 'right' }
      },
      styles: {
        fontSize: 9,
        cellPadding: 4,
      }
    });

    // Grand Total Section
    const finalY = (doc as any).lastAutoTable.finalY || 85;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Grand Total:', pageWidth - 50, finalY + 12, { align: 'right' });
    doc.text(`Rs. ${grandTotal.toFixed(2)}`, pageWidth - 14, finalY + 12, { align: 'right' });
    
    // Divider line
    doc.setDrawColor(220, 225, 236);
    doc.line(14, finalY + 25, pageWidth - 14, finalY + 25);

    // Footer
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 130);
    doc.text('Thank you for your business!', 14, finalY + 40);
    
    doc.setTextColor(30, 30, 45);
    doc.setFont('helvetica', 'bold');
    doc.text('Authorized Signatory', pageWidth - 14, finalY + 40, { align: 'right' });
    doc.setDrawColor(180, 180, 190);
    doc.line(pageWidth - 55, finalY + 34, pageWidth - 14, finalY + 34); // Signature line

    doc.save(`${challan.challanNo}.pdf`);
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Sales Challans</h2>
        {canEdit && <button className="btn" onClick={() => setIsModalOpen(true)}>+ Create Challan</button>}
      </div>

      <div className="card">
        {loading ? (
          <p>Loading challans...</p>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Challan No</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Total Qty</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {challans.map((challan) => (
                  <tr key={challan.id}>
                    <td><strong>{challan.challanNo}</strong></td>
                    <td>{challan.customer?.name || `Customer #${challan.customerId}`}</td>
                    <td>{new Date(challan.createdAt).toLocaleDateString()}</td>
                    <td>{challan.totalQty}</td>
                    <td>
                      <span className={`stock-badge ${challan.status === 'DRAFT' ? 'low' : ''}`}>
                        {challan.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {challan.status === 'DRAFT' && canEdit && (
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                            onClick={() => openConfirmModal(challan)}
                          >
                            Confirm
                          </button>
                        )}
                        {challan.status === 'CONFIRMED' && (
                          <button 
                            className="btn" 
                            style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}
                            onClick={() => handleExportPDF(challan)}
                          >
                            Export PDF
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {challans.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center' }}>No challans found. Create a draft to get started.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        
        {!loading && totalPages > 1 && (
          <div className="pagination-controls">
            <button className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }} disabled={currentPage === 1} onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}>← Previous</button>
            <span>Page {currentPage} of {totalPages}</span>
            <button className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }} disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}>Next →</button>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="card modal-content" style={{ maxWidth: '600px' }}>
            <h3 style={{ marginTop: 0 }}>Create Draft Challan</h3>
            <form onSubmit={handleSubmitDraft}>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label>Select Customer</label>
                <select required className="form-input" value={customerId} onChange={e => setCustomerId(e.target.value)}>
                  <option value="" disabled>Choose a customer...</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1rem', fontWeight: 500, color: 'var(--text-muted)' }}>Products</div>
              {items.map((item, index) => {
                const selectedProduct = products.find(p => p.id === Number(item.productId));
                const isOverStock = selectedProduct ? item.quantity > selectedProduct.currentStock : false;

                return (
                  <div key={index} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'flex-start' }}>
                    <div className="form-group" style={{ flex: 2 }}>
                      <label style={{ fontSize: '0.75rem' }}>Product</label>
                      <select required className="form-input" value={item.productId} onChange={e => handleItemChange(index, 'productId', e.target.value)}>
                        <option value="" disabled>Select product...</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} (Stock: {p.currentStock})</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.75rem' }}>Quantity</label>
                      <input 
                        required 
                        type="number" 
                        min="1" 
                        className={`form-input ${isOverStock ? 'error' : ''}`} 
                        style={isOverStock ? { borderColor: '#ef4444' } : {}}
                        value={item.quantity} 
                        onChange={e => handleItemChange(index, 'quantity', e.target.value)} 
                      />
                      {isOverStock && <span style={{ color: '#ef4444', fontSize: '0.7rem' }}>Exceeds stock!</span>}
                    </div>
                    {items.length > 1 && (
                      <button type="button" className="btn btn-secondary" onClick={() => handleRemoveItem(index)} style={{ padding: '0.75rem', marginTop: '1.25rem' }}>
                        X
                      </button>
                    )}
                  </div>
                );
              })}
              
              <button type="button" className="btn btn-secondary" onClick={handleAddItem} style={{ width: '100%', marginBottom: '1.5rem' }}>
                + Add Another Product
              </button>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn">Save as Draft</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Challan Modal */}
      {confirmModalOpen && (
        <div className="modal-overlay">
          <div className="card modal-content" style={{ maxWidth: '420px', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, backgroundColor: 'var(--accent-amber-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent-amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>Confirm Challan</h3>
            <p style={{ margin: '0 0 0.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              You are about to confirm challan <strong style={{ color: 'var(--text-main)' }}>#{confirmingChallanNo}</strong>.
            </p>
            <p style={{ margin: '0 0 1.5rem', fontSize: '0.8rem', color: 'var(--accent-amber)', fontWeight: 600 }}>
              ⚠ Stock will be permanently deducted. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={() => { setConfirmModalOpen(false); setConfirmingId(null); }} disabled={confirmLoading} style={{ flex: 1 }}>
                Cancel
              </button>
              <button className="btn" onClick={handleConfirmChallan} disabled={confirmLoading} style={{ flex: 1, backgroundColor: 'var(--accent-green)' }}>
                {confirmLoading ? 'Confirming...' : 'Yes, Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result Modal (Success / Error) */}
      {resultModal.open && (
        <div className="modal-overlay">
          <div className="card modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              backgroundColor: resultModal.success ? 'var(--accent-green-light)' : 'var(--accent-rose-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              {resultModal.success ? (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent-green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent-rose)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              )}
            </div>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {resultModal.success ? 'Success!' : 'Error'}
            </h3>
            <p style={{ margin: '0 0 1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {resultModal.message}
            </p>
            <button className="btn" onClick={() => setResultModal({ open: false, success: true, message: '' })} style={{ width: '100%' }}>
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}