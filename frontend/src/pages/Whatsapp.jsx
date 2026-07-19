import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function Whatsapp() {
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'config'
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  const [settings, setSettings] = useState({ whatsappProvider: 'meta', whatsappPhoneId: '', whatsappToken: '' });
  const [localStatus, setLocalStatus] = useState({ isReady: false, qrCodeDataURL: null });

  // Fetch local WhatsApp status
  const fetchLocalStatus = async () => {
    if (settings.whatsappProvider !== 'local') return;
    try {
      const res = await api.get('/whatsapp/status');
      setLocalStatus(res.data);
    } catch (err) {
      console.error('Failed to fetch local WhatsApp status', err);
    }
  };

  useEffect(() => {
    let interval;
    if (settings.whatsappProvider === 'local') {
      fetchLocalStatus();
      interval = setInterval(fetchLocalStatus, 5000); // poll every 5s
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [settings.whatsappProvider]);
  useEffect(() => {
    const fetchInitData = async () => {
      try {
        const [custRes, settingsRes] = await Promise.all([
          api.get('/customers'),
          api.get('/settings')
        ]);
        
        setContacts(custRes.data.map(c => ({
          _id: c._id,
          name: c.name,
          mobile: c.mobile,
          type: 'Customer'
        })));

        if (settingsRes.data) {
          setSettings({
            whatsappProvider: settingsRes.data.whatsappProvider || 'meta',
            whatsappPhoneId: settingsRes.data.whatsappPhoneId || '',
            whatsappToken: settingsRes.data.whatsappToken || ''
          });
        }
      } catch (err) {
        console.error('Failed to load whatsapp initialization data', err);
      }
    };
    fetchInitData();
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!selectedContact || !messageText.trim()) return;

    setLoading(true);
    setStatusMsg({ type: '', text: '' });

    try {
      // Ensure mobile has country code, assume +91 if missing for Indian numbers
      let formattedMobile = selectedContact.mobile.replace(/\D/g, '');
      if (formattedMobile.length === 10) {
        formattedMobile = `91${formattedMobile}`;
      }

      await api.post('/whatsapp/send', {
        to: formattedMobile,
        message: messageText
      });

      setStatusMsg({ type: 'success', text: `Message sent to ${selectedContact.name} successfully!` });
      setMessageText('');
    } catch (error) {
      console.error(error);
      setStatusMsg({ type: 'error', text: error.response?.data?.error || 'Failed to send WhatsApp message. Check config.' });
    } finally {
      setLoading(false);
      setTimeout(() => setStatusMsg({ type: '', text: '' }), 6000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', padding: '10px 0' }}>
      
      {/* Header / Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', background: '#f8fafc', borderRadius: '12px', padding: '6px', border: '1px solid #e2e8f0' }}>
          <button 
            onClick={() => setActiveTab('chat')}
            style={{ 
              padding: '8px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', 
              background: activeTab === 'chat' ? '#fff' : 'transparent', 
              fontWeight: '600', color: activeTab === 'chat' ? '#0f172a' : '#64748b',
              boxShadow: activeTab === 'chat' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            Messages
          </button>
          <button 
            onClick={() => setActiveTab('config')}
            style={{ 
              padding: '8px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', 
              background: activeTab === 'config' ? '#fff' : 'transparent', 
              fontWeight: '600', color: activeTab === 'config' ? '#0f172a' : '#64748b',
              boxShadow: activeTab === 'config' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            API Configuration
          </button>
        </div>
      </div>

      {statusMsg.text && (
        <div style={{ 
          padding: '12px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold',
          background: statusMsg.type === 'success' ? '#d1fae5' : '#fee2e2',
          color: statusMsg.type === 'success' ? '#065f46' : '#b91c1c',
          border: `1px solid ${statusMsg.type === 'success' ? '#34d399' : '#fca5a5'}`
        }}>
          {statusMsg.text}
        </div>
      )}

      {activeTab === 'chat' && (
        <div style={{ display: 'flex', flex: 1, gap: '20px', height: 'calc(100vh - 200px)' }}>
          {/* Contacts List */}
          <div style={{ width: '300px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>Contacts ({contacts.length})</h3>
            </div>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {contacts.map(contact => (
                <div 
                  key={contact._id} 
                  onClick={() => setSelectedContact(contact)}
                  style={{ 
                    padding: '16px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', transition: 'background 0.2s',
                    background: selectedContact?._id === contact._id ? '#eff6ff' : '#fff'
                  }}
                  onMouseEnter={(e) => { if (selectedContact?._id !== contact._id) e.currentTarget.style.background = '#f8fafc' }}
                  onMouseLeave={(e) => { if (selectedContact?._id !== contact._id) e.currentTarget.style.background = '#fff' }}
                >
                  <div style={{ fontWeight: 'bold', color: '#1e293b', fontSize: '14px' }}>{contact.name}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>📱 {contact.mobile}</span>
                    <span style={{ background: '#e2e8f0', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' }}>{contact.type}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Window */}
          <div style={{ flex: 1, background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {selectedContact ? (
              <>
                <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', background: '#2563eb', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '16px' }}>
                    {selectedContact.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>{selectedContact.name}</h3>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{selectedContact.mobile}</div>
                  </div>
                </div>

                <div style={{ flex: 1, padding: '20px', overflowY: 'auto', background: '#f1f5f9' }}>
                  {/* Mock message history could go here */}
                  <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12px', marginTop: '40px' }}>
                    Start a conversation with {selectedContact.name}
                  </div>
                </div>

                <div style={{ padding: '16px', borderTop: '1px solid #e2e8f0', background: '#fff' }}>
                  <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '12px' }}>
                    <textarea 
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder={`Type a message to ${selectedContact.name}...`}
                      style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', resize: 'none', height: '50px', fontFamily: 'inherit' }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                      }}
                    />
                    <button 
                      type="submit"
                      disabled={loading || !messageText.trim()}
                      style={{ 
                        padding: '0 24px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', 
                        fontWeight: 'bold', cursor: (loading || !messageText.trim()) ? 'not-allowed' : 'pointer', 
                        opacity: (loading || !messageText.trim()) ? 0.6 : 1, transition: 'background 0.2s' 
                      }}
                    >
                      {loading ? 'Sending...' : 'Send'}
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
                <h3 style={{ margin: 0, color: '#475569' }}>WhatsApp Messaging</h3>
                <p style={{ fontSize: '14px', marginTop: '8px' }}>Select a contact from the list to start messaging.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'config' && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '30px', maxWidth: '600px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0f172a', marginBottom: '8px' }}>WhatsApp API Configuration</h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px' }}>Enter your WhatsApp Cloud API or Twilio credentials to enable live messaging.</p>
          
          <form style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} onSubmit={async (e) => { 
            e.preventDefault(); 
            try {
              await api.put('/settings', settings);
              setStatusMsg({ type: 'success', text: 'WhatsApp settings saved successfully!' }); 
            } catch (err) {
              setStatusMsg({ type: 'error', text: 'Failed to save settings' }); 
            }
            setTimeout(() => setStatusMsg({ type: '', text: '' }), 4000); 
          }}>
            
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>Provider</label>
              <select 
                value={settings.whatsappProvider}
                onChange={(e) => setSettings({...settings, whatsappProvider: e.target.value})}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', background: '#fff' }}
              >
                <option value="meta">WhatsApp Cloud API (Meta)</option>
                <option value="local">Local WhatsApp Web App (Free)</option>
                <option value="twilio" disabled>Twilio (Coming Soon)</option>
              </select>
            </div>

            {settings.whatsappProvider === 'local' && (
              <div style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '15px' }}>Local WhatsApp Status</h3>
                
                {localStatus.isReady ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ padding: '8px 12px', background: '#d1fae5', color: '#065f46', borderRadius: '4px', fontWeight: 'bold', fontSize: '14px' }}>
                      ✅ Connected & Ready
                    </div>
                    <button 
                      type="button"
                      onClick={async () => {
                        await api.post('/whatsapp/logout');
                        fetchLocalStatus();
                      }}
                      style={{ padding: '8px 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                      Logout
                    </button>
                  </div>
                ) : localStatus.qrCodeDataURL ? (
                  <div>
                    <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '10px' }}>
                      Scan this QR code with your WhatsApp app (Linked Devices) to connect your number automatically.
                    </p>
                    <img src={localStatus.qrCodeDataURL} alt="WhatsApp QR Code" style={{ border: '4px solid #fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                  </div>
                ) : (
                  <p style={{ fontSize: '13px', color: '#64748b' }}>Generating QR Code... (ensure backend is running)</p>
                )}
              </div>
            )}

            {settings.whatsappProvider === 'meta' && (
              <>

            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>Phone Number ID (Meta API)</label>
              <input 
                type="text" 
                value={settings.whatsappPhoneId}
                onChange={(e) => setSettings({...settings, whatsappPhoneId: e.target.value})}
                placeholder="e.g. 10123456789" 
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} 
              />
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '6px' }}>Access Token (Meta API)</label>
              <input 
                type="password" 
                value={settings.whatsappToken}
                onChange={(e) => setSettings({...settings, whatsappToken: e.target.value})}
                placeholder="Enter your permanent access token..." 
                style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} 
              />
            </div>

              <button type="submit" style={{ padding: '12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>
                Save API Configuration
              </button>
            </>
            )}

            {settings.whatsappProvider === 'local' && (
              <button type="submit" style={{ padding: '12px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}>
                Save Local Configuration
              </button>
            )}
          </form>
        </div>
      )}

    </div>
  );
}
