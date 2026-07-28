import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Phone, Mail, Building2, MapPin, Hash, Tag } from 'lucide-react';
import api from '../utils/api';
import '../components/DataTable.css';

export default function CustomerDetail() {
  const { id } = useParams();
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notesData, setNotesData] = useState({ notes: '', followUpDate: '' });
  const [savingNotes, setSavingNotes] = useState(false);

  const role = localStorage.getItem('role') || '';
  const canEdit = ['ADMIN', 'SALES'].includes(role);

  const fetchCustomer = async () => {
    try {
      const res = await api.get(`/customers/${id}`);
      setCustomer(res.data);
      setNotesData({
        notes: res.data.notes || '',
        followUpDate: res.data.followUpDate ? res.data.followUpDate.split('T')[0] : ''
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  const handleSaveNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    setSavingNotes(true);
    try {
      await api.put(`/customers/${id}/notes`, notesData);
      alert('Notes updated successfully');
      fetchCustomer();
    } catch (error) {
      console.error(error);
      alert('Failed to update notes');
    } finally {
      setSavingNotes(false);
    }
  };

  if (loading) return <div className="card"><p style={{ color: 'var(--text-muted)' }}>Loading customer details...</p></div>;
  if (!customer) return <div className="card"><p style={{ color: 'var(--text-muted)' }}>Customer not found.</p></div>;

  const DetailRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.65rem 0', borderBottom: '1px solid #f1f3f8' }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'var(--accent-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={15} color="var(--accent-primary)" />
      </div>
      <div>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-main)', fontWeight: 500 }}>{value}</div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link to="/customers" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 10, backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'var(--transition)' }}>
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h2 className="page-title" style={{ fontSize: '1.3rem' }}>{customer.name}</h2>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{customer.businessName || 'Individual'}</p>
          </div>
        </div>
        <span className={`stock-badge ${customer.status === 'ACTIVE' ? '' : customer.status === 'LEAD' ? 'warning' : 'low'}`}>
          {customer.status}
        </span>
      </div>

      <div className="form-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="card">
          <h3 style={{ marginTop: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', paddingBottom: '0.5rem', borderBottom: '1px solid #eef0f4' }}>Contact Details</h3>
          <DetailRow icon={Phone} label="Mobile" value={customer.mobile} />
          <DetailRow icon={Mail} label="Email" value={customer.email || 'N/A'} />
          <DetailRow icon={Building2} label="Business" value={customer.businessName || 'N/A'} />
          <DetailRow icon={Hash} label="GST Number" value={customer.gst || 'N/A'} />
          <DetailRow icon={MapPin} label="Address" value={customer.address || 'N/A'} />
          <DetailRow icon={Tag} label="Type" value={customer.type} />
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', paddingBottom: '0.5rem', borderBottom: '1px solid #eef0f4' }}>Follow-up & Notes</h3>
          {canEdit ? (
            <form onSubmit={handleSaveNotes} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.75rem' }}>
              <div className="form-group">
                <label>Follow-up Date</label>
                <input type="date" className="form-input" value={notesData.followUpDate} onChange={e => setNotesData({...notesData, followUpDate: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea className="form-input" rows={4} value={notesData.notes} onChange={e => setNotesData({...notesData, notes: e.target.value})} placeholder="Add follow-up notes here..." />
              </div>
              <button type="submit" className="btn" disabled={savingNotes} style={{ alignSelf: 'flex-start' }}>
                {savingNotes ? 'Saving...' : 'Save Notes'}
              </button>
            </form>
          ) : (
            <div style={{ marginTop: '0.75rem' }}>
              <p style={{ fontSize: '0.85rem' }}><strong style={{ color: 'var(--text-secondary)' }}>Follow-up Date:</strong> <span style={{ color: 'var(--text-main)' }}>{customer.followUpDate ? new Date(customer.followUpDate).toLocaleDateString() : 'N/A'}</span></p>
              <p style={{ fontSize: '0.85rem' }}><strong style={{ color: 'var(--text-secondary)' }}>Notes:</strong> <span style={{ color: 'var(--text-main)' }}>{customer.notes || 'No notes available.'}</span></p>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>Challan History</h3>
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Challan No</th>
                <th>Date</th>
                <th>Total Qty</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {customer.challans?.map((challan: any) => (
                <tr key={challan.id}>
                  <td><strong>{challan.challanNo}</strong></td>
                  <td>{new Date(challan.createdAt).toLocaleDateString()}</td>
                  <td>{challan.totalQty}</td>
                  <td>
                    <span className={`stock-badge ${challan.status === 'DRAFT' ? 'warning' : challan.status === 'CONFIRMED' ? '' : 'low'}`}>
                      {challan.status}
                    </span>
                  </td>
                </tr>
              ))}
              {(!customer.challans || customer.challans.length === 0) && (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No challans found for this customer.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
