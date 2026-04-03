import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Search, UserCheck, AlertCircle, Edit2, Trash2, MessageCircle, CalendarDays } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useGym } from '../context/GymContext'

export default function Members() {
  const { activeGym } = useGym()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState(null)
  
  // Form State Setup
  const getEmptyForm = () => ({
    name: '',
    phone: '',
    join_date: new Date().toISOString().split('T')[0],
    expiry_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
    initial_payment: ''
  })
  
  const [formData, setFormData] = useState(getEmptyForm())

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('gym_id', activeGym.id)
      .order('created_at', { ascending: false })

    if (error) console.error(error)
    else setMembers(data || [])
    
    setLoading(false)
  }

  const handleSubmitMember = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    if (editingId) {
      // Update existing
      const { error: memberError } = await supabase
        .from('members')
        .update({
          name: formData.name,
          phone: formData.phone,
          join_date: formData.join_date,
          expiry_date: formData.expiry_date
        })
        .eq('id', editingId)
        
      if (memberError) {
        alert("Error updating member: " + memberError.message)
      } else {
        setShowAdd(false)
        setEditingId(null)
        setFormData(getEmptyForm())
        fetchMembers()
      }
    } else {
      // Insert New Member
      const { data: insertedMember, error: memberError } = await supabase
        .from('members')
        .insert([{
          name: formData.name,
          phone: formData.phone,
          join_date: formData.join_date,
          expiry_date: formData.expiry_date,
          gym_id: activeGym.id
        }])
        .select()
      
      if (memberError) {
        alert("Error adding member: " + memberError.message)
        setLoading(false)
        return
      }

      // Conditionally Insert Payment
      if (formData.initial_payment && parseFloat(formData.initial_payment) > 0) {
        const { error: paymentError } = await supabase
          .from('payments')
          .insert([{
            member_id: insertedMember[0].id,
            amount: parseFloat(formData.initial_payment),
            payment_date: formData.join_date,
            gym_id: activeGym.id
          }])
          
        if (paymentError) {
          alert("Member created, but recording payment failed: " + paymentError.message)
        }
      }
      
      setShowAdd(false)
      setFormData(getEmptyForm())
      fetchMembers()
    }
    setLoading(false)
  }

  const handleEdit = (member) => {
    setFormData({
      name: member.name,
      phone: member.phone || '',
      join_date: member.join_date,
      expiry_date: member.expiry_date,
      initial_payment: ''
    })
    setEditingId(member.id)
    setShowAdd(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to completely remove ${name}? This action cannot be undone and will delete their payment history.`)) {
      setLoading(true)
      // Delete existing payments to bypass Foreign Key constraints safely
      await supabase.from('payments').delete().eq('member_id', id)
      
      const { error } = await supabase.from('members').delete().eq('id', id)
      if (error) {
        alert("Error removing member: " + error.message)
      } else {
        fetchMembers()
      }
      setLoading(false)
    }
  }

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    (m.phone && m.phone.includes(search))
  )

  const isExpired = (dateString) => {
    return new Date(dateString) < new Date()
  }

  return (
    <div>
      <div className="flex-between mb-4">
        <h1 className="header-title">Members</h1>
        <button className="btn btn-primary" onClick={() => {
          if (showAdd) {
            setShowAdd(false)
            setEditingId(null)
            setFormData(getEmptyForm())
          } else {
            setShowAdd(true)
          }
        }}>
          {showAdd ? 'Cancel' : <><Plus size={18} /> Add Member</>}
        </button>
      </div>

      {showAdd && (
        <div className="card mb-4" style={{ backgroundColor: 'var(--sidebar-hover)' }}>
          <h2 className="section-title">{editingId ? 'Edit Member Details' : 'New Member Registration'}</h2>
          <form onSubmit={handleSubmitMember} className="grid-2">
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Join Date</label>
              <input type="date" required value={formData.join_date} onChange={(e) => setFormData({...formData, join_date: e.target.value})} />
            </div>
            <div className="form-group">
              <label>Expiry Date</label>
              <input type="date" required value={formData.expiry_date} onChange={(e) => setFormData({...formData, expiry_date: e.target.value})} />
            </div>
            {!editingId && (
              <div className="form-group">
                <label>Initial Payment (Amount)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00 (Optional)"
                  value={formData.initial_payment} 
                  onChange={(e) => setFormData({...formData, initial_payment: e.target.value})} 
                />
              </div>
            )}
            <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem' }}>
              <button disabled={loading} type="submit" className="btn btn-primary">
                {editingId ? 'Save Changes' : 'Save Member'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="form-group mb-4 form-group-search">
          <Search size={18} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search by name or mobile..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading && members.length === 0 ? (
          <p className="text-muted">Loading members...</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Join Date</th>
                  <th>Status/Expiry</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member) => {
                  const expired = isExpired(member.expiry_date)
                  return (
                    <tr key={member.id} className="table-row-hover">
                      <td className="fw-600">{member.name}</td>
                      <td className="text-muted">{member.phone || '-'}</td>
                      <td className="text-muted-xs">{member.join_date}</td>
                      <td>
                        <span className={`status-badge ${expired ? 'badge-danger' : 'badge-success'}`}>
                          {expired ? <AlertCircle size={14} /> : <UserCheck size={14} />}
                          {member.expiry_date}
                        </span>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-start' }}>
                          {member.phone && (
                            <a 
                              href={`https://wa.me/${member.phone.replace(/[^\d+]/g, '')}?text=${encodeURIComponent(`Hi ${member.name}, your gym membership is expiring on ${member.expiry_date}. Renew soon to continue your training 💪`)}`} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="btn btn-sm"
                              style={{ backgroundColor: '#25D366', color: 'white', padding: '0.4rem 0.5rem', borderRadius: '8px' }}
                              title="Send WhatsApp Reminder"
                            >
                              <MessageCircle size={14} />
                            </a>
                          )}
                          <Link 
                            to="/payments" 
                            state={{ memberId: member.id, memberName: member.name }} 
                            className="btn btn-primary btn-sm"
                            style={{ padding: '0.4rem 0.6rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                            title="Renew Membership"
                          >
                            <CalendarDays size={14} /> Renew
                          </Link>
                          <button 
                            onClick={() => handleEdit(member)} 
                            className="btn btn-sm" 
                            style={{ backgroundColor: 'var(--card-border)', color: 'var(--text-color)', padding: '0.4rem 0.5rem', borderRadius: '8px' }}
                            title="Edit Member"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            onClick={() => handleDelete(member.id, member.name)} 
                            className="btn btn-sm btn-danger" 
                            style={{ padding: '0.4rem 0.5rem', borderRadius: '8px' }}
                            title="Remove Member"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filteredMembers.length === 0 && (
              <p className="text-muted mt-4 text-center">No members found matching that search.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
