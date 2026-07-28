import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import '../components/DataTable.css';

interface Customer {
  id: number;
  name: string;
  mobile: string;
  email: string | null;
  businessName: string | null;
  gst: string | null;
  type: string;
  address: string | null;
  status: string;
  notes: string | null;
  followUpDate: string | null;
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const role = localStorage.getItem('role') || '';
  const canEdit = ['ADMIN', 'SALES'].includes(role);
  
  const [formData, setFormData] = useState({
    name: '', mobile: '', email: '', businessName: '', gst: '',
    address: '', type: 'RETAIL', status: 'LEAD'
  });

  const fetchCustomers = async (search = '', page = 1) => {
    try {
      const response = await api.get(`/customers?page=${page}&limit=10${search ? `&search=${search}` : ''}`);
      setCustomers(response.data.data);
      setCurrentPage(response.data.meta.page);
      setTotalPages(response.data.meta.totalPages);
    } catch (error) {
      console.error('Failed to fetch customers', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(searchTerm, currentPage);
  }, [searchTerm, currentPage]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({ name: '', mobile: '', email: '', businessName: '', gst: '', address: '', type: 'RETAIL', status: 'LEAD' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setEditingId(customer.id);
    setFormData({
      name: customer.name,
      mobile: customer.mobile,
      email: customer.email || '',
      businessName: customer.businessName || '',
      gst: customer.gst || '',
      address: customer.address || '',
      type: customer.type,
      status: customer.status
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/customers/${editingId}`, formData);
      } else {
        await api.post('/customers', formData);
      }
      setIsModalOpen(false);
      fetchCustomers(searchTerm, currentPage);
    } catch (error: any) {
      console.error('Error saving customer', error);
      alert(error.response?.data?.details?.[0]?.message || 'Failed to save customer.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Customer CRM</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <input 
            type="text" 
            placeholder="Search name or mobile..." 
            className="form-input" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '250px' }}
          />
          {canEdit && <button className="btn" onClick={handleOpenAdd}>+ Add Customer</button>}
        </div>
      </div>

      <div className="card">
        {loading ? (
          <p>Loading customers...</p>
        ) : (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Mobile</th>
                  <th>Business / Email</th>
                  <th>GST Number</th>
                  <th>Address</th>
                  <th>Type</th>
                  <th>Status</th>
                  {canEdit && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <Link to={`/customers/${customer.id}`} style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600 }}>
                        {customer.name}
                      </Link>
                    </td>
                    <td>{customer.mobile}</td>
                    <td>
                      <div>{customer.businessName || 'N/A'}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{customer.email}</div>
                    </td>
                    <td>{customer.gst || 'N/A'}</td>
                    <td>
                      <div style={{ maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={customer.address || ''}>
                        {customer.address || 'N/A'}
                      </div>
                    </td>
                    <td>{customer.type}</td>
                    <td>
                      <span className={`stock-badge ${customer.status === 'ACTIVE' ? '' : 'low'}`}>
                        {customer.status}
                      </span>
                    </td>
                    <td>
                      {canEdit && <button className="btn btn-secondary" style={{ padding: '0.3rem 0.75rem', fontSize: '0.78rem' }} onClick={() => handleOpenEdit(customer)}>Edit</button>}
                    </td>
                  </tr>
                ))}
                {customers.length === 0 && (
                  <tr>
                    <td colSpan={canEdit ? 8 : 7} style={{ textAlign: 'center' }}>No customers found.</td>
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
          <div className="card modal-content">
            <h3 style={{ marginTop: 0 }}>{editingId ? 'Edit Customer' : 'Add New Customer'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>Customer Name *</label>
                  <input required type="text" className="form-input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Mobile Number *</label>
                  <input required type="text" className="form-input" value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" className="form-input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Business Name</label>
                  <input type="text" className="form-input" value={formData.businessName} onChange={e => setFormData({...formData, businessName: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>GST Number</label>
                  <input type="text" className="form-input" value={formData.gst} onChange={e => setFormData({...formData, gst: e.target.value})} />
                </div>
                <div className="form-group full-width">
                  <label>Address</label>
                  <input type="text" className="form-input" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Customer Type</label>
                  <select className="form-input" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                    <option value="RETAIL">Retail</option>
                    <option value="WHOLESALE">Wholesale</option>
                    <option value="DISTRIBUTOR">Distributor</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select className="form-input" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="LEAD">Lead</option>
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn">Save Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}