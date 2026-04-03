import { useState, useEffect } from 'react'
import { Trophy, Flame, Dumbbell, Timer, Medal } from 'lucide-react'
import { useGym } from '../context/GymContext'
import { fetchLeaderboardStats, STRENGTH_EXERCISES } from '../utils/leaderboard'

export default function Leaderboard() {
  const { activeGym } = useGym()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('consistency') // 'consistency', 'strength', 'cardio'
  const [leaderboards, setLeaderboards] = useState(null)

  useEffect(() => {
    if (activeGym?.id) {
      loadData()
    }
  }, [activeGym])

  const loadData = async () => {
    setLoading(true)
    const stats = await fetchLeaderboardStats(activeGym.id)
    setLeaderboards(stats.leaderboards)
    setLoading(false)
  }

  const renderRankBadge = (index) => {
    if (index === 0) return <div style={{ background: '#fef08a', color: '#854d0e', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}><Medal size={14}/> 1st</div>
    if (index === 1) return <div style={{ background: '#e5e7eb', color: '#374151', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}><Medal size={14}/> 2nd</div>
    if (index === 2) return <div style={{ background: '#fed7aa', color: '#9a3412', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}><Medal size={14}/> 3rd</div>
    return <div className="badge" style={{ padding: '4px 10px', fontWeight: '600' }}>{index + 1}th</div>
  }

  return (
    <div className="main-content">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 className="header-title">Gym Leaderboard</h2>
          <p className="text-muted">Top performers in {activeGym?.name}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button 
          className={`btn ${activeTab === 'consistency' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('consistency')}
          style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
        >
          <Flame size={18} /> Consistency
        </button>
        <button 
          className={`btn ${activeTab === 'strength' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('strength')}
          style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
        >
          <Dumbbell size={18} /> Strength
        </button>
        <button 
          className={`btn ${activeTab === 'cardio' ? 'btn-primary' : ''}`}
          onClick={() => setActiveTab('cardio')}
          style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
        >
          <Timer size={18} /> Cardio
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Calculating ranks...</div>
      ) : (
        <div className="card">
          {activeTab === 'consistency' && (
            <div>
              <div className="card-header" style={{ padding: '1rem 0' }}>
                <h3 className="section-title"><Flame size={18} color="#f97316"/> 7-Day Consistency</h3>
                <p className="text-muted" style={{ fontSize: '0.85rem' }}>Members with highest number of workouts logged this week (min. 2).</p>
              </div>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Member Name</th>
                      <th style={{ textAlign: 'right' }}>Active Days</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboards?.consistency?.length > 0 ? leaderboards.consistency.map((m, idx) => (
                      <tr key={m.id}>
                        <td>{renderRankBadge(idx)}</td>
                        <td style={{ fontWeight: '500' }}>{m.name || 'Unknown Member'}</td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{m.count}</td>
                      </tr>
                    )) : <tr><td colSpan="3" style={{ textAlign: 'center' }}>No consistency data yet for this week.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'cardio' && (
            <div>
              <div className="card-header" style={{ padding: '1rem 0' }}>
                <h3 className="section-title"><Timer size={18} color="#3b82f6"/> 7-Day Cardio Kings</h3>
                <p className="text-muted" style={{ fontSize: '0.85rem' }}>Members with highest total duration on cardio machines this week.</p>
              </div>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Member Name</th>
                      <th style={{ textAlign: 'right' }}>Total Duration (Mins)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboards?.cardio?.length > 0 ? leaderboards.cardio.map((m, idx) => (
                      <tr key={m.id}>
                        <td>{renderRankBadge(idx)}</td>
                        <td style={{ fontWeight: '500' }}>{m.name || 'Unknown Member'}</td>
                        <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{m.duration} mins</td>
                      </tr>
                    )) : <tr><td colSpan="3" style={{ textAlign: 'center' }}>No cardio logged this week.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'strength' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {STRENGTH_EXERCISES.map(exerciseName => (
                <div key={exerciseName}>
                  <div className="card-header" style={{ padding: '1rem 0' }}>
                    <h3 className="section-title"><Dumbbell size={18} /> {exerciseName} PRs</h3>
                  </div>
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Rank</th>
                          <th>Member Name</th>
                          <th style={{ textAlign: 'right' }}>Max Weight</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaderboards?.strength[exerciseName]?.length > 0 ? leaderboards.strength[exerciseName].map((m, idx) => (
                          <tr key={`${exerciseName}-${m.id}`}>
                            <td>{renderRankBadge(idx)}</td>
                            <td style={{ fontWeight: '500' }}>{m.name || 'Unknown Member'}</td>
                            <td style={{ textAlign: 'right', fontWeight: 'bold' }}>{m.maxWeight} {exerciseName === 'Barbell Squat' ? 'kg' : 'kg'}</td>
                          </tr>
                        )) : <tr><td colSpan="3" style={{ textAlign: 'center' }}>No 1RMs logged for this exercise yet.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
