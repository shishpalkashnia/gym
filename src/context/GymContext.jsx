import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const GymContext = createContext()

export function GymProvider({ children, session }) {
  const [activeGym, setActiveGym] = useState(null)
  const [loadingGym, setLoadingGym] = useState(true)

  useEffect(() => {
    if (session?.user) {
      fetchGym()
    } else {
      setActiveGym(null)
      setLoadingGym(false)
    }
  }, [session])

  const fetchGym = async () => {
    setLoadingGym(true)
    // Basic multi-tenant: get the user's first linked gym
    const { data, error } = await supabase
      .from('user_gym')
      .select('gym_id, gyms(id, name)')
      .eq('user_id', session.user.id)
      .limit(1)

    if (error) {
      console.error("Error fetching user gyms:", error)
    } else if (data && data.length > 0) {
      setActiveGym({
        id: data[0].gym_id,
        name: data[0].gyms.name
      })
    }
    setLoadingGym(false)
  }

  const refreshGym = () => fetchGym()

  return (
    <GymContext.Provider value={{ activeGym, loadingGym, refreshGym }}>
      {children}
    </GymContext.Provider>
  )
}

export function useGym() {
  return useContext(GymContext)
}
