import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

export default function Dashboard({ role, onNavigate }) {
  const [stats, setStats] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [scanMessage, setScanMessage] = useState('');
  const [loopMessage, setLoopMessage] = useState('');

  const handleProcessLoops = async () => {
    try {
      setLoopMessage('Processing order loops...');
      const res = await api.post('/orders/process-recurring');
      setLoopMessage(res.data.message);
      setTimeout(() => setLoopMessage(''), 5000);
      fetchStats();
    } catch (err) {
      console.error(err);
      setLoopMessage('Failed to process loops');
      setTimeout(() => setLoopMessage(''), 5000);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/dashboard/stats');
      setStats(res.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to fetch dashboard metrics');
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    // Initial fetch
    setLoading(true);
    Promise.all([fetchStats(), fetchNotifications()]).finally(() => setLoading(false));

    // Setup near-real-time polling for notifications and stats every 5 seconds
    const interval = setInterval(async () => {
      fetchStats();
      fetchNotifications();
      
      try {
        // Silently process recurring loops on polling
        const res = await api.post('/orders/process-recurring');
        if (res.data.newOrders && res.data.newOrders.length > 0) {
          alert(`🔄 Automatic Order Loop Triggered!\n\n${res.data.newOrders.length} new recurring order(s) have been generated based on the customer loop schedule.`);
          fetchStats();
          fetchNotifications();
        }
      } catch (err) {
        // Silent fail for background polling
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      // Update local state
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      fetchStats();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && !stats) {
    return <div style={{ padding: '40px', textLight: 'center', color: '#64748b' }}>Loading dashboard details...</div>;
  }

  // Prepping Chart Data
  const chartData = stats?.customerDues?.slice(0, 5).map(item => ({
    name: item.name.substring(0, 12),
    outstanding: item.outstanding
  })) || [];

  const pieData = stats?.orderStatusCounts ? [
    { name: 'Pending', value: stats.orderStatusCounts.Pending || 0, color: '#f59e0b' },
    { name: 'Assigned', value: stats.orderStatusCounts.Assigned || 0, color: '#3b82f6' },
    { name: 'Packed', value: stats.orderStatusCounts.Packed || 0, color: '#8b5cf6' },
    { name: 'Out for Delivery', value: stats.orderStatusCounts['Out for Delivery'] || 0, color: '#06b6d4' },
    { name: 'Delivered', value: stats.orderStatusCounts.Delivered || 0, color: '#10b981' },
    { name: 'Cancelled', value: stats.orderStatusCounts.Cancelled || 0, color: '#ef4444' }
  ].filter(d => d.value > 0) : [];

  const upcomingLoops = stats?.activeLoops?.filter(loop => {
    if (loop.recurringProcessed || loop.status !== 'Delivered') return false;
    const diffDays = (new Date(loop.nextRun) - new Date()) / (1000 * 60 * 60 * 24);
    return diffDays < 5;
  }).sort((a, b) => new Date(a.nextRun) - new Date(b.nextRun)) || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {error && (
        <div style={{ padding: '12px', background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: '8px' }}>
          {error}
        </div>
      )}

      {/* Top Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        <div 
          onClick={() => onNavigate && onNavigate('bills')}
          style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', cursor: 'pointer', transition: 'transform 0.2s' }}
          onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#1e40af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Sales</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#172554', marginTop: '10px' }}>Rs. {stats?.totalSales?.toFixed(2) || '0.00'}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#475569', marginTop: '10px' }}>
            <span>Today: <strong>Rs. {stats?.todaySales?.toFixed(2) || '0.00'}</strong></span>
            <span>This Month: <strong>Rs. {stats?.thisMonthSales?.toFixed(2) || '0.00'}</strong></span>
          </div>
        </div>

        <div 
          onClick={() => onNavigate && onNavigate('customers')}
          style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', cursor: 'pointer', transition: 'transform 0.2s' }}
          onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Outstanding Amount</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#7f1d1d', marginTop: '10px' }}>Rs. {stats?.totalOutstanding?.toFixed(2) || '0.00'}</div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '10px' }}>Outstanding credit balance from invoices</div>
        </div>

        <div 
          onClick={() => onNavigate && onNavigate('orders')}
          style={{ background: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', cursor: 'pointer', transition: 'transform 0.2s' }}
          onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Today's Deliveries</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#14532d', marginTop: '10px' }}>{stats?.todayDeliveries || 0}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#475569', marginTop: '10px' }}>
            <span>Tomorrow: <strong>{stats?.tomorrowDeliveries}</strong></span>
            <span>Total Pending: <strong>{stats?.pendingDeliveries}</strong></span>
          </div>
        </div>

        <div 
          onClick={() => onNavigate && onNavigate('products')}
          style={{ background: stats?.lowStockCount > 0 ? '#fffbeb' : '#faf5ff', border: stats?.lowStockCount > 0 ? '1px solid #fef3c7' : '1px solid #f3e8ff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', cursor: 'pointer', transition: 'transform 0.2s' }}
          onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'}
          onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: stats?.lowStockCount > 0 ? '#92400e' : '#6b21a8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Low Stock Items</div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: stats?.lowStockCount > 0 ? '#78350f' : '#581c87', marginTop: '10px' }}>{stats?.lowStockCount || 0}</div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '10px' }}>
            {stats?.lowStockCount > 0 ? '⚠️ Immediate restock required' : '✅ Stock levels are normal'}
          </div>
        </div>
      </div>

      {/* Order Loops Banner */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: upcomingLoops.length > 0 ? '20px' : '0' }}>
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🔄 Order Loops (Recurring Deliveries)
            </h2>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
              Automatically generate new orders for customers with recurring 30-day supplies.
            </p>
            {loopMessage && <span style={{ display: 'inline-block', marginTop: '10px', fontSize: '12px', color: '#059669', background: '#d1fae5', padding: '4px 12px', borderRadius: '12px', fontWeight: '600' }}>{loopMessage}</span>}
          </div>
          <button 
            onClick={handleProcessLoops}
            style={{ padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', transition: 'background 0.2s', boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)' }}
            onMouseOver={(e) => e.target.style.background = '#1d4ed8'}
            onMouseOut={(e) => e.target.style.background = '#2563eb'}
          >
            Process Due Loops
          </button>
        </div>
        
        <div 
          onClick={() => onNavigate && onNavigate('orders')}
          style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s' }}
          onMouseOver={e => e.currentTarget.style.transform = 'scale(1.01)'}
          onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <div style={{ padding: '10px 16px', background: '#fef3c7', fontSize: '13px', fontWeight: 'bold', color: '#b45309', borderBottom: '1px solid #fde68a' }}>
            ⏳ Upcoming Renewals (Within 5 Days)
          </div>
          {upcomingLoops.length > 0 ? (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <tbody>
                {upcomingLoops.map(loop => {
                  const nextRunDate = new Date(loop.nextRun);
                  return (
                    <tr key={loop.orderId} style={{ borderBottom: '1px solid #fef3c7' }}>
                      <td style={{ padding: '10px 16px', color: '#92400e', fontWeight: '600', fontSize: '13px' }}>{loop.customerName}</td>
                      <td style={{ padding: '10px 16px', color: '#92400e', fontSize: '13px' }}>{loop.customerMobile}</td>
                      <td style={{ padding: '10px 16px', color: '#b45309', fontSize: '13px' }}>Due: {nextRunDate.toLocaleDateString()}</td>
                      <td style={{ padding: '10px 16px', color: '#92400e', fontWeight: 'bold', fontSize: '13px', textAlign: 'right' }}>Rs. {loop.totalAmount.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '16px', color: '#d97706', fontSize: '13px', textAlign: 'center' }}>
              No customers have loops due in the next 5 days.
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Orders Analysis and Recent Updates */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
        
        {/* Order Status Breakdown */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '15px' }}>Orders Analysis</h2>
          {pieData.length > 0 ? (
            <div style={{ width: '100%', height: '220px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '13px' }}>
              No orders found.
            </div>
          )}
        </div>

        {/* Recent Order Updates Feed */}
        <div 
          onClick={() => onNavigate && onNavigate('orders')}
          style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'box-shadow 0.2s' }}
          onMouseOver={e => e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.1)'}
          onMouseOut={e => e.currentTarget.style.boxShadow = 'none'}
        >
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '15px' }}>Recent Order Updates</h2>
          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '220px', paddingRight: '5px' }}>
            {stats?.recentOrders && stats.recentOrders.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {stats.recentOrders.map(order => (
                  <div key={order._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#334155' }}>{order.ref}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{order.customerName}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0f172a' }}>Rs. {order.totalAmount.toFixed(2)}</div>
                      <div style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginTop: '4px',
                        background: order.status === 'Delivered' ? '#dcfce7' : order.status === 'Cancelled' ? '#fee2e2' : '#e0f2fe',
                        color: order.status === 'Delivered' ? '#166534' : order.status === 'Cancelled' ? '#991b1b' : '#0369a1',
                        fontWeight: '600'
                      }}>
                        {order.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '13px' }}>
                No recent activity.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Charts and Low Stock Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
        
        {/* Outstanding Dues Chart */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '15px' }}>Top Outstanding Dues by Customer</h2>
          {chartData.length > 0 ? (
            <div style={{ width: '100%', height: '220px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                  <Tooltip formatter={(value) => [`Rs. ${value.toFixed(2)}`, 'Outstanding']} />
                  <Bar dataKey="outstanding" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="#ef4444" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '13px' }}>
              No outstanding dues to display
            </div>
          )}
        </div>

        {/* Low Stock Warning List */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Stock Alerts</span>
            <span style={{ fontSize: '11px', background: '#fee2e2', color: '#ef4444', padding: '2px 8px', borderRadius: '10px' }}>Critical</span>
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '220px', overflowY: 'auto' }}>
            {stats?.lowStockAlerts && stats.lowStockAlerts.length > 0 ? (
              stats.lowStockAlerts.map(p => (
                <div key={p._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '8px' }}>
                  <div>
                    <strong style={{ fontSize: '13px', color: '#92400e' }}>{p.name}</strong>
                    <div style={{ fontSize: '11px', color: '#b45309' }}>Threshold level: {p.threshold}</div>
                  </div>
                  <div style={{ background: '#f59e0b', color: '#fff', fontWeight: 'bold', padding: '3px 8px', borderRadius: '6px', fontSize: '12px' }}>
                    {p.currentStock} left
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0', fontSize: '13px' }}>
                ✅ All product stocks are in healthy state.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Live Alerts/Notifications & Recent Payments */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
        
        {/* Live Alerts Notification Panel */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '15px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            🔔 Live Delivery & Stock Notifications
            <span style={{ animation: 'pulse 2s infinite', display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }}></span>
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto' }}>
            {notifications.length > 0 ? (
              notifications.map(n => (
                <div key={n._id} style={{ display: 'flex', gap: '12px', padding: '12px', background: n.read ? '#f8fafc' : '#f0f9ff', border: n.read ? '1px solid #e2e8f0' : '1px solid #bae6fd', borderRadius: '8px', opacity: n.read ? 0.75 : 1 }}>
                  <div style={{ fontSize: '20px' }}>
                    {n.type === 'delivery' && '🚚'}
                    {n.type === 'low_stock' && '⚠️'}
                    {n.type === 'delivery_reminder' && '📅'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <strong style={{ fontSize: '13px', color: '#1e293b' }}>{n.title}</strong>
                      <span style={{ fontSize: '10px', color: '#64748b' }}>{new Date(n.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>{n.message}</p>
                    
                    {!n.read && (
                      <button 
                        onClick={() => handleMarkAsRead(n._id)}
                        style={{ marginTop: '8px', padding: '2px 8px', fontSize: '10px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0', fontSize: '13px' }}>
                No recent notifications.
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions Ledger */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1e293b', marginBottom: '15px' }}>Recent Payments Received</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto' }}>
            {stats?.recentTransactions && stats.recentTransactions.length > 0 ? (
              stats.recentTransactions.map(p => (
                <div key={p._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <div>
                    <strong style={{ fontSize: '13px', color: '#1e293b' }}>{p.customerName}</strong>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                      Mode: <span style={{ textTransform: 'uppercase' }}>{p.mode}</span> | Date: {new Date(p.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#166534' }}>+ Rs. {p.amount.toFixed(2)}</div>
                    <span style={{ fontSize: '10px', color: '#64748b' }}>{p.ref || 'Ref: N/A'}</span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0', fontSize: '13px' }}>
                No payments logged yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
