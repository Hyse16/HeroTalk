import './StreakBadge.css'

export default function StreakBadge({ streak }) {
  if (!streak || !streak.currentStreak) return null

  return (
    <span className="streak-badge">
      🔥 <span className="streak-count">{streak.currentStreak}</span>일 연속
    </span>
  )
}
