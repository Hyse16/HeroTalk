import { useState, useRef, useCallback } from 'react'

const MAX_RECORDING_MS = 60000  // 최대 녹음 1분

const useSpeechRecognition = () => {
  const [transcript, setTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState(null)
  const recognitionRef = useRef(null)
  const timerRef = useRef(null)
  // ref로 transcript를 동기적으로 보관 — onend 타이밍 race condition 방지
  const transcriptRef = useRef('')

  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Web Speech API를 지원하지 않는 브라우저입니다. Chrome을 사용해주세요.')
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()

    recognition.lang = 'en-US'
    recognition.continuous = true      // 말하는 동안 계속 인식
    recognition.interimResults = false // 확정된 결과만 누적

    recognition.onstart = () => {
      transcriptRef.current = ''
      setTranscript('')
      setIsListening(true)
      setError(null)

      // 60초 후 자동 종료
      timerRef.current = setTimeout(() => {
        recognition.stop()
      }, MAX_RECORDING_MS)
    }

    recognition.onresult = (event) => {
      // continuous=true: 여러 결과를 누적
      let full = ''
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          full += event.results[i][0].transcript + ' '
        }
      }
      const trimmed = full.trim()
      transcriptRef.current = trimmed
      setTranscript(trimmed)
    }

    recognition.onerror = (event) => {
      if (event.error !== 'no-speech') {
        setError(`음성 인식 오류: ${event.error}`)
      }
      setIsListening(false)
    }

    recognition.onend = () => {
      clearTimeout(timerRef.current)
      setIsListening(false)
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [])

  const stopListening = useCallback(() => {
    clearTimeout(timerRef.current)
    recognitionRef.current?.stop()
  }, [])

  return { transcript, transcriptRef, isListening, error, startListening, stopListening }
}

export default useSpeechRecognition
