import { supabase } from './supabase'

const NOTIFY_KEY = 'expiry_notified_date'

export async function checkExpiryNotifications(householdId) {
  if (!('Notification' in window)) return

  // Only notify once per day
  const today = new Date().toISOString().slice(0, 10)
  if (localStorage.getItem(NOTIFY_KEY) === today) return

  const permission = Notification.permission === 'default'
    ? await Notification.requestPermission()
    : Notification.permission

  if (permission !== 'granted') return

  const { data: items } = await supabase
    .from('items')
    .select('name, expiry_date, quantity')
    .eq('household_id', householdId)
    .not('expiry_date', 'is', null)

  if (!items?.length) return

  const todayDate = new Date()
  todayDate.setHours(0, 0, 0, 0)

  const expired = []
  const expiringSoon = []

  for (const item of items) {
    const expiry = new Date(item.expiry_date)
    const diffDays = Math.ceil((expiry - todayDate) / (1000 * 60 * 60 * 24))
    if (diffDays < 0) expired.push(item.name)
    else if (diffDays <= 7) expiringSoon.push({ name: item.name, days: diffDays })
  }

  if (expired.length > 0) {
    new Notification('Items expired', {
      body: expired.join(', '),
      icon: '/icon-192.png',
    })
  }

  if (expiringSoon.length > 0) {
    const lines = expiringSoon.map(i => `${i.name} (${i.days === 0 ? 'today' : `${i.days}d`})`).join(', ')
    new Notification('Expiring soon', {
      body: lines,
      icon: '/icon-192.png',
    })
  }

  if (expired.length > 0 || expiringSoon.length > 0) {
    localStorage.setItem(NOTIFY_KEY, today)
  }
}
