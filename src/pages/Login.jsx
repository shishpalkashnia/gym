import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Dumbbell } from 'lucide-react'

export default function Login() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [gymName, setGymName] = useState('')
  const [error, setError] = useState(null)
  
  // Optional: Add simple toggle for sign up if you want to let the user create their own account easily without Auth dashboard
  const [isSignUp, setIsSignUp] = useState(false) 

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    let result;
    if (isSignUp) {
      if (!gymName.trim()) {
        setError("Gym/Business Name is required.")
        setLoading(false)
        return
      }
      
      result = await supabase.auth.signUp({
        email,
        password,
      })

      if (!result.error && result.data?.user) {
        // Automatically scaffold their new business instance
        const { data: gymData, error: gymError } = await supabase
          .from('gyms')
          .insert({ name: gymName })
          .select()
        
        if (!gymError && gymData?.length > 0) {
          // Link new user to their new business
          await supabase.from('user_gym').insert({
            user_id: result.data.user.id,
            gym_id: gymData[0].id
          })
        }
      }
    } else {
      result = await supabase.auth.signInWithPassword({
        email,
        password,
      })
    }

    if (result.error) {
      setError(result.error.message)
    } else if (isSignUp) {
      setError("Registration successful! Check your email for a confirmation link.")
    }
    setLoading(false)
  }

  return (
    <div className="app-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
        <h2 style={{ justifyContent: 'center', marginBottom: '2rem', fontSize: '1.5rem', color: 'var(--primary)' }}>
          <Dumbbell /> FitCore
        </h2>
        
        {error && (
          <div className="bg-danger-light mb-4" style={{ padding: '1rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleAuth}>
          <div className="form-group">
            <label>Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>
          
          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>

          {isSignUp && (
            <div className="form-group">
              <label>Gym/Business Name</label>
              <input 
                type="text" 
                value={gymName}
                onChange={(e) => setGymName(e.target.value)}
                required={isSignUp} 
                placeholder="e.g. Iron Forge Fitness"
              />
            </div>
          )}
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </form>
        
        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem' }}>
          <button 
            type="button" 
            onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
          </button>
        </div>
      </div>
    </div>
  )
}
