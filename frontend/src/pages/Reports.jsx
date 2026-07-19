import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('sales');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Master Lists
  const [customers, setCustomers] = useState([]);
  const [staffList, setStaffList] = useState([]);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');

  // Report Data
  const [reportData, setReportData] = useState([]);
  const [ledgerCustomer, setLedgerCustomer] = useState(null);

  useEffect(() => {
    // Fetch dropdown data
    api.get('/customers').then(res => setCustomers(res.data)).catch(console.error);
    api.get('/staff').then(res => setStaffList(res.data)).catch(console.error);
  }, []);

  const runReport = async () => {
    setLoading(true);
    setError('');
    try {
      let endpoint = '';
      let params = [];

      if (activeTab === 'sales') {
        endpoint = '/reports/sales';
        if (startDate) params.push(`startDate=${startDate}`);
        if (endDate) params.push(`endDate=${endDate}`);
      } else if (activeTab === 'stock') {
        endpoint = '/reports/stock';
      } else if (activeTab === 'delivery') {
        endpoint = '/reports/delivery';
        if (startDate) params.push(`startDate=${startDate}`);
        if (endDate) params.push(`endDate=${endDate}`);
        if (selectedStaffId) params.push(`staffId=${selectedStaffId}`);
      } else if (activeTab === 'outstanding') {
        endpoint = '/reports/outstanding';
      } else if (activeTab === 'orders_analysis' || activeTab === 'upcoming_loops') {
        endpoint = '/dashboard/stats';
      } else if (activeTab === 'ledger') {
        if (!selectedCustomerId) {
          setError('Please select a customer for the Ledger Statement');
          setLoading(false);
          return;
        }
        endpoint = `/reports/ledger?customerId=${selectedCustomerId}`;
      }

      const queryStr = params.length > 0 ? `?${params.join('&')}` : '';
      const res = await api.get(`${endpoint}${queryStr}`);
      
      if (activeTab === 'ledger') {
        setReportData(res.data.ledger);
        setLedgerCustomer(res.data.customer);
      } else if (activeTab === 'orders_analysis' || activeTab === 'upcoming_loops') {
        setReportData(res.data);
      } else {
        setReportData(res.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setReportData([]);
    setError('');
    if (activeTab === 'sales' || activeTab === 'stock' || activeTab === 'outstanding' || activeTab === 'orders_analysis' || activeTab === 'upcoming_loops') {
      runReport();
    }
  }, [activeTab]);

  const handleExportCSV = () => {
    if (!reportData || reportData.length === 0) return;

    let headers = [];
    let rows = [];
    let filename = `${activeTab}_report_${Date.now()}.csv`;

    if (activeTab === 'sales') {
      headers = ['Invoice Number', 'Customer', 'Date', 'Subtotal', 'CGST/SGST Total', 'Grand Total', 'Status'];
      rows = reportData.map(b => [
        b.invoiceNumber,
        b.customer?.name,
        new Date(b.createdAt).toLocaleDateString(),
        b.subtotal.toFixed(2),
        (b.cgstTotal + b.sgstTotal).toFixed(2),
        b.totalAmount.toFixed(2),
        b.status
      ]);
    } else if (activeTab === 'stock') {
      headers = ['Product Name', 'Category', 'Unit', 'Price', 'Current Stock', 'Low Stock Threshold', 'Linked Vendor'];
      rows = reportData.map(p => [
        p.name,
        p.category,
        p.unit,
        p.price.toFixed(2),
        p.currentStock,
        p.lowStockThreshold,
        p.linkedVendor?.name
      ]);
    } else if (activeTab === 'delivery') {
      headers = ['Order Ref', 'Customer', 'Delivery Date', 'Driver/Staff', 'Total Amount', 'Status'];
      rows = reportData.map(o => [
        `ORD-${o._id.substring(18).toUpperCase()}`,
        o.customer?.name,
        new Date(o.deliveryDate).toLocaleDateString(),
        o.assignedStaff?.name || 'Unassigned',
        o.totalAmount.toFixed(2),
        o.status
      ]);
    } else if (activeTab === 'outstanding') {
      headers = ['Customer Name', 'Mobile', 'Total Invoiced', 'Total Paid', 'Outstanding Balance'];
      rows = reportData.map(o => [
        o.customer?.name,
        o.customer?.mobile,
        o.totalSales.toFixed(2),
        o.totalPaid.toFixed(2),
        o.outstandingAmount.toFixed(2)
      ]);
    } else if (activeTab === 'ledger') {
      headers = ['Date', 'Type', 'Reference/Ref ID', 'Debit (+Invoice)', 'Credit (-Paid)', 'Running Balance'];
      rows = reportData.map(l => [
        new Date(l.date).toLocaleDateString(),
        l.type,
        l.ref,
        l.debit.toFixed(2),
        l.credit.toFixed(2),
        l.runningBalance.toFixed(2)
      ]);
      filename = `ledger_${ledgerCustomer?.name.replace(/\s+/g, '_')}_${Date.now()}.csv`;
    }

    // Build CSV Content
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += headers.map(h => `"${h}"`).join(",") + "\n";
    rows.forEach(row => {
      csvContent += row.map(cell => `"${cell || ''}"`).join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Tabs Menu */}
      <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0' }}>
        <button 
          onClick={() => setActiveTab('sales')}
          style={{ padding: '12px 24px', background: 'transparent', border: 'none', borderBottom: activeTab === 'sales' ? '3px solid #3b82f6' : 'none', fontWeight: 'bold', color: activeTab === 'sales' ? '#3b82f6' : '#64748b', cursor: 'pointer' }}
        >
          💰 Sales Report
        </button>
        <button 
          onClick={() => setActiveTab('stock')}
          style={{ padding: '12px 24px', background: 'transparent', border: 'none', borderBottom: activeTab === 'stock' ? '3px solid #3b82f6' : 'none', fontWeight: 'bold', color: activeTab === 'stock' ? '#3b82f6' : '#64748b', cursor: 'pointer' }}
        >
          📦 Stock Report
        </button>
        <button 
          onClick={() => setActiveTab('delivery')}
          style={{ padding: '12px 24px', background: 'transparent', border: 'none', borderBottom: activeTab === 'delivery' ? '3px solid #3b82f6' : 'none', fontWeight: 'bold', color: activeTab === 'delivery' ? '#3b82f6' : '#64748b', cursor: 'pointer' }}
        >
          🚚 Deliveries Report
        </button>
        <button 
          onClick={() => setActiveTab('outstanding')}
          style={{ padding: '12px 24px', background: 'transparent', border: 'none', borderBottom: activeTab === 'outstanding' ? '3px solid #3b82f6' : 'none', fontWeight: 'bold', color: activeTab === 'outstanding' ? '#3b82f6' : '#64748b', cursor: 'pointer' }}
        >
          🔴 Outstanding Dues
        </button>
        <button 
          onClick={() => setActiveTab('orders_analysis')}
          style={{ padding: '12px 24px', background: 'transparent', border: 'none', borderBottom: activeTab === 'orders_analysis' ? '3px solid #3b82f6' : 'none', fontWeight: 'bold', color: activeTab === 'orders_analysis' ? '#3b82f6' : '#64748b', cursor: 'pointer' }}
        >
          📊 Orders Analysis
        </button>
        <button 
          onClick={() => setActiveTab('upcoming_loops')}
          style={{ padding: '12px 24px', background: 'transparent', border: 'none', borderBottom: activeTab === 'upcoming_loops' ? '3px solid #3b82f6' : 'none', fontWeight: 'bold', color: activeTab === 'upcoming_loops' ? '#3b82f6' : '#64748b', cursor: 'pointer' }}
        >
          🔄 Upcoming Loops
        </button>
        <button 
          onClick={() => setActiveTab('ledger')}
          style={{ padding: '12px 24px', background: 'transparent', border: 'none', borderBottom: activeTab === 'ledger' ? '3px solid #3b82f6' : 'none', fontWeight: 'bold', color: activeTab === 'ledger' ? '#3b82f6' : '#64748b', cursor: 'pointer' }}
        >
          📖 Customer Ledger Statement
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px', background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c', borderRadius: '8px' }}>
          {error}
        </div>
      )}

      {/* Filters Bar */}
      <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
        
        {(activeTab === 'sales' || activeTab === 'delivery') && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>End Date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }} />
            </div>
          </>
        )}

        {activeTab === 'delivery' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>Assigned Driver</label>
            <select value={selectedStaffId} onChange={(e) => setSelectedStaffId(e.target.value)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff' }}>
              <option value="">All Drivers</option>
              {staffList.map(st => (
                <option key={st._id} value={st._id}>{st.name}</option>
              ))}
            </select>
          </div>
        )}

        {activeTab === 'ledger' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b' }}>Select Customer Profile</label>
            <select value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)} style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', width: '220px' }}>
              <option value="">Choose Customer</option>
              {customers.map(c => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', alignSelf: 'flex-end', marginLeft: 'auto' }}>
          <button 
            onClick={runReport}
            style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
          >
            🔄 Run Query
          </button>
          {reportData.length > 0 && (
            <button 
              onClick={handleExportCSV}
              style={{ padding: '8px 16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
            >
              📥 Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Report Output Area */}
      {loading ? (
        <div>Calculating report records...</div>
      ) : (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
          
          {activeTab === 'sales' && (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 20px', color: '#475569' }}>Invoice Ref</th>
                  <th style={{ padding: '12px 20px', color: '#475569' }}>Customer</th>
                  <th style={{ padding: '12px 20px', color: '#475569' }}>Date</th>
                  <th style={{ padding: '12px 20px', color: '#475569' }}>Subtotal</th>
                  <th style={{ padding: '12px 20px', color: '#475569' }}>GST (CGST/SGST)</th>
                  <th style={{ padding: '12px 20px', color: '#475569' }}>Grand Total</th>
                  <th style={{ padding: '12px 20px', color: '#475569' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {reportData.length > 0 ? (
                  reportData.map(b => (
                    <tr key={b._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 20px', fontWeight: 'bold' }}>{b.invoiceNumber}</td>
                      <td style={{ padding: '12px 20px' }}>{b.customer?.name}</td>
                      <td style={{ padding: '12px 20px' }}>{new Date(b.createdAt).toLocaleDateString()}</td>
                      <td style={{ padding: '12px 20px' }}>Rs. {b.subtotal.toFixed(2)}</td>
                      <td style={{ padding: '12px 20px' }}>Rs. {(b.cgstTotal + b.sgstTotal).toFixed(2)}</td>
                      <td style={{ padding: '12px 20px', fontWeight: 'bold', color: '#166534' }}>Rs. {b.totalAmount.toFixed(2)}</td>
                      <td style={{ padding: '12px 20px' }}>{b.status}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="7" style={{ padding: '20px', textLight: 'center', color: '#64748b' }}>No transactions recorded.</td></tr>
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'stock' && (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 20px', color: '#475569' }}>Product Item</th>
                  <th style={{ padding: '12px 20px', color: '#475569' }}>Category</th>
                  <th style={{ padding: '12px 20px', color: '#475569' }}>Price</th>
                  <th style={{ padding: '12px 20px', color: '#475569' }}>Current Stock</th>
                  <th style={{ padding: '12px 20px', color: '#475569' }}>Low Stock Alert Min</th>
                  <th style={{ padding: '12px 20px', color: '#475569' }}>Supplier Vendor</th>
                </tr>
              </thead>
              <tbody>
                {reportData.length > 0 ? (
                  reportData.map(p => (
                    <tr key={p._id} style={{ borderBottom: '1px solid #f1f5f9', background: p.currentStock <= p.lowStockThreshold ? '#fffbeb' : 'transparent' }}>
                      <td style={{ padding: '12px 20px', fontWeight: 'bold' }}>{p.name}</td>
                      <td style={{ padding: '12px 20px' }}>{p.category}</td>
                      <td style={{ padding: '12px 20px' }}>Rs. {(p.price || 0).toFixed(2)}</td>
                      <td style={{ padding: '12px 20px', fontWeight: 'bold', color: p.currentStock <= p.lowStockThreshold ? '#ef4444' : '#1e293b' }}>
                        {p.currentStock} {p.unit}
                      </td>
                      <td style={{ padding: '12px 20px' }}>{p.lowStockThreshold} {p.unit}</td>
                      <td style={{ padding: '12px 20px' }}>{p.linkedVendor?.name}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="6" style={{ padding: '20px', textLight: 'center', color: '#64748b' }}>No products seeded.</td></tr>
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'delivery' && (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 20px', color: '#475569' }}>Order Ref</th>
                  <th style={{ padding: '12px 20px', color: '#475569' }}>Customer</th>
                  <th style={{ padding: '12px 20px', color: '#475569' }}>Delivery Date</th>
                  <th style={{ padding: '12px 20px', color: '#475569' }}>Assigned Driver</th>
                  <th style={{ padding: '12px 20px', color: '#475569' }}>Total Value</th>
                  <th style={{ padding: '12px 20px', color: '#475569' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {reportData.length > 0 ? (
                  reportData.map(o => (
                    <tr key={o._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 20px', fontWeight: 'bold' }}>ORD-{o._id.substring(18).toUpperCase()}</td>
                      <td style={{ padding: '12px 20px' }}>{o.customer?.name}</td>
                      <td style={{ padding: '12px 20px' }}>{new Date(o.deliveryDate).toLocaleDateString()}</td>
                      <td style={{ padding: '12px 20px' }}>{o.assignedStaff?.name || 'Unassigned'}</td>
                      <td style={{ padding: '12px 20px', fontWeight: 'bold' }}>Rs. {o.totalAmount.toFixed(2)}</td>
                      <td style={{ padding: '12px 20px' }}>{o.status}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="6" style={{ padding: '20px', textLight: 'center', color: '#64748b' }}>No matching deliveries runs.</td></tr>
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'outstanding' && (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 20px', color: '#475569' }}>Customer Name</th>
                  <th style={{ padding: '12px 20px', color: '#475569' }}>Mobile</th>
                  <th style={{ padding: '12px 20px', color: '#475569' }}>Total Invoiced Billing</th>
                  <th style={{ padding: '12px 20px', color: '#475569' }}>Total Payments Received</th>
                  <th style={{ padding: '12px 20px', color: '#ef4444', fontWeight: 'bold' }}>Outstanding Dues</th>
                </tr>
              </thead>
              <tbody>
                {reportData.length > 0 ? (
                  reportData.map(item => (
                    <tr key={item.customer?._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 20px', fontWeight: 'bold' }}>{item.customer?.name}</td>
                      <td style={{ padding: '12px 20px' }}>{item.customer?.mobile}</td>
                      <td style={{ padding: '12px 20px' }}>Rs. {item.totalSales.toFixed(2)}</td>
                      <td style={{ padding: '12px 20px' }}>Rs. {item.totalPaid.toFixed(2)}</td>
                      <td style={{ padding: '12px 20px', fontWeight: 'bold', color: '#ef4444' }}>Rs. {item.outstandingAmount.toFixed(2)}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="5" style={{ padding: '20px', textLight: 'center', color: '#64748b' }}>No pending balances. Perfect collections status!</td></tr>
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'ledger' && (
            <div>
              <div style={{ background: '#f8fafc', padding: '15px 20px', borderBottom: '1px solid #e2e8f0', fontSize: '13px', color: '#475569' }}>
                Statement Account Ledger for: <strong>{ledgerCustomer?.name}</strong> | Address: {ledgerCustomer?.address}
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '12px 20px', color: '#475569' }}>Date</th>
                    <th style={{ padding: '12px 20px', color: '#475569' }}>Transaction Type</th>
                    <th style={{ padding: '12px 20px', color: '#475569' }}>Reference Ref ID</th>
                    <th style={{ padding: '12px 20px', color: '#475569' }}>Debit (+Invoice)</th>
                    <th style={{ padding: '12px 20px', color: '#475569' }}>Credit (-Payment)</th>
                    <th style={{ padding: '12px 20px', color: '#475569', fontWeight: 'bold' }}>Running Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.length > 0 ? (
                    reportData.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '12px 20px' }}>{new Date(item.date).toLocaleDateString()}</td>
                        <td style={{ padding: '12px 20px', fontWeight: 'bold' }}>{item.type}</td>
                        <td style={{ padding: '12px 20px' }}>{item.ref}</td>
                        <td style={{ padding: '12px 20px', color: item.debit > 0 ? '#b91c1c' : '#475569' }}>
                          {item.debit > 0 ? `Rs. ${item.debit.toFixed(2)}` : '-'}
                        </td>
                        <td style={{ padding: '12px 20px', color: item.credit > 0 ? '#166534' : '#475569' }}>
                          {item.credit > 0 ? `Rs. ${item.credit.toFixed(2)}` : '-'}
                        </td>
                        <td style={{ padding: '12px 20px', fontWeight: 'bold', color: item.runningBalance > 0 ? '#b91c1c' : '#166534' }}>
                          Rs. {item.runningBalance.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="6" style={{ padding: '20px', textLight: 'center', color: '#64748b' }}>Select a customer and click "Run Query" to generate ledger.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          {activeTab === 'orders_analysis' && reportData && (
            <div style={{ padding: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', marginBottom: '15px' }}>Recent Order Updates</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
                {reportData.recentOrders && reportData.recentOrders.length > 0 ? (
                  reportData.recentOrders.map(order => (
                    <div key={order._id} style={{ padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ fontWeight: 'bold', color: '#334155' }}>{order.ref}</span>
                        <span style={{ 
                          padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold',
                          background: order.status === 'Delivered' ? '#dcfce7' : order.status === 'Cancelled' ? '#fee2e2' : '#e0f2fe',
                          color: order.status === 'Delivered' ? '#166534' : order.status === 'Cancelled' ? '#991b1b' : '#0369a1'
                        }}>
                          {order.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#475569', marginBottom: '5px' }}>Customer: {order.customerName}</div>
                      <div style={{ fontSize: '13px', color: '#475569', marginBottom: '5px' }}>Amount: Rs. {order.totalAmount?.toFixed(2)}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>Updated: {new Date(order.updatedAt).toLocaleString()}</div>
                    </div>
                  ))
                ) : (
                  <div style={{ color: '#64748b', fontSize: '14px' }}>No recent orders found.</div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'upcoming_loops' && reportData && (
            <div style={{ padding: '20px' }}>
              <div style={{ marginBottom: '25px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#b91c1c', marginBottom: '10px' }}>🚨 Action Required: Due in 1 Day (Create New Order)</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
                  {reportData.activeLoops?.filter(loop => !loop.recurringProcessed && loop.status === 'Delivered' && (new Date(loop.nextRun) - new Date()) / (1000 * 60 * 60 * 24) <= 1).length > 0 ? (
                    reportData.activeLoops.filter(loop => !loop.recurringProcessed && loop.status === 'Delivered' && (new Date(loop.nextRun) - new Date()) / (1000 * 60 * 60 * 24) <= 1).map(loop => (
                      <div key={loop.orderId} style={{ padding: '15px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px' }}>
                        <div style={{ fontWeight: 'bold', color: '#991b1b', marginBottom: '5px' }}>{loop.customerName}</div>
                        <div style={{ fontSize: '13px', color: '#b91c1c', marginBottom: '5px' }}>Mobile: {loop.customerMobile}</div>
                        <div style={{ fontSize: '13px', color: '#b91c1c', marginBottom: '5px' }}>Due Date: {new Date(loop.nextRun).toLocaleDateString()}</div>
                        <div style={{ fontSize: '13px', color: '#b91c1c', fontWeight: 'bold' }}>Amount: Rs. {loop.totalAmount?.toFixed(2)}</div>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: '#64748b', fontSize: '14px' }}>No orders due within 1 day.</div>
                  )}
                </div>
              </div>

              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#b45309', marginBottom: '10px' }}>⏳ Upcoming Renewals: Due in 2-5 Days</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
                  {reportData.activeLoops?.filter(loop => {
                    if (loop.recurringProcessed || loop.status !== 'Delivered') return false;
                    const diffDays = (new Date(loop.nextRun) - new Date()) / (1000 * 60 * 60 * 24);
                    return diffDays > 1 && diffDays <= 5;
                  }).length > 0 ? (
                    reportData.activeLoops.filter(loop => {
                      if (loop.recurringProcessed || loop.status !== 'Delivered') return false;
                      const diffDays = (new Date(loop.nextRun) - new Date()) / (1000 * 60 * 60 * 24);
                      return diffDays > 1 && diffDays <= 5;
                    }).map(loop => (
                      <div key={loop.orderId} style={{ padding: '15px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px' }}>
                        <div style={{ fontWeight: 'bold', color: '#92400e', marginBottom: '5px' }}>{loop.customerName}</div>
                        <div style={{ fontSize: '13px', color: '#b45309', marginBottom: '5px' }}>Mobile: {loop.customerMobile}</div>
                        <div style={{ fontSize: '13px', color: '#b45309', marginBottom: '5px' }}>Due Date: {new Date(loop.nextRun).toLocaleDateString()}</div>
                        <div style={{ fontSize: '13px', color: '#b45309', fontWeight: 'bold' }}>Amount: Rs. {loop.totalAmount?.toFixed(2)}</div>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: '#64748b', fontSize: '14px' }}>No orders due in 2-5 days.</div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
