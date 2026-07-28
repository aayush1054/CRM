import { useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { Users, Package, FileText, TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import api from '../utils/api';
import '../components/DataTable.css';

const performanceData = [
  { name: 'Jan', value: 30 }, { name: 'Feb', value: 45 }, { name: 'Mar', value: 35 },
  { name: 'Apr', value: 65 }, { name: 'May', value: 55 }, { name: 'Jun', value: 85 },
  { name: 'Jul', value: 70 }, { name: 'Aug', value: 95 },
];

const salesData = [
  { name: 'Target', value: 85 },
  { name: 'Remaining', value: 15 },
];

const barData = [
  { name: 'Wk 1', current: 40, previous: 24 },
  { name: 'Wk 2', current: 30, previous: 13 },
  { name: 'Wk 3', current: 55, previous: 38 },
  { name: 'Wk 4', current: 48, previous: 32 },
];

const PIE_COLORS = ['#6366f1', '#e5e7eb'];

interface StatCard {
  label: string;
  value: string;
  change: string;
  positive: boolean;
  icon: any;
  color: string;
  bgColor: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState({ customers: 0, products: 0, challans: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [c, p, ch] = await Promise.all([
          api.get('/customers?limit=1'),
          api.get('/products?limit=1'),
          api.get('/challans?limit=1')
        ]);
        setStats({
          customers: c.data.meta?.total || 0,
          products: p.data.meta?.total || 0,
          challans: ch.data.meta?.total || 0
        });
      } catch {}
    };
    fetchStats();
  }, []);

  const statCards: StatCard[] = [
    { label: 'Total Customers', value: String(stats.customers), change: '+12%', positive: true, icon: Users, color: '#6366f1', bgColor: 'rgba(99, 102, 241, 0.08)' },
    { label: 'Products', value: String(stats.products), change: '+5%', positive: true, icon: Package, color: '#0ea5e9', bgColor: 'rgba(14, 165, 233, 0.08)' },
    { label: 'Sales Challans', value: String(stats.challans), change: '+18%', positive: true, icon: FileText, color: '#22c55e', bgColor: 'rgba(34, 197, 94, 0.08)' },
    { label: 'Revenue', value: '₹4.2L', change: '-3%', positive: false, icon: TrendingUp, color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.08)' },
  ];

  return (
    <div>
      {/* Greeting */}
      <div className="fade-in-up stagger-1" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ margin: '0 0 0.25rem 0', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
          Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'} 👋
        </h2>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Here's what's happening with your business today.
        </p>
      </div>

      {/* Stats Row */}
      <div className="fade-in-up stagger-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div className="card" key={i} style={{ padding: '1.25rem', cursor: 'default' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, backgroundColor: stat.bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={20} color={stat.color} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 600, color: stat.positive ? 'var(--accent-green)' : 'var(--accent-rose)' }}>
                  {stat.positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {stat.change}
                </div>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem', fontWeight: 500 }}>
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="fade-in-up stagger-3" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* Area Chart */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>Revenue Overview</h3>
              <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Monthly performance</p>
            </div>
            <select className="form-input" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', borderRadius: 'var(--border-radius-xs)' }}>
              <option>Monthly</option>
              <option>Weekly</option>
            </select>
          </div>
          <div style={{ height: '200px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(10, 10, 15, 0.9)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: 8, boxShadow: '0 4px 15px rgba(139, 92, 246, 0.2)', fontSize: '0.8rem', color: '#fff' }}
                  cursor={{ stroke: '#8b5cf6', strokeWidth: 1, strokeDasharray: '3 3' }}
                />
                <Area type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', alignSelf: 'flex-start' }}>Sales Target</h3>
          <div style={{ height: '150px', width: '150px', position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={salesData} innerRadius={50} outerRadius={65} paddingAngle={2} dataKey="value" stroke="none" startAngle={90} endAngle={-270}>
                  {salesData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-primary)' }}>85%</div>
            </div>
          </div>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>of monthly quota</p>
        </div>

        {/* Bar Chart */}
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>Weekly Sales</h3>
          <p style={{ margin: '0 0 0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Current vs Previous</p>
          <div style={{ height: '155px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} barGap={3}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(10, 10, 15, 0.9)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: 8, boxShadow: '0 4px 15px rgba(139, 92, 246, 0.2)', fontSize: '0.8rem', color: '#fff' }}
                  cursor={{fill: 'rgba(139, 92, 246, 0.1)'}}
                />
                <Bar dataKey="current" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={14} />
                <Bar dataKey="previous" fill="rgba(139, 92, 246, 0.3)" radius={[4, 4, 0, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Stats */}
      <div className="fade-in-up stagger-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
        <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', border: '6px solid var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem', boxShadow: 'var(--accent-primary-glow)' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-primary)' }}>{stats.customers}</span>
          </div>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>Total Leads</p>
        </div>
        <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', border: '6px solid var(--accent-green)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem', boxShadow: 'var(--accent-green-glow)' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-green)' }}>{stats.challans}</span>
          </div>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>Active Challans</p>
        </div>
        <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', border: '6px solid var(--accent-amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem', boxShadow: 'var(--accent-amber-glow)' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-amber)' }}>{stats.products}</span>
          </div>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>Products In Stock</p>
        </div>
      </div>
    </div>
  );
}