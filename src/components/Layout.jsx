import { NavLink } from 'react-router-dom'
import { Dumbbell, LayoutDashboard, Users, CreditCard, LogOut, Trophy } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useGym } from '../context/GymContext'

export default function Layout({ children }) {
  const { activeGym } = useGym()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="app-container">
      <nav className="sidebar">
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            <Dumbbell shrink={0} /> {activeGym ? activeGym.name : 'Your Gym'}
          </h1>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500, paddingLeft: '2.5rem' }}>Powered by FitCore</div>
        </div>
        
        <NavLink to="/" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>
        
        <NavLink to="/members" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          <Users size={20} />
          <span>Members</span>
        </NavLink>
        
        <NavLink to="/payments" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          <CreditCard size={20} />
          <span>Payments</span>
        </NavLink>

        <NavLink to="/leaderboard" className={({isActive}) => isActive ? "nav-item active" : "nav-item"}>
          <Trophy size={20} />
          <span>Leaderboard</span>
        </NavLink>

        <div className="spacer"></div>
        
        <button onClick={handleSignOut} className="nav-item" style={{ background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%'}}>
          <LogOut size={20} className="text-danger" />
          <span className="text-danger">Sign Out</span>
        </button>
      </nav>
      
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}
