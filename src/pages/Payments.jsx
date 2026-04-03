import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useLocation } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useGym } from '../context/GymContext'

export default function Payments() {
  const { activeGym } = useGym()
  const location = useLocation()
  
  const [payments, setPayments] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(location.state?.memberId ? true : false)
  
  const [formData, setFormData] = useState({
    member_id: location.state?.memberId || '',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0]
  })

  // To optionally update the expiry date of the member when a payment is made
  const [extendExpiry, setExtendExpiry] = useState(true)
  const [extendMonths, setExtendMonths] = useState(1)

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    setLoading(true)
    
    // Fetch members for dropdown
    const { data: membersData } = await supabase.from('members').select('id, name').eq('gym_id', activeGym.id)
    setMembers(membersData || [])

    // Fetch payments
    const { data: paymentsData } = await supabase
      .from('payments')
      .select('*, members!inner(name)')
      .eq('gym_id', activeGym.id)
      .order('created_at', { ascending: false })
      
    setPayments(paymentsData || [])
    
    setLoading(false)
  }

  const handleAddPayment = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    const { error } = await supabase.from('payments').insert([{
      member_id: formData.member_id,
      amount: parseFloat(formData.amount),
      payment_date: formData.payment_date,
      gym_id: activeGym.id
    }])
    
    if (error) {
      alert("Error adding payment: " + error.message)
    } else {
      if (extendExpiry && extendMonths > 0) {
        // Simple logic: extend expiry by specified months from today, or from current expiry if it's in the future
        const { data: memberData } = await supabase.from('members').select('expiry_date').eq('id', formData.member_id).single()
        
        let basePathDate = new Date()
        if (memberData && new Date(memberData.expiry_date) > basePathDate) {
          basePathDate = new Date(memberData.expiry_date)
        }
        
        basePathDate.setMonth(basePathDate.getMonth() + parseInt(extendMonths))
        const newExpiry = basePathDate.toISOString().split('T')[0]
        
        await supabase.from('members').update({ expiry_date: newExpiry }).eq('id', formData.member_id)
      }

      setShowAdd(false)
      fetchInitialData()
      setFormData({...formData, amount: ''})
    }
    setLoading(false)
  }

  return (
    <div>
      <div className="flex-between mb-4">
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Payments</h1>
        <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>
          <Plus size={18} /> {showAdd ? 'Cancel' : 'Add Payment'}
        </button>
      </div>

      {showAdd && (
        <div className="card mb-4" style={{ backgroundColor: 'var(--sidebar-hover)' }}>
          <h2>Record Payment</h2>
          <form onSubmit={handleAddPayment} className="grid-2">
            <div className="form-group">
              <label>Select Member</label>
              <select 
                required 
                value={formData.member_id} 
                onChange={(e) => setFormData({...formData, member_id: e.target.value})}
              >
                <option value="" disabled>Select a member...</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Amount (₹)</label>
              <input 
                type="number" 
                step="0.01"
                required 
                placeholder="0.00"
                value={formData.amount} 
                onChange={(e) => setFormData({...formData, amount: e.target.value})} 
              />
            </div>
            
            <div className="form-group">
              <label>Payment Date</label>
              <input 
                type="date" 
                required 
                value={formData.payment_date} 
                onChange={(e) => setFormData({...formData, payment_date: e.target.value})} 
              />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1', flexDirection: 'row', alignItems: 'center', marginTop: '1rem', gap: '0.5rem', display: 'flex', flexWrap: 'wrap' }}>
              <input 
                type="checkbox" 
                id="extendExpiry"
                checked={extendExpiry} 
                onChange={(e) => setExtendExpiry(e.target.checked)} 
                style={{ width: 'auto' }}
              />
              <label htmlFor="extendExpiry" style={{ cursor: 'pointer', margin: 0, whiteSpace: 'nowrap' }}>Automatically extend membership by</label>
              <input 
                 type="number" 
                 min="1"
                 value={extendMonths}
                 onChange={(e) => setExtendMonths(e.target.value)}
                 disabled={!extendExpiry}
                 style={{ width: '70px', padding: '0.25rem', textAlign: 'center', margin: '0' }}
              />
              <span style={{ color: 'var(--text-color)', fontWeight: 500 }}>months</span>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <button disabled={loading} type="submit" className="btn btn-primary">Save Payment</button>
            </div>
          </form>
        </div>
      )}

      {loading && payments.length === 0 ? (
        <div className="card">
          <p>Loading history...</p>
        </div>
      ) : (
        <>
          {payments.length === 0 ? (
            <div className="card">
              <p className="text-muted mt-4 text-center">No payment history found.</p>
            </div>
          ) : (
            Object.values(payments.reduce((acc, current) => {
              const d = new Date(current.payment_date);
              const monthYear = d.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
              const sortKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

              if (!acc[sortKey]) {
                 acc[sortKey] = {
                   sortKey,
                   monthYear,
                   totalRevenue: 0,
                   payments: []
                 };
              }
              acc[sortKey].payments.push(current);
              acc[sortKey].totalRevenue += parseFloat(current.amount) || 0;
              return acc;
            }, {}))
            .sort((a, b) => b.sortKey.localeCompare(a.sortKey))
            .map((group) => (
              <div key={group.sortKey} className="card mb-4" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid var(--card-border)', backgroundColor: 'rgba(0,0,0,0.02)' }}>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>{group.monthYear}</h3>
                  <div style={{ color: 'var(--success)', fontWeight: '800', fontSize: '1.1rem', background: 'var(--bg-color)', padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                     Revenue: ₹{group.totalRevenue.toFixed(2)}
                  </div>
                </div>
                
                <div className="table-container" style={{ margin: 0 }}>
                  <table style={{ margin: 0 }}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Member</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.payments.map((payment) => (
                        <tr key={payment.id}>
                          <td style={{ color: 'var(--text-muted)' }}>{payment.payment_date}</td>
                          <td style={{ fontWeight: 600 }}>{payment.members?.name || 'Unknown Member'}</td>
                          <td style={{ fontWeight: 'bold', color: 'var(--text-color)' }}>
                            ₹{Number(payment.amount).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </>
      )}
    </div>
  )
}
