import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import type { User } from '@supabase/supabase-js'
import AuthWithCaptcha from './components/AuthWithCaptcha'
import { get_item_image_url, random_pair } from './lib/item_helper'
import { get_item_elos, submit_bug_report, submit_comparison, type ItemRanking } from './lib/api'
import BugReportModal from './components/BugReportModal'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [sending, setSending] = useState<boolean>(false)

  const [item_a, setItemA] = useState<string | null>(null)
  const [item_b, setItemB] = useState<string | null>(null)

  const [rankings, setRankings] = useState<ItemRanking[]>([])

  const [isBugReportModalOpen, setIsBugReportModalOpen] = useState(false)

  useEffect(() => {
    // Check for existing session first
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    get_item_elos().then((data) => {
      setRankings(data)
      const [random_a, random_b] = random_pair(data)
      setItemA(random_a)
      setItemB(random_b)
    }).catch((error) => {
      console.error('Error fetching item rankings:', error)
      alert('Failed to fetch item rankings. Please try again later.')
    })

    const fetchRankings = setInterval(() => {
      get_item_elos().then((data) => {
        setRankings(data)
      })
    }, 10000) // Fetch rankings every 10 seconds

    return () => {
      subscription.unsubscribe()
      clearInterval(fetchRankings)
    }
  }, [])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return <AuthWithCaptcha onAuthSuccess={setUser} />
  }

  function submit(is_rarer: boolean) {
    setSending(true)
    submit_comparison({
      item_id: item_a || '',
      comparison_item_id: item_b || '',
      item_is_more_rare: is_rarer,
      user_id: user?.id
    }).then(() => {
      // After submission, fetch new items
      const [random_a, random_b] = random_pair(rankings)
      setItemA(random_a)
      setItemB(random_b)
      setSending(false)
    }).catch((error) => {
      console.error('Error submitting comparison:', error)
      alert('Failed to submit comparison. Please try again later.')
    })
  }

  return (
    <>
      <div className='flex flex-col items-center justify-center min-h-screen w-full'>
        <div
          className='bg-black/50 md:bg-gray-800/50 text-white pl-2 pr-2 ml-5 mr-5 h-full md:h-auto md:w-auto lg:p-6 lg:rounded-lg shadow-lg flex justify-center flex-col'
        >
          <h1 className='text-3xl font-bold text-center mb-4 md:mt-0 mt-10'>
            Minecraft Rarity Ranking Game
          </h1>
          <p className='text-center mb-6'>
            Compare the rarity of Minecraft items and help build a community-driven ranking system!
            <br />
            <span className='text-sm text-gray-400'>
              (This is a work in progress, so expect some bugs!)
            </span>
            <br />
            <br />
            When considering rarity, think about how difficult or often you obtain, see, or find it in game.
          </p>
          <div className='mt-15'></div>
          <div className='flex flex-col items-center justify-center gap-4'>
            <h2 className='text-xl font-semibold mb-2 text-center'>{item_a}</h2>
            <div className='flex flex-col md:flex-row items-center justify-center gap-4'>
              <div className='item-slot flex flex-col items-center justify-center'>
                {item_a && (
                  <img
                    src={get_item_image_url(item_a) || ''}
                    alt={item_a}
                    className='w-32 h-32 object-contain mb-2'
                  />
                )}
                {!!item_a || 'loading...'}
              </div>
              <button onClick={() => submit(true)} disabled={sending}>
                Rarer
              </button>
            </div>
            <div className='mt-5'></div>
            <h2 className='text-xl font-semibold mb-2 text-center'>{item_b}</h2>
            <div className='flex flex-col md:flex-row items-center justify-center gap-4'>
              <div className='item-slot flex flex-col items-center justify-center'>
                {item_b && (
                  <img
                    src={get_item_image_url(item_b) || ''}
                    alt={item_b}
                    className='w-32 h-32 object-contain mb-2'
                  />
                )}
                {!!item_b || 'loading...'}
              </div>
              <button onClick={() => submit(false)} disabled={sending}>
                Rarer
              </button>
            </div>
          </div>
          <div className='mt-15'></div>
          <div className='mt-8 w-full max-w-4xl'>
            <h2 className='text-2xl font-bold text-center mb-4'>Rarity Leaderboard (Still Settling)</h2>
            <h3 className='text-xs text-gray-400 text-center mb-2 mt-2'>Results will improve as more items are rated!</h3>
            <div className='bg-gray-900/50 rounded-lg p-4 max-h-96 overflow-y-auto'>
              <div className='grid grid-cols-2 gap-4 mb-2 text-sm font-semibold text-gray-300 border-b border-gray-600 pb-2'>
                <div>Rank</div>
                <div>Item</div>
              </div>
              {rankings.map((ranking, index) => (
                <div key={ranking.item_name} className='grid grid-cols-2 gap-4 py-2 border-b border-gray-700/50 last:border-b-0 items-center'>
                  <div className='font-semibold'>
                    #{index + 1}
                  </div>
                  <div className='flex items-center gap-2'>
                    <img
                      src={get_item_image_url(ranking.item_name) || ''}
                      alt={ranking.item_name}
                      className='w-8 h-8 object-contain'
                    />
                    <span className='text-sm truncate'>{ranking.item_name}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-col md:flex-row justify-center items-center gap-8 mt-8 mb-8 lg:mb-0">
              {/* Middle Rarity Item */}
              {rankings.length > 0 && (
                <div className="flex flex-col items-center bg-gray-800/70 rounded-lg p-4 w-full md:w-1/2">
                  <h4 className="text-lg font-semibold mb-2 text-center">Middle Rarity Item</h4>
                  {(() => {
                    const midIndex = Math.floor(rankings.length / 2)
                    const midItem = rankings[midIndex]
                    return (
                      <>
                        <img
                          src={get_item_image_url(midItem.item_name) || ''}
                          alt={midItem.item_name}
                          className="w-16 h-16 object-contain mb-2"
                        />
                        <div className="text-center text-base font-medium">{midItem.item_name}</div>
                        <div className="text-xs text-gray-400">Rank #{midIndex + 1}</div>
                      </>
                    )
                  })()}
                </div>
              )}

              {/* Closest to Average Rarity Item */}
              {rankings.length > 0 && (
                <div className="flex flex-col items-center bg-gray-800/70 rounded-lg p-4 w-full md:w-1/2">
                  <h4 className="text-lg font-semibold mb-2 text-center">Closest to Average Rarity Item</h4>
                  {(() => {
                    const avgElo = rankings.reduce((sum, r) => sum + r.elo_ranking, 0) / rankings.length
                    let closest = rankings[0]
                    let closestDiff = Math.abs(rankings[0].elo_ranking - avgElo)
                    rankings.forEach(r => {
                      const diff = Math.abs(r.elo_ranking - avgElo)
                      if (diff < closestDiff) {
                        closest = r
                        closestDiff = diff
                      }
                    })
                    const avgIndex = rankings.findIndex(r => r.item_name === closest.item_name)
                    return (
                      <>
                        <img
                          src={get_item_image_url(closest.item_name) || ''}
                          alt={closest.item_name}
                          className="w-16 h-16 object-contain mb-2"
                        />
                        <div className="text-center text-base font-medium">{closest.item_name}</div>
                        <div className="text-xs text-gray-400">Rank #{avgIndex + 1}</div>
                      </>
                    )
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className='flex flex-col items-center justify-center mb-16 mt-4'>
          <div className='mt-8 w-full max-w-2xl text-center'>
            <h2 className='text-xl font-bold mb-2'>Found a Bug?</h2>
            <p className='mb-2 text-sm text-gray-300'>
              If you notice something not working as expected (for example: errors, broken images, items that shouldn't be rated, or anything that seems off), please let me know!
              <br />
              <span className='text-xs text-gray-400'>
                A "bug" is any unintended behavior or problem in the app, such as crashes, glitches, or features not working as described.
              </span>
            </p>
            <button onClick={() => setIsBugReportModalOpen(true)}>
              Submit a Bug Report
            </button>
          </div>
        </div>
      </div>
      <BugReportModal isOpen={isBugReportModalOpen} onClose={() => setIsBugReportModalOpen(false)} onSubmit={submit_bug_report} userId={user.id} />
    </>
  )
}

export default App