import { useState, useRef, useCallback } from 'react'

const useSpeechRecognition = () => {
  const [transcript, setTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState(null)
  const recognitionRef = useRef(null)
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
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => {
      transcriptRef.current = ''   // 동기 초기화
      setTranscript('')
      setIsListening(true)
      setError(null)
    }

    recognition.onresult = (event) => {
      const result = event.results[0][0].transcript
      transcriptRef.current = result  // 동기 저장 — onend보다 먼저 확정됨
      setTranscript(result)
    }

    recognition.onerror = (event) => {
      if (event.error !== 'no-speech') {
        setError(`음성 인식 오류: ${event.error}`)
      }
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)  // 여기서만 false로 변경 — stopListening은 stop()만 호출
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [])

  const stopListening = useCallback(() => {
    // stop()만 호출 → onend가 setIsListening(false) 처리
    // (직접 setIsListening하면 transcriptRef 업데이트 전에 effect 발동되는 race condition 발생)
    recognitionRef.current?.stop()
  }, [])

  return { transcript, transcriptRef, isListening, error, startListening, stopListening }
}

export default useSpeechRecognition
