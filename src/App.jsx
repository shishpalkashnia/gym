import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import { GymProvider, useGym } from './context/GymContext'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Members from './pages/Members'
import Payments from './pages/Payments'
import Leaderboard from './pages/Leaderboard'
import Login from './pages/Login'
import PublicWorkoutLog from './pages/PublicWorkoutLog'
import { Dumbbell } from 'lucide-react'

function SetupGym() {
  const [gymName, setGymName] = useState('')
  const [loading, setLoading] = useState(false)
  const { refreshGym } = useGym()

  const handleSetup = async (e) => {
    e.preventDefault()
    if (!gymName.trim()) return
    setLoading(true)

    const { data: userData } = await supabase.auth.getUser()
    if (userData?.user) {
      const { data: gymData, error: gymError } = await supabase
        .from('gyms')
        .insert({ name: gymName })
        .select()

      if (!gymError && gymData?.length > 0) {
        await supabase.from('user_gym').insert({
          user_id: userData.user.id,
          gym_id: gymData[0].id
        })
        refreshGym()
      }
    }
    setLoading(false)
  }

  return (
    <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
        <h2 style={{ justifyContent: 'center', marginBottom: '1.5rem', fontSize: '1.5rem', color: 'var(--primary)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Dumbbell /> Setup Your Gym
        </h2>
        <p className="text-muted mb-4 text-center">Your account isn't linked to a business space yet. Create one below to begin.</p>
        <form onSubmit={handleSetup}>
          <div className="form-group mb-4">
            <label>Gym / Business Name</label>
            <input 
              type="text" 
              required
              value={gymName} 
              onChange={(e) => setGymName(e.target.value)} 
              placeholder="e.g. Iron Forge Fitness" 
            />
          </div>
          <button disabled={loading} type="submit" className="btn btn-primary" style={{ width: '100%', marginBottom: '1rem' }}>
            {loading ? 'Setting up...' : 'Create Gym Workspace'}
          </button>
          <button type="button" onClick={() => supabase.auth.signOut()} className="btn" style={{ width: '100%', background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--card-border)' }}>
            Sign Out
          </button>
        </form>
      </div>
    </div>
  )
}

function AuthenticatedApp() {
  const { activeGym, loadingGym } = useGym()

  if (loadingGym) {
    return <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>Loading Workspace...</div>
  }

  if (!activeGym) {
    return <SetupGym />
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/members" element={<Members />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <Router>
      <Routes>
        <Route path="/gym/:gymId/log" element={<PublicWorkoutLog />} />
        <Route path="*" element={
          loading ? (
            <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>Loading...</div>
          ) : !session ? (
            <Login />
          ) : (
            <GymProvider session={session}>
              <AuthenticatedApp />
            </GymProvider>
          )
        } />
      </Routes>
    </Router>
  )
}

export default App
