import { supabase } from '../lib/supabase'

export const CARDIO_EXERCISES = ['Treadmill', 'Cycling', 'Rowing Machine', 'Stair Climber', 'Elliptical']
export const STRENGTH_EXERCISES = ['Flat Bench Press', 'Deadlift', 'Barbell Squat']

export async function fetchLeaderboardStats(gymId) {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const sevenDaysAgoStr = sevenDaysAgo.toISOString()

  // 1. CONSISTENCY
  const { data: recentWorkouts } = await supabase
    .from('workouts')
    .select('member_id, created_at, members(name)')
    .eq('gym_id', gymId)
    .gte('created_at', sevenDaysAgoStr)

  let consistencyMap = {}
  if (recentWorkouts) {
    recentWorkouts.forEach(w => {
      // Workarounds for supabase nesting single vs array
      const memberName = Array.isArray(w.members) ? w.members[0]?.name : w.members?.name;
      if (!memberName) return;
      
      const dateKey = new Date(w.created_at).toDateString();
      
      if (!consistencyMap[w.member_id]) {
        consistencyMap[w.member_id] = { id: w.member_id, name: memberName, count: 0, dateSet: new Set() }
      }
      
      consistencyMap[w.member_id].dateSet.add(dateKey);
      consistencyMap[w.member_id].count = consistencyMap[w.member_id].dateSet.size;
    })
  }

  const allConsistency = Object.values(consistencyMap).sort((a, b) => b.count - a.count)
  const consistencyLeaderboard = allConsistency.filter(m => m.count >= 2).slice(0, 10)

  // 2. STRENGTH
  const { data: strengthEntries } = await supabase
    .from('workout_entries')
    .select(`
      exercise_name,
      workouts!inner(member_id, members(name), gym_id),
      workout_sets(weight)
    `)
    .in('exercise_name', STRENGTH_EXERCISES)
    .eq('workouts.gym_id', gymId)

  let strengthMap = {
    'Flat Bench Press': {},
    'Deadlift': {},
    'Barbell Squat': {}
  }

  if (strengthEntries) {
    strengthEntries.forEach(entry => {
      const memberId = entry.workouts?.member_id
      const memberName = Array.isArray(entry.workouts?.members) 
        ? entry.workouts.members[0]?.name 
        : entry.workouts?.members?.name;
      if (!memberId || !memberName) return;

      const maxEntryWeight = Math.max(...entry.workout_sets.map(s => parseFloat(s.weight) || 0))
      
      if (maxEntryWeight > 0 && maxEntryWeight <= 300) {
        if (!strengthMap[entry.exercise_name][memberId]) {
          strengthMap[entry.exercise_name][memberId] = { id: memberId, name: memberName, maxWeight: maxEntryWeight }
        } else {
          strengthMap[entry.exercise_name][memberId].maxWeight = Math.max(strengthMap[entry.exercise_name][memberId].maxWeight, maxEntryWeight)
        }
      }
    })
  }

  const allStrength = {};
  const strengthLeaderboard = {};
  STRENGTH_EXERCISES.forEach(ex => {
    allStrength[ex] = Object.values(strengthMap[ex]).sort((a, b) => b.maxWeight - a.maxWeight)
    strengthLeaderboard[ex] = allStrength[ex].slice(0, 5)
  })

  // 3. CARDIO
  const { data: cardioEntries } = await supabase
    .from('workout_entries')
    .select(`
      workouts!inner(member_id, members(name), gym_id, created_at),
      workout_sets(weight)
    `)
    .in('exercise_name', CARDIO_EXERCISES)
    .eq('workouts.gym_id', gymId)
    .gte('workouts.created_at', sevenDaysAgoStr)

  let cardioMap = {}
  if (cardioEntries) {
    cardioEntries.forEach(entry => {
      const memberId = entry.workouts?.member_id
      const memberName = Array.isArray(entry.workouts?.members) 
        ? entry.workouts.members[0]?.name 
        : entry.workouts?.members?.name;
      if (!memberId || !memberName) return;
      
      const totalEntryDuration = entry.workout_sets.reduce((sum, s) => sum + (parseFloat(s.weight) || 0), 0) // duration in weight column
      
      if (totalEntryDuration > 0) {
        if (!cardioMap[memberId]) {
          cardioMap[memberId] = { id: memberId, name: memberName, duration: totalEntryDuration }
        } else {
          cardioMap[memberId].duration += totalEntryDuration
        }
      }
    })
  }

  const allCardio = Object.values(cardioMap).sort((a, b) => b.duration - a.duration)
  const cardioLeaderboard = allCardio.slice(0, 5)

  return {
    leaderboards: {
      consistency: consistencyLeaderboard,
      strength: strengthLeaderboard,
      cardio: cardioLeaderboard
    },
    fullLists: {
      consistency: allConsistency,
      strength: allStrength,
      cardio: allCardio
    }
  }
}
