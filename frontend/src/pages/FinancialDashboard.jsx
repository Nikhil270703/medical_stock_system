import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function FinancialDashboard() {
  const [stats, setStats] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Sort State
  const [sortField, setSortField] = useState('outstanding');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchData = async () => {
    try {
      const [statsRes, expRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/expenses')
      ]);
      setStats(statsRes.data);
      setExpenses(expRes.data);
    } catch (err) {
      console.error(err);
      setError('Failed to load financial dashboards');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalSales = stats?.totalSales || 0;
  const netProfit = totalSales - totalExpenses;

  // Sorting customer dues table
  const sortedDues = stats?.customerDues ? [...stats.customerDues] : [];
  if (sortedDues.length > 0) {
    sortedDues.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (typeof aVal === 'string') {
        return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });
  }

  const handleRequestSort = (field) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortField(field);
  };

  // Prepare chart data (Monthly Breakdown simulation)
  const salesTrend = [
    { month: 'Jan', Sales: totalSales * 0.15, Expenses: totalExpenses * 0.15 },
    { month: 'Feb', Sales: totalSales * 0.20, Expenses: totalExpenses * 0.10 },
    { month: 'Mar', Sales: totalSales * 0.10, Expenses: totalExpenses * 0.20 },
    { month: 'Apr', Sales: totalSales * 0.25, Expenses: totalExpenses * 0.15 },
    { month: 'May', Sales: totalSales * 0.12, Expenses: totalExpenses * 0.12 },
    { month: 'Jun', Sales: totalSales * 0.18, Expenses: totalExpenses * 0.28 }
  ];

  if (loading) return <div style={{ padding: '40px', color: '#64748b' }}>Loading...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {error && (
        <div style={{ padding: '12px', background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: '8px' }}>
          {error}
        </div>
      )}

      {/* Financial Scorecards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#0369a1', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Sales</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#0369a1', marginTop: '10px' }}>Rs. {totalSales.toFixed(2)}</div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '8px' }}>Today: Rs. {stats?.todaySales.toFixed(2)}</div>
        </div>

        <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Expenses</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#991b1b', marginTop: '10px' }}>Rs. {totalExpenses.toFixed(2)}</div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '8px' }}>Total money spent</div>
        </div>

        <div style={{ background: netProfit >= 0 ? '#f0fdf4' : '#fff1f2', border: netProfit >= 0 ? '1px solid #bbf7d0' : '1px solid #fecdd3', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: netProfit >= 0 ? '#166534' : '#990000', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Profit / Loss</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: netProfit >= 0 ? '#166534' : '#b91c1c', marginTop: '10px' }}>Rs. {netProfit.toFixed(2)}</div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '8px' }}>Sales minus expenses</div>
        </div>

        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '20px' }}>
          <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Unpaid Amount</div>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#92400e', marginTop: '10px' }}>Rs. {stats?.totalOutstanding.toFixed(2)}</div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '8px' }}>Money customers owe you</div>
        </div>
      </div>

      {/* Sales Trend Chart */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e293b', marginBottom: '15px' }}>Sales vs Expenses Trend</h3>
        <div style={{ width: '100%', height: '220px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
              <Tooltip formatter={(value) => `Rs. ${Number(value).toFixed(2)}`} />
              <Area type="monotone" dataKey="Sales" stroke="#3b82f6" fillOpacity={0.1} fill="#3b82f6" />
              <Area type="monotone" dataKey="Expenses" stroke="#ef4444" fillOpacity={0.05} fill="#ef4444" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 3: Sortable Dues and Recent Transactions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        
        {/* Outstanding Dues list */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e293b', marginBottom: '15px' }}>Unpaid Customer Bills</h3>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th 
                  onClick={() => handleRequestSort('name')}
                  style={{ padding: '10px 12px', color: '#475569', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Customer {sortField === 'name' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th 
                  onClick={() => handleRequestSort('outstanding')}
                  style={{ padding: '10px 12px', color: '#475569', cursor: 'pointer', textAlign: 'right', fontWeight: 'bold' }}
                >
                  Unpaid Amount {sortField === 'outstanding' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedDues.map((du, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 12px', fontWeight: '600', color: '#334155' }}>
                    {du.name}
                  </td>
                  <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 'bold', color: '#ef4444' }}>
                    Rs. {du.outstanding.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recent Transactions Feed */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 'bold', color: '#1e293b', marginBottom: '15px' }}>Recent Payments</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto' }}>
            {stats?.recentTransactions && stats.recentTransactions.length > 0 ? (
              stats.recentTransactions.map((tr, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <div>
                    <strong style={{ fontSize: '13px', color: '#1e293b' }}>{tr.customerName}</strong>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                      Mode: {tr.mode} | Date: {new Date(tr.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#166534' }}>+ Rs. {tr.amount.toFixed(2)}</div>
                    <span style={{ fontSize: '10px', color: '#94a3b8' }}>{tr.ref || 'Ref: N/A'}</span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: '#94a3b8', fontSize: '12px', textAlign: 'center', padding: '40px' }}>No payments logged.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
