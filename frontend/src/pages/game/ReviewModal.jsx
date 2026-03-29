import { useState, useEffect, useRef } from 'react'
import useCharacterStore from '@/store/characterStore'
import useSpeechRecognition from '@/hooks/useSpeechRecognition'
import { getReviews, submitReview } from '@/api/reviewApi'
import './ReviewModal.css'

const PART_LABEL = {
  PART1: 'Part 1',
  PART2: 'Part 2',
  PART3: 'Part 3',
  PART4: 'Part 4',
  PART5: 'Part 5',
  PART6: 'Part 6',
}

const RECORD_SECONDS = 10

function ScoreBar({ score }) {
  const color =
    score >= 80 ? '#4ade80' :
    score >= 60 ? '#f0c040' :
    score >= 40 ? '#fb923c' : '#f87171'
  return (
    <div className="rev-score-bar-wrap">
      <div
        className="rev-score-bar-fill"
        style={{ width: `${score}%`, background: color }}
      />
    </div>
  )
}

export default function ReviewModal({ onClose }) {
  const setCharacter = useCharacterStore((s) => s.setCharacter)

  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // 현재 진행 중인 복습 상태
  const [activeId, setActiveId] = useState(null)      // 녹음 중인 review id
  const [countdown, setCountdown] = useState(0)        // 남은 녹음 시간
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)           // 채점 결과 {reviewId, ...}

  const timerRef = useRef(null)
  const { transcript, transcriptRef, isListening, startListening, stopListening } =
    useSpeechRecognition()

  useEffect(() => {
    getReviews()
      .then(setReviews)
      .catch(() => setError('복습 목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false))
  }, [])

  // 녹음 시작
  const handleStartRecord = (review) => {
    if (activeId !== null) return
    setResult(null)
    setError(null)
    setActiveId(review.reviewId)
    setCountdown(RECORD_SECONDS)
    startListening()

    // 카운트다운 타이머
    let remaining = RECORD_SECONDS
    timerRef.current = setInterval(() => {
      remaining -= 1
      setCountdown(remaining)
      if (remaining <= 0) {
        clearInterval(timerRef.current)
        stopListening()
        // stopListening은 onend를 통해 isListening을 false로 만드므로
        // submit은 isListening 변화를 감지하는 useEffect에서 처리
      }
    }, 1000)
  }

  // 녹음 강제 중지 (버튼)
  const handleStopRecord = () => {
    clearInterval(timerRef.current)
    stopListening()
  }

  // isListening이 false로 바뀌었을 때 (녹음 종료) → 자동 제출
  const prevListening = useRef(false)
  useEffect(() => {
    if (prevListening.current && !isListening && activeId !== null) {
      // 녹음이 끝난 시점
      handleSubmit(activeId)
    }
    prevListening.current = isListening
  }, [isListening]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (reviewId) => {
    clearInterval(timerRef.current)
    const text = transcriptRef.current
    if (!text) {
      setError('음성이 인식되지 않았습니다. 다시 시도해주세요.')
      setActiveId(null)
      return
    }
    setSubmitting(true)
    try {
      const res = await submitReview(reviewId, text)
      setResult({ reviewId, ...res })
      // cleared 상태 업데이트
      if (res.cleared) {
        setReviews((prev) =>
          prev.map((r) => (r.reviewId === reviewId ? { ...r, cleared: true } : r))
        )
      }
      // expGained 반영 (character는 서버 응답에 포함되지 않으므로 exp만 간이 업데이트)
      if (res.expGained) {
        setCharacter((prev) =>
          prev ? { ...prev, exp: (prev.exp ?? 0) + res.expGained } : prev
        )
      }
    } catch {
      setError('채점에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setSubmitting(false)
      setActiveId(null)
    }
  }

  const handleCloseResult = () => setResult(null)

  return (
    <div className="rev-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="rev-panel">
        <div className="rev-title">📖 복습 던전</div>

        {error && <div className="rev-error">⚠ {error}</div>}

        {/* 채점 결과 오버레이 */}
        {result && (
          <div className="rev-result-box">
            <div className="rev-result-title">채점 결과</div>
            <div className="rev-result-score">
              <span className="rev-result-score-val">{result.score}</span>
              <span className="rev-result-score-label">점</span>
            </div>
            <ScoreBar score={result.score} />
            {result.cleared && (
              <div className="rev-result-cleared">✅ 복습 완료!</div>
            )}
            {result.expGained > 0 && (
              <div className="rev-result-exp">+{result.expGained} EXP 획득</div>
            )}
            <div className="rev-result-section">
              <div className="rev-result-label rev-good">잘한 점</div>
              <div className="rev-result-text">{result.feedbackGood}</div>
            </div>
            <div className="rev-result-section">
              <div className="rev-result-label rev-bad">개선할 점</div>
              <div className="rev-result-text">{result.feedbackBad}</div>
            </div>
            <div className="rev-result-section">
              <div className="rev-result-label rev-sample">모범 답안</div>
              <div className="rev-result-text rev-sample-text">{result.sampleAnswer}</div>
            </div>
            <button className="rev-btn rev-btn-ok" onClick={handleCloseResult}>확인</button>
          </div>
        )}

        {loading ? (
          <div className="rev-loading">불러오는 중...</div>
        ) : reviews.length === 0 ? (
          <div className="rev-empty">복습할 문제가 없습니다. 배틀에서 40점 이하 답변이 등록됩니다.</div>
        ) : (
          <div className="rev-list">
            {reviews.map((review) => {
              const isActive = activeId === review.reviewId
              return (
                <div
                  key={review.reviewId}
                  className={`rev-card${review.cleared ? ' cleared' : ''}${isActive ? ' active' : ''}`}
                >
                  <div className="rev-card-header">
                    <span className="rev-part-badge">
                      {PART_LABEL[review.toeicPart] ?? review.toeicPart}
                    </span>
                    <span className="rev-original-score">
                      원점수: {review.originalScore}점
                    </span>
                    {review.cleared && (
                      <span className="rev-cleared-badge">✅ 완료</span>
                    )}
                  </div>

                  <div className="rev-question-text">{review.questionText}</div>

                  {review.hint && (
                    <div className="rev-hint">💡 힌트: {review.hint}</div>
                  )}

                  {isActive ? (
                    <div className="rev-recording">
                      <div className="rev-rec-indicator">
                        <span className="rev-rec-dot" />
                        녹음 중...
                      </div>
                      <div className="rev-countdown">{countdown}초</div>
                      {transcript && (
                        <div className="rev-transcript">"{transcript}"</div>
                      )}
                      <button
                        className="rev-btn rev-btn-stop"
                        onClick={handleStopRecord}
                        disabled={submitting}
                      >
                        {submitting ? '채점 중...' : '제출'}
                      </button>
                    </div>
                  ) : (
                    <button
                      className="rev-btn rev-btn-start"
                      onClick={() => handleStartRecord(review)}
                      disabled={activeId !== null || submitting || review.cleared}
                    >
                      {review.cleared ? '완료됨' : '🎤 복습하기'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        <div className="rev-actions">
          <button className="rev-btn rev-btn-close" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  )
}
