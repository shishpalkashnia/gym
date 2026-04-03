import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Users, AlertTriangle, ArrowRight, Activity, CalendarDays, MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { useGym } from '../context/GymContext'

export default function Dashboard() {
  const { activeGym } = useGym()
  const [stats, setStats] = useState({
    totalMembers: 0,
    expiringSoon: [],
    loading: true
  })

  const workoutUrl = `${window.location.origin}/gym/${activeGym?.id}/log`

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Get total members
      const { count: total, error: countError } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('gym_id', activeGym.id)

      if (countError) throw countError

      // Get members expiring in next 7 days
      const today = new Date()
      const nextWeek = new Date()
      nextWeek.setDate(today.getDate() + 7)

      const { data: expiring, error: expireError } = await supabase
        .from('members')
        .select('*')
        .eq('gym_id', activeGym.id)
        .gte('expiry_date', today.toISOString().split('T')[0])
        .lte('expiry_date', nextWeek.toISOString().split('T')[0])
        .order('expiry_date', { ascending: true })

      if (expireError) throw expireError

      setStats({
        totalMembers: total || 0,
        expiringSoon: expiring || [],
        loading: false
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setStats(prev => ({ ...prev, loading: false }))
    }
  }

  if (stats.loading) return <div className="text-muted">Loading metrics...</div>

  return (
    <div>
      <div className="flex-between mb-4">
        <h1 className="header-title">Overview</h1>
        <div className="status-badge" style={{ padding: '0.5rem 1rem', background: 'var(--card-bg)' }}>
          <Activity size={14} color="var(--success)" /> <span className="text-muted-xs">Live Status</span>
        </div>
      </div>
      
      <div className="grid-2">
        <div className="card card-stat">
          <div className="card-stat-header">
            <h2 className="card-stat-title">Active Members</h2>
            <div className="icon-wrapper base-icon"><Users size={16} /></div>
          </div>
          <p className="card-stat-value">
            {stats.totalMembers}
          </p>
          <span className="card-stat-subtitle">+ Total registered accounts</span>
        </div>

        <div className={`card card-stat ${stats.expiringSoon.length > 0 ? 'card-stat-danger' : ''}`}>
          <div className="card-stat-header">
            <h2 className="card-stat-title">Expiring in 7 Days</h2>
            <div className={`icon-wrapper ${stats.expiringSoon.length > 0 ? 'danger-icon' : 'base-icon'}`}>
              <AlertTriangle size={16} />
            </div>
          </div>
          <p className="card-stat-value">
            {stats.expiringSoon.length}
          </p>
          <span className="card-stat-subtitle">Memberships requiring renewal validation</span>
        </div>
      </div>

      <div className="card mt-4 p-compact">
        <div className="card-header pb-3">
          <h2 className="section-title"><CalendarDays size={18}/> Expiration Pipeline</h2>
        </div>
        {stats.expiringSoon.length === 0 ? (
          <p className="text-muted p-3">No members expiring in the next 7 days. You're clear!</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {stats.expiringSoon.map((member) => (
                  <tr key={member.id} className="table-row-hover">
                    <td className="fw-600">{member.name}</td>
                    <td className="text-muted">{member.phone || '-'}</td>
                    <td className="text-danger fw-600">{member.expiry_date}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-start' }}>
                        {member.phone && (
                          <a 
                            href={`https://wa.me/${member.phone.replace(/[^\d+]/g, '')}?text=${encodeURIComponent(`Hi ${member.name}, your gym membership is expiring on ${member.expiry_date}. Renew soon to continue your training 💪`)}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="btn btn-sm"
                            style={{ backgroundColor: '#25D366', color: 'white', display: 'inline-flex', padding: '0.4rem 0.5rem', borderRadius: '8px' }}
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card mt-4 p-compact">
        <div className="card-header pb-3">
          <h2 className="section-title">Gym Floor Kiosk (QR Code)</h2>
        </div>
        <div className="p-3" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', border: '1px solid #eaeaea', marginBottom: '1rem' }}>
            <QRCodeSVG value={workoutUrl} size={150} level="M" />
          </div>
          <p className="text-muted text-center" style={{ maxWidth: '400px' }}>
            Print this QR code and place it on your gym floor. Members can scan it to instantly log their workouts without needing to download an app or log in!
          </p>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <a href={workoutUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
               Preview Member Experience
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
