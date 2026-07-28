import { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import '../components/DataTable.css';

interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  unitPrice: number;
  currentStock: number;
  minStock: number;
  location: string | null;
  imageUrl: string | null;
}

interface Movement {
  id: number;
  quantity: number;
  type: string;
  reason: string;
  createdBy: string;
  timestamp: string;
  product: Product;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMovementsModalOpen, setIsMovementsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [currentProductPage, setCurrentProductPage] = useState(1);
  const [totalProductPages, setTotalProductPages] = useState(1);

  const [currentMovementPage, setCurrentMovementPage] = useState(1);
  const [totalMovementPages, setTotalMovementPages] = useState(1);

  const role = localStorage.getItem('role') || '';
  const canEdit = ['ADMIN', 'WAREHOUSE'].includes(role);
  
  const [formData, setFormData] = useState({
    name: '', sku: '', category: '', unitPrice: '', currentStock: '', minStock: '10', location: ''
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProducts = async (page = 1) => {
    try {
      const response = await api.get(`/products?page=${page}&limit=10`);
      setProducts(response.data.data);
      setCurrentProductPage(response.data.meta.page);
      setTotalProductPages(response.data.meta.totalPages);
    } catch (error) {
      console.error('Failed to fetch products', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMovements = async (page = 1) => {
    try {
      const response = await api.get(`/movements?page=${page}&limit=10`);
      setMovements(response.data.data);
      setCurrentMovementPage(response.data.meta.page);
      setTotalMovementPages(response.data.meta.totalPages);
    } catch (error) {
      console.error('Failed to fetch movements', error);
    }
  };

  useEffect(() => {
    fetchProducts(currentProductPage);
  }, [currentProductPage]);

  useEffect(() => {
    if (isMovementsModalOpen) {
      fetchMovements(currentMovementPage);
    }
  }, [isMovementsModalOpen, currentMovementPage]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ name: '', sku: '', category: '', unitPrice: '', currentStock: '', minStock: '10', location: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      sku: product.sku,
      category: product.category,
      unitPrice: product.unitPrice.toString(),
      currentStock: product.currentStock.toString(),
      minStock: product.minStock.toString(),
      location: product.location || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        unitPrice: parseFloat(formData.unitPrice),
        currentStock: parseInt(formData.currentStock, 10),
        minStock: parseInt(formData.minStock, 10)
      };

      let savedProduct;
      if (editingId) {
        const res = await api.put(`/products/${editingId}`, payload);
        savedProduct = res.data;
      } else {
        const res = await api.post('/products', payload);
        savedProduct = res.data;
      }

      // If an image was selected, upload it
      if (fileInputRef.current?.files?.[0]) {
        const formDataUpload = new FormData();
        formDataUpload.append('image', fileInputRef.current.files[0]);
        await api.post(`/products/${savedProduct.id}/image`, formDataUpload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      setIsModalOpen(false);
      fetchProducts(currentProductPage);
    } catch (error: any) {
      console.error('Error saving product', error);
      alert(error.response?.data?.details?.[0]?.message || 'Failed to save product. Check if SKU is unique.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Inventory Management</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className="btn btn-secondary" onClick={() => setIsMovementsModalOpen(true)}>View Movements Log</button>
          {canEdit && <button className="btn" onClick={handleOpenAdd}>+ Add Product</button>}
        </div>
      </div>

      <div className="card">
        {loading ? (
          <p>Loading products...</p>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Product Name</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Location</th>
                  <th>Unit Price</th>
                  <th>Stock Status</th>
                  {canEdit && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td>
                      {product.imageUrl ? (
                        <img src={`http://localhost:5000${product.imageUrl}`} alt={product.name} style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '8px' }} />
                      ) : (
                        <div style={{ width: '40px', height: '40px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem' }}>No Img</div>
                      )}
                    </td>
                    <td><strong>{product.name}</strong></td>
                    <td>{product.sku}</td>
                    <td>{product.category}</td>
                    <td>{product.location || 'N/A'}</td>
                    <td>₹{product.unitPrice.toFixed(2)}</td>
                    <td>
                      <span className={`stock-badge ${product.currentStock <= product.minStock ? 'low' : ''}`}>
                        {product.currentStock} in stock
                      </span>
                    </td>
                    {canEdit && (
                      <td>
                        <button className="btn btn-secondary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.78rem' }} onClick={() => handleOpenEdit(product)}>Edit</button>
                      </td>
                    )}
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={canEdit ? 8 : 7} style={{ textAlign: 'center' }}>No products found. Add one to get started.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        
        {!loading && totalProductPages > 1 && (
          <div className="pagination-controls">
            <button className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }} disabled={currentProductPage === 1} onClick={() => setCurrentProductPage(prev => Math.max(1, prev - 1))}>← Previous</button>
            <span>Page {currentProductPage} of {totalProductPages}</span>
            <button className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }} disabled={currentProductPage === totalProductPages} onClick={() => setCurrentProductPage(prev => Math.min(totalProductPages, prev + 1))}>Next →</button>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="card modal-content">
            <h3 style={{ marginTop: 0 }}>{editingId ? 'Edit Product' : 'Add New Product'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Product Name *</label>
                  <input required type="text" className="form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>SKU (Unique) *</label>
                  <input required type="text" className="form-input" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <input required type="text" className="form-input" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Unit Price (₹) *</label>
                  <input required type="number" step="0.01" className="form-input" value={formData.unitPrice} onChange={e => setFormData({...formData, unitPrice: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Current Stock</label>
                  <input required type="number" className="form-input" value={formData.currentStock} onChange={e => setFormData({...formData, currentStock: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Min Stock Alert</label>
                  <input required type="number" className="form-input" value={formData.minStock} onChange={e => setFormData({...formData, minStock: e.target.value})} />
                </div>
                <div className="form-group full-width">
                  <label>Location / Warehouse</label>
                  <input type="text" className="form-input" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="e.g. Aisle 4, Shelf B" />
                </div>
                <div className="form-group full-width">
                  <label>Product Image</label>
                  <input type="file" className="form-input" ref={fileInputRef} accept="image/*" />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isMovementsModalOpen && (
        <div className="modal-overlay">
          <div className="card modal-content" style={{ maxWidth: '700px' }}>
            <h3 style={{ marginTop: 0 }}>Stock Movement Log</h3>
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Product</th>
                    <th>Type</th>
                    <th>Qty</th>
                    <th>Reason</th>
                    <th>User</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((mov) => (
                    <tr key={mov.id}>
                      <td>{new Date(mov.timestamp).toLocaleString()}</td>
                      <td>{mov.product?.name}</td>
                      <td>
                        <span style={{ color: mov.type === 'IN' ? 'var(--accent-green)' : 'var(--accent-rose)', fontWeight: 600 }}>{mov.type}</span>
                      </td>
                      <td>{mov.quantity}</td>
                      <td>{mov.reason}</td>
                      <td>{mov.createdBy}</td>
                    </tr>
                  ))}
                  {movements.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center' }}>No movements logged.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {totalMovementPages > 1 && (
              <div className="pagination-controls">
                <button className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }} disabled={currentMovementPage === 1} onClick={() => setCurrentMovementPage(prev => Math.max(1, prev - 1))}>← Previous</button>
                <span>Page {currentMovementPage} of {totalMovementPages}</span>
                <button className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }} disabled={currentMovementPage === totalMovementPages} onClick={() => setCurrentMovementPage(prev => Math.min(totalMovementPages, prev + 1))}>Next →</button>
              </div>
            )}
            
            <div className="modal-actions" style={{ marginTop: '1rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsMovementsModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}