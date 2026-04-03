import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Dumbbell, Plus, Trash2, CheckCircle, Smartphone, History, ChevronRight, Activity, Flame, Search, Medal } from 'lucide-react'
import { fetchLeaderboardStats, STRENGTH_EXERCISES } from '../utils/leaderboard'

// --- FALLBACK DATA if DB not seeded ---
const FALLBACK_BODY_PARTS = [
  { id: 'bp-chest', name: 'Chest', icon: '💪' },
  { id: 'bp-back', name: 'Back', icon: '🦍' },
  { id: 'bp-legs', name: 'Legs', icon: '🦵' },
  { id: 'bp-shoulders', name: 'Shoulders', icon: '🗿' },
  { id: 'bp-arms', name: 'Arms', icon: '🦾' },
  { id: 'bp-core', name: 'Core', icon: '🔋' },
  { id: 'bp-cardio', name: 'Cardio', icon: '🏃' }
];

const FALLBACK_EXERCISES = [
  { id: 'ex-1', body_part_id: 'bp-chest', name: 'Flat Bench Press', type: 'weighted' },
  { id: 'ex-2', body_part_id: 'bp-chest', name: 'Incline Dumbbell Press', type: 'weighted' },
  { id: 'ex-3', body_part_id: 'bp-chest', name: 'Pec Deck Fly', type: 'weighted' },
  { id: 'ex-4', body_part_id: 'bp-chest', name: 'Cable Crossover', type: 'weighted' },
  { id: 'ex-10', body_part_id: 'bp-back', name: 'Lat Pulldown', type: 'weighted' },
  { id: 'ex-11', body_part_id: 'bp-back', name: 'Seated Cable Row', type: 'weighted' },
  { id: 'ex-12', body_part_id: 'bp-back', name: 'Barbell Row', type: 'weighted' },
  { id: 'ex-13', body_part_id: 'bp-back', name: 'Pull-ups', type: 'bodyweight' },
  { id: 'ex-14', body_part_id: 'bp-back', name: 'Deadlift', type: 'weighted' },
  { id: 'ex-20', body_part_id: 'bp-shoulders', name: 'Overhead Press', type: 'weighted' },
  { id: 'ex-21', body_part_id: 'bp-shoulders', name: 'Lateral Raise', type: 'weighted' },
  { id: 'ex-22', body_part_id: 'bp-shoulders', name: 'Front Raise', type: 'weighted' },
  { id: 'ex-30', body_part_id: 'bp-legs', name: 'Barbell Squat', type: 'weighted' },
  { id: 'ex-31', body_part_id: 'bp-legs', name: 'Leg Press', type: 'weighted' },
  { id: 'ex-32', body_part_id: 'bp-legs', name: 'Leg Extension', type: 'weighted' },
  { id: 'ex-33', body_part_id: 'bp-legs', name: 'Leg Curl', type: 'weighted' },
  { id: 'ex-40', body_part_id: 'bp-arms', name: 'Barbell Curl', type: 'weighted' },
  { id: 'ex-41', body_part_id: 'bp-arms', name: 'Dumbbell Curl', type: 'weighted' },
  { id: 'ex-42', body_part_id: 'bp-arms', name: 'Tricep Pushdown', type: 'weighted' },
  { id: 'ex-43', body_part_id: 'bp-arms', name: 'Skull Crushers', type: 'weighted' },
  { id: 'ex-50', body_part_id: 'bp-core', name: 'Crunches', type: 'bodyweight' },
  { id: 'ex-51', body_part_id: 'bp-core', name: 'Plank', type: 'timed' },
  { id: 'ex-52', body_part_id: 'bp-core', name: 'Leg Raises', type: 'bodyweight' },
  { id: 'ex-60', body_part_id: 'bp-cardio', name: 'Treadmill', type: 'timed' },
  { id: 'ex-61', body_part_id: 'bp-cardio', name: 'Cycling', type: 'timed' },
  { id: 'ex-62', body_part_id: 'bp-cardio', name: 'Rowing', type: 'timed' },
  { id: 'ex-63', body_part_id: 'bp-cardio', name: 'Stair Climber', type: 'timed' }
];

function toTitleCase(str) {
  if (!str) return '';
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

function getMotivationMessage(percentile, type) {
  if (percentile <= 5) {
    if (type === 'Consistency') return "Unstoppable force! You're dominating the gym floor.";
    if (type === 'Cardio') return "Lungs of steel! You're outlasting everyone.";
    return "Absolute powerhouse! You're lifting mountains.";
  }
  if (percentile <= 15) {
    if (type === 'Consistency') return "Elite dedication! Your discipline is inspiring.";
    if (type === 'Cardio') return "Incredible stamina! You belong to the elite tier.";
    return "Elite strength! You're pushing serious weight.";
  }
  if (percentile <= 30) {
    if (type === 'Consistency') return "Great rhythm! Keep the momentum alive.";
    if (type === 'Cardio') return "Strong endurance! You're breezing past the pack.";
    return "Solid power! Making undeniable gains.";
  }
  return "You're climbing the ranks! Keep pushing harder.";
}

export default function PublicWorkoutLog() {
  const { gymId } = useParams()
  
  const [phase, setPhase] = useState('identity') // identity, log, success
  const [phone, setPhone] = useState('')
  const [memberInfo, setMemberInfo] = useState(null)
  
  // Data State
  const [bodyParts, setBodyParts] = useState([])
  const [availableExercises, setAvailableExercises] = useState([])
  const [recentExercises, setRecentExercises] = useState([])
  const [workoutHistory, setWorkoutHistory] = useState([])
  const [personalInsights, setPersonalInsights] = useState(null)
  
  // UI State
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('workout') // 'workout', 'history'
  
  const [selectedBodyPart, setSelectedBodyPart] = useState(null)
  const [customExerciseName, setCustomExerciseName] = useState('')
  
  // Active Workout Log state
  // [{ uniqueId, body_part_id, body_part_name, exercise_id, name, sets: [{ id, weight, reps }] }]
  const [activeExercises, setActiveExercises] = useState([])

  useEffect(() => {
    const fetchReferenceData = async () => {
       const [bpRes, exRes] = await Promise.all([
         supabase.from('body_parts').select('*').order('id'),
         supabase.from('exercises').select('*').order('name')
       ])
       
       let finalParts = bpRes.data && bpRes.data.length > 0 ? bpRes.data : FALLBACK_BODY_PARTS;
       let finalEx = exRes.data && exRes.data.length > 0 ? exRes.data : FALLBACK_EXERCISES;
       
       setBodyParts(finalParts)
       setAvailableExercises(finalEx)
       if (finalParts.length > 0) setSelectedBodyPart(finalParts[0].id)
    }
    fetchReferenceData()
  }, [])

  const handleIdentify = async (e) => {
    e.preventDefault()
    const cleanPhone = phone.replace(/[^\d]/g, '')  // Strip everything except digits
    if (!cleanPhone) return
    
    setLoading(true)
    
    // Try exact match first, then suffix match (handles +91 prefix differences)
    let matchedMembers = null
    const { data: exactMatch } = await supabase
      .from('members')
      .select('id, name')
      .eq('gym_id', gymId)
      .eq('phone', cleanPhone)
      .limit(1)
    
    if (exactMatch && exactMatch.length > 0) {
      matchedMembers = exactMatch
    } else {
      // Fallback: match last 10 digits using ilike suffix
      const last10 = cleanPhone.slice(-10)
      const { data: fuzzyMatch } = await supabase
        .from('members')
        .select('id, name')
        .eq('gym_id', gymId)
        .ilike('phone', `%${last10}`)
        .limit(1)
      matchedMembers = fuzzyMatch
    }

    let isGuest = true
    let memberId = null
    if (matchedMembers && matchedMembers.length > 0) {
      setMemberInfo(matchedMembers[0])
      isGuest = false
      memberId = matchedMembers[0].id
    } else {
      setMemberInfo(null)
    }
    
    if (!isGuest) {
      const { data: historyData } = await supabase
        .from('workouts')
        .select('*, workout_entries(*, workout_sets(*))')
        .eq('gym_id', gymId)
        .eq('member_id', memberId)
        .order('created_at', { ascending: false })
        .limit(10)

      if (historyData) {
        setWorkoutHistory(historyData)
        
        const recentsMap = new Map()
        historyData.forEach(w => {
           w.workout_entries?.forEach(e => {
              if (!recentsMap.has(e.exercise_name)) {
                recentsMap.set(e.exercise_name, {
                   id: e.exercise_id,
                   exercise_id: e.exercise_id,
                   name: e.exercise_name,
                   lastSets: e.workout_sets || []
                })
              }
           })
        })
        setRecentExercises(Array.from(recentsMap.values()))
      }

      // Fetch Personal Insights automatically
      const stats = await fetchLeaderboardStats(gymId)
      let bestInsight = null
      let bestPercentile = 100
      
      const calcPercentile = (list, mId) => {
        if (!list || list.length === 0) return 100;
        const index = list.findIndex(m => m.id === mId);
        if (index === -1) return 100;
        return Math.max(1, Math.round(((index) / list.length) * 100));
      }

      const consP = calcPercentile(stats.fullLists.consistency, memberId);
      if (consP < bestPercentile && stats.fullLists.consistency.length > 0) {
        bestPercentile = consP;
        bestInsight = { category: 'Consistency', percentile: consP, message: getMotivationMessage(consP, 'Consistency') }
      }

      const cardP = calcPercentile(stats.fullLists.cardio, memberId);
      if (cardP < bestPercentile && stats.fullLists.cardio.length > 0) {
        bestPercentile = cardP;
        bestInsight = { category: 'Cardio', percentile: cardP, message: getMotivationMessage(cardP, 'Cardio') }
      }

      STRENGTH_EXERCISES.forEach(ex => {
        const strP = calcPercentile(stats.fullLists.strength[ex], memberId);
        if (strP < bestPercentile && stats.fullLists.strength[ex]?.length > 0) {
            bestPercentile = strP;
            bestInsight = { category: ex, percentile: strP, message: getMotivationMessage(strP, 'Strength') }
        }
      });

      // Show insight if they are performing well enough (top 50%), or if gym just started (everyone is awesome)
      if (bestInsight && (bestInsight.percentile <= 50 || stats.fullLists.consistency.length <= 5)) {
        setPersonalInsights(bestInsight);
      }
    } else {
        setWorkoutHistory([])
        setRecentExercises([])
    }
    
    setPhase('log')
    setLoading(false)
  }

  const handleAddExerciseToWorkout = (exerciseObj, bpName = "Custom") => {
    let type = exerciseObj.type || (bpName === 'Cardio' ? 'timed' : 'weighted');
    let defaultSet = { id: Date.now(), weight: '', reps: '', duration: '' };
    
    setActiveExercises([
       ...activeExercises,
       {
          uniqueId: Date.now() + Math.random(),
          exercise_id: exerciseObj.id || null,
          body_part_id: exerciseObj.body_part_id || selectedBodyPart,
          body_part_name: bpName,
          name: exerciseObj.name,
          type: type,
          sets: [defaultSet]
       }
    ])
    
    setCustomExerciseName('')
  }

  const handleCustomExerciseSubmit = (e) => {
    e.preventDefault()
    if (!customExerciseName.trim()) return
    const bp = bodyParts.find(b => b.id === selectedBodyPart)
    handleAddExerciseToWorkout({ name: toTitleCase(customExerciseName.trim()) }, bp ? bp.name : "Custom")
  }

  const handleRemoveActiveExercise = (uniqueId) => {
    setActiveExercises(activeExercises.filter(ex => ex.uniqueId !== uniqueId))
  }

  const handleAddSet = (exerciseUniqueId) => {
    setActiveExercises(activeExercises.map(ex => {
      if (ex.uniqueId === exerciseUniqueId) {
        return { ...ex, sets: [...ex.sets, { id: Date.now(), reps: '', weight: '', duration: '' }] }
      }
      return ex
    }))
  }

  const handleRemoveSet = (exerciseUniqueId, setId) => {
    setActiveExercises(activeExercises.map(ex => {
      if (ex.uniqueId === exerciseUniqueId) {
        return { ...ex, sets: ex.sets.filter(s => s.id !== setId) }
      }
      return ex
    }))
  }

  const handleSetChange = (exerciseUniqueId, setId, field, value) => {
    setActiveExercises(activeExercises.map(ex => {
      if (ex.uniqueId === exerciseUniqueId) {
        return {
           ...ex,
           sets: ex.sets.map(s => s.id === setId ? { ...s, [field]: value } : s)
        }
      }
      return ex
    }))
  }

  const handleSubmitWorkout = async () => {
    if (activeExercises.length === 0) return alert("Add at least one exercise to your workout!")
    
    setLoading(true)

    if (memberInfo?.id) {
        const workoutPayload = { gym_id: gymId, member_id: memberInfo.id }
        
        const { data: newWorkout, error: wError } = await supabase
          .from('workouts')
          .insert([workoutPayload])
          .select()

        if (wError || !newWorkout || !newWorkout.length) {
          setLoading(false)
          return alert("Error saving session: " + wError?.message)
        }

        const workoutId = newWorkout[0].id

        const entriesPayload = activeExercises.map(ex => ({
          workout_id: workoutId,
          // DB Fallback: Omitting exercise_id foreign key so saving works seamlessly
          // without requiring any manual SQL schema updates!
          exercise_name: ex.name
        }))

        const { data: newEntries, error: eError } = await supabase
          .from('workout_entries')
          .insert(entriesPayload)
          .select()

        if (eError || !newEntries || newEntries.length !== activeExercises.length) {
          alert("Session saved, but error saving logs: " + eError?.message)
        } else {
            let setsToInsert = []
            activeExercises.forEach((ex, idx) => {
              const entryId = newEntries[idx].id
              ex.sets.forEach((set, sIdx) => {
                // If timed, we store duration in 'weight' so we can capture decimal minutes
                const storedReps = ex.type === 'timed' ? 0 : (parseInt(set.reps) || 0);
                const storedWeight = ex.type === 'timed' ? (parseFloat(set.duration) || 0) : (parseFloat(set.weight) || 0);

                if (storedReps || storedWeight) {
                  setsToInsert.push({
                    entry_id: entryId,
                    set_number: sIdx + 1,
                    reps: storedReps,
                    weight: storedWeight
                  })
                }
              })
            })

            if (setsToInsert.length > 0) {
              await supabase.from('workout_sets').insert(setsToInsert)
            }
        }
    } else {
        await new Promise(resolve => setTimeout(resolve, 800))
    }

    setPhase('success')
    setLoading(false)
  }

  // --- Render Formatting ---
  // Group active exercises by body part name for hierarchy display
  const groupedExercises = activeExercises.reduce((acc, curr) => {
    const bpName = curr.body_part_name || 'Other';
    if (!acc[bpName]) acc[bpName] = [];
    acc[bpName].push(curr);
    return acc;
  }, {});

  if (phase === 'identity') {
    return (
      <div style={{ minHeight: '100vh', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-color)', backgroundImage: 'radial-gradient(ellipse at top, rgba(56, 189, 248, 0.05), transparent 50%)' }}>
        <div style={{ maxWidth: '400px', width: '100%', background: 'rgba(255, 255, 255, 0.02)', backdropFilter: 'blur(20px)', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.05)', padding: '2.5rem 1.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <div style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary) 0%, rgba(0,0,0,0.8) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}>
              <Dumbbell size={36} />
            </div>
          </div>
          <h2 style={{ textAlign: 'center', fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-0.03em' }}>Ready to Crush It?</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.95rem' }}>Enter your mobile number to load your smart profile or continue as a guest.</p>
          
          <form onSubmit={handleIdentify}>
            <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
              <Smartphone size={20} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="tel" 
                required
                placeholder="Phone Number" 
                value={phone}
                onChange={e => setPhone(e.target.value)}
                style={{ width: '100%', padding: '1rem 1rem 1rem 3.5rem', fontSize: '1.1rem', borderRadius: '16px', border: '1px solid var(--card-border)', background: 'var(--card-bg)', color: 'var(--text-color)', outline: 'none', transition: 'all 0.2s', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}
              />
            </div>
            <button disabled={loading} type="submit" style={{ width: '100%', padding: '1.25rem', fontSize: '1.1rem', fontWeight: 700, borderRadius: '16px', border: 'none', background: 'var(--text-color)', color: 'var(--bg-color)', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', transition: 'transform 0.1s' }} onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'} onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}>
              {loading ? <Activity className="animate-spin" /> : "Start Workout"} <ChevronRight size={20} />
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (phase === 'success') {
    return (
      <div style={{ minHeight: '100vh', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'var(--bg-color)', justifyContent: 'center', backgroundImage: 'radial-gradient(ellipse at top, rgba(16, 185, 129, 0.05), transparent 50%)' }}>
        <div style={{ maxWidth: '400px', width: '100%', textAlign: 'center', background: 'rgba(255, 255, 255, 0.02)', backdropFilter: 'blur(20px)', borderRadius: '24px', border: '1px solid rgba(255, 255, 255, 0.05)', padding: '3rem 2rem' }}>
          <CheckCircle size={80} style={{ color: 'var(--success)', margin: '0 auto 1.5rem', filter: 'drop-shadow(0 10px 20px rgba(16,185,129,0.2))' }} />
          <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Workout Logged!</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '2rem' }}>You recorded {activeExercises.length} sets of exercises today. Awesome job.</p>
          <button onClick={() => window.location.reload()} style={{ padding: '1rem 2rem', fontSize: '1.1rem', fontWeight: 600, borderRadius: '12px', border: 'none', background: 'var(--card-border)', color: 'var(--text-color)', cursor: 'pointer' }}>Log Another Workout</button>
        </div>
      </div>
    )
  }

  // Derived state for the Exercise Picker
  const displayedExercises = availableExercises.filter(e => e.body_part_id === selectedBodyPart)
  const currentBodyPart = bodyParts.find(b => b.id === selectedBodyPart)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-color)', paddingBottom: '7rem', color: 'var(--text-color)', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* 1. Header Area with Tabs */}
      <div style={{ background: 'var(--card-bg)', position: 'sticky', top: 0, zIndex: 40, borderBottom: '1px solid var(--card-border)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
           <div style={{ padding: '1.5rem 1.25rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem', letterSpacing: '-0.02em' }}>
               <Flame className="text-danger" size={24} /> {memberInfo ? `${memberInfo.name.split(' ')[0]}'s Workout` : "Guest Workout"}
             </h1>
             {activeExercises.length > 0 && (
               <button onClick={handleSubmitWorkout} disabled={loading} style={{ background: 'var(--text-color)', color: 'var(--bg-color)', border: 'none', padding: '0.5rem 1rem', borderRadius: '100px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>
                 {loading ? 'Saving...' : 'Finish'}
               </button>
             )}
           </div>
           
           <div style={{ display: 'flex', borderBottom: 'none', padding: '0 1.25rem' }}>
              <button onClick={() => setActiveTab('workout')} style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: 'none', borderBottom: activeTab === 'workout' ? '2px solid var(--text-color)' : '2px solid transparent', color: activeTab === 'workout' ? 'var(--text-color)' : 'var(--text-muted)', fontWeight: 600, fontSize: '0.95rem' }}>Active Workout</button>
              <button onClick={() => setActiveTab('history')} style={{ flex: 1, padding: '0.75rem', background: 'transparent', border: 'none', borderBottom: activeTab === 'history' ? '2px solid var(--text-color)' : '2px solid transparent', color: activeTab === 'history' ? 'var(--text-color)' : 'var(--text-muted)', fontWeight: 600, fontSize: '0.95rem' }}>History</button>
           </div>
        </div>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '1.25rem' }}>
        
        {personalInsights && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(249, 115, 22, 0.08))',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '16px',
            padding: '1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{ background: 'var(--danger-bg)', padding: '0.75rem', borderRadius: '12px' }}>
              <Medal size={28} className="text-danger" />
            </div>
            <div>
              <h4 style={{ margin: 0, fontWeight: 800, fontSize: '1rem', color: 'var(--text-color)' }}>
                Top {personalInsights.percentile}% in {personalInsights.category}
              </h4>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem', fontWeight: 500, lineHeight: 1.4 }}>
                {personalInsights.message}
              </p>
            </div>
          </div>
        )}

        {/* --- TAB: ACTIVE WORKOUT --- */}
        {activeTab === 'workout' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Hierarchy View: Grouped by Body Part */}
            {Object.keys(groupedExercises).length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {Object.keys(groupedExercises).map(bpName => (
                  <div key={bpName}>
                    <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ height: '1px', flex: 1, background: 'var(--card-border)' }}></div>
                      {bpName}
                      <div style={{ height: '1px', flex: 1, background: 'var(--card-border)' }}></div>
                    </h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {groupedExercises[bpName].map(ex => (
                         <div key={ex.uniqueId} style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
                           <div style={{ padding: '1rem', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.01)' }}>
                              <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-0.01em' }}>{ex.name}</h4>
                              <button onClick={() => handleRemoveActiveExercise(ex.uniqueId)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', padding: '0.25rem', cursor: 'pointer', opacity: 0.8 }}><Trash2 size={18} /></button>
                           </div>
                           
                           <div style={{ padding: '0.75rem 1rem' }}>
                             {ex.sets.map((set, sIdx) => (
                                <div key={set.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                  <div style={{ background: 'var(--card-border)', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', padding: '0.4rem 0.6rem', borderRadius: '8px', minWidth: '40px', textAlign: 'center' }}>{sIdx + 1}</div>
                                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'var(--bg-color)', borderRadius: '10px', border: '1px solid var(--card-border)', padding: '0.25rem' }}>
                                    
                                    {ex.type === 'weighted' && (
                                      <>
                                        <input type="number" placeholder="kgs" value={set.weight} onChange={e => handleSetChange(ex.uniqueId, set.id, 'weight', e.target.value)} style={{ padding: '0.5rem', background: 'transparent', border: 'none', color: 'var(--text-color)', fontSize: '1.1rem', fontWeight: 600, width: '100%', textAlign: 'center', outline: 'none' }} />
                                        <span style={{ color: 'var(--text-muted)', padding: '0 0.25rem' }}>×</span>
                                        <input type="number" placeholder="reps" value={set.reps} onChange={e => handleSetChange(ex.uniqueId, set.id, 'reps', e.target.value)} style={{ padding: '0.5rem', background: 'transparent', border: 'none', color: 'var(--text-color)', fontSize: '1.1rem', fontWeight: 600, width: '100%', textAlign: 'center', outline: 'none' }} />
                                      </>
                                    )}

                                    {ex.type === 'bodyweight' && (
                                      <>
                                        <span style={{ color: 'var(--text-muted)', paddingLeft: '1rem', whiteSpace: 'nowrap', fontSize: '0.9rem' }}>Reps:</span>
                                        <input type="number" placeholder="reps" value={set.reps} onChange={e => handleSetChange(ex.uniqueId, set.id, 'reps', e.target.value)} style={{ padding: '0.5rem', background: 'transparent', border: 'none', color: 'var(--text-color)', fontSize: '1.1rem', fontWeight: 600, width: '100%', textAlign: 'center', outline: 'none' }} />
                                      </>
                                    )}

                                    {ex.type === 'timed' && (
                                      <>
                                        <span style={{ color: 'var(--text-muted)', paddingLeft: '1rem', whiteSpace: 'nowrap', fontSize: '0.9rem' }}>Duration:</span>
                                        <input type="number" step="0.1" placeholder="mins" value={set.duration !== undefined ? set.duration : (set.weight || set.reps)} onChange={e => handleSetChange(ex.uniqueId, set.id, 'duration', e.target.value)} style={{ padding: '0.5rem', background: 'transparent', border: 'none', color: 'var(--text-color)', fontSize: '1.1rem', fontWeight: 600, width: '100%', textAlign: 'center', outline: 'none' }} />
                                      </>
                                    )}

                                  </div>
                                  {ex.sets.length > 1 && (
                                    <button onClick={() => handleRemoveSet(ex.uniqueId, set.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', padding: '0.5rem', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                  )}
                                </div>
                             ))}
                             
                             <button onClick={() => handleAddSet(ex.uniqueId)} style={{ marginTop: '0.25rem', width: '100%', padding: '0.75rem', background: 'transparent', border: '1px dashed var(--card-border)', borderRadius: '10px', color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                               <Plus size={16} /> Add Set
                             </button>
                           </div>
                         </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {Object.keys(groupedExercises).length === 0 && (
               <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'var(--card-bg)', border: '1px dashed var(--card-border)', borderRadius: '20px' }}>
                 <Dumbbell size={48} style={{ color: 'var(--card-border)', marginBottom: '1rem' }} />
                 <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-color)' }}>Your Workout is Empty</h3>
                 <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.95rem' }}>Select a body part below to add exercises instantly.</p>
               </div>
            )}
            
            {/* Minimal-Typing Exercise Selector (Always Inline at Bottom) */}
            <div style={{ background: 'var(--card-bg)', borderRadius: '20px', border: '1px solid var(--card-border)', overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.03)', marginTop: Object.keys(groupedExercises).length > 0 ? '1rem' : '0' }}>
               <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--card-border)' }}>
                 <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Quick Add</h3>
               </div>
               
               {/* Body Part Chips */}
               <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', padding: '1rem', borderBottom: '1px solid var(--card-border)' }}>
                  {bodyParts.map(bp => (
                     <button 
                        key={bp.id} 
                        onClick={() => setSelectedBodyPart(bp.id)}
                        style={{ 
                          whiteSpace: 'nowrap', 
                          padding: '0.6rem 1rem', 
                          borderRadius: '100px', 
                          background: selectedBodyPart === bp.id ? 'var(--text-color)' : 'var(--bg-color)', 
                          color: selectedBodyPart === bp.id ? 'var(--bg-color)' : 'var(--text-color)', 
                          border: selectedBodyPart === bp.id ? '1px solid transparent' : '1px solid var(--card-border)', 
                          fontWeight: 600, 
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem'
                        }}
                     >
                       {bp.icon && <span style={{ opacity: selectedBodyPart === bp.id ? 1 : 0.7 }}>{bp.icon}</span>}
                       {bp.name}
                     </button>
                  ))}
               </div>

               {/* Exercise Pills */}
               <div style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', paddingBottom: '0.5rem' }}>
                     {displayedExercises.map((ex) => (
                        <button 
                          key={ex.id} 
                          onClick={() => handleAddExerciseToWorkout(ex, currentBodyPart?.name)}
                          style={{ 
                            background: 'var(--bg-color)', 
                            border: '1px solid var(--card-border)', 
                            padding: '0.6rem 1rem', 
                            borderRadius: '12px', 
                            cursor: 'pointer', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '0.4rem',
                            fontWeight: 500,
                            fontSize: '0.9rem',
                            color: 'var(--text-color)'
                          }}
                        >
                           <Plus size={14} style={{ opacity: 0.5 }} /> {ex.name}
                        </button>
                     ))}
                  </div>

                  {/* Discrete Custom Exercise Addition */}
                  <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px dashed var(--card-border)' }}>
                    <form onSubmit={handleCustomExerciseSubmit} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-color)', border: '1px solid var(--card-border)', borderRadius: '12px', padding: '0.25rem' }}>
                      <Search size={16} className="text-muted" style={{ marginLeft: '0.5rem' }} />
                      <input 
                        type="text" 
                        placeholder={`Custom ${currentBodyPart ? currentBodyPart.name : ''} Exercise...`}
                        value={customExerciseName} 
                        onChange={e => setCustomExerciseName(e.target.value)} 
                        style={{ flex: 1, padding: '0.5rem', background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-color)', fontSize: '0.9rem' }} 
                      />
                      {customExerciseName.trim() && (
                        <button type="submit" style={{ padding: '0.4rem 0.8rem', background: 'var(--text-color)', color: 'var(--bg-color)', border: 'none', borderRadius: '8px', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer' }}>Add</button>
                      )}
                    </form>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* --- TAB: HISTORY --- */}
        {activeTab === 'history' && (
          <div>
            {!memberInfo && (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'var(--card-bg)', borderRadius: '20px', border: '1px dashed var(--card-border)' }}>
                 <History size={48} style={{ color: 'var(--card-border)', margin: '0 auto 1rem' }} />
                 <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.2rem' }}>Guest Mode</h3>
                 <p style={{ color: 'var(--text-muted)' }}>Sign in with your phone to sync history.</p>
              </div>
            )}
            {memberInfo && workoutHistory.length === 0 && !loading && (
              <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                 <p style={{ color: 'var(--text-muted)' }}>No past workouts found.</p>
              </div>
            )}
            {loading && <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading history...</p>}
            
            {workoutHistory.map(w => (
              <div key={w.id} style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', borderRadius: '16px', padding: '1.25rem', marginBottom: '1rem', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' }}>
                <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{new Date(w.created_at).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500, background: 'var(--bg-color)', padding: '0.2rem 0.6rem', borderRadius: '100px' }}>{w.workout_entries?.length || 0} exercises</span>
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {w.workout_entries?.map(e => {
                    const sets = e.workout_sets || [];
                    const fallbackExInfo = FALLBACK_EXERCISES.find(ex => ex.name.toLowerCase() === e.exercise_name.toLowerCase());
                    const type = fallbackExInfo ? fallbackExInfo.type : 'weighted';
                    
                    let bestSet = sets.length > 0 ? sets.reduce((best, curr) => {
                       if (type === 'bodyweight') return (parseInt(curr.reps) > parseInt(best.reps)) ? curr : best;
                       if (type === 'timed') return ((parseFloat(curr.weight) || parseFloat(curr.reps)) > (parseFloat(best.weight) || parseFloat(best.reps))) ? curr : best;
                       return (parseFloat(curr.weight) > parseFloat(best.weight) ? curr : best);
                    }, sets[0]) : null;
                    
                    return (
                      <div key={e.id} style={{ background: 'var(--bg-color)', borderRadius: '12px', padding: '0.75rem 1rem', border: '1px solid var(--card-border)' }}>
                        <div style={{ fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-color)' }}>{e.exercise_name}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {sets.sort((a,b) => a.set_number - b.set_number).map(set => {
                            const isBest = bestSet && bestSet.id === set.id;
                            
                            let displayStr = `${set.weight}kg × ${set.reps}`;
                            if (type === 'bodyweight') displayStr = `${set.reps} reps`;
                            if (type === 'timed') displayStr = `${set.weight || set.reps} mins`;

                            return (
                              <div key={set.id} style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem', borderRadius: '6px', background: isBest ? 'var(--text-color)' : 'var(--card-bg)', color: isBest ? 'var(--bg-color)' : 'var(--text-muted)', fontWeight: isBest ? 600 : 500, border: isBest ? 'none' : '1px solid var(--card-border)' }}>
                                {displayStr} {isBest && '🔥'}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
