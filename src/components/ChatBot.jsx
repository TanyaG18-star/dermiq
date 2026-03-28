import { useState, useRef, useEffect } from 'react'

const SYSTEM_PROMPT = `You are DermIQ Assistant, an expert AI skin care advisor built into the DermIQ app.

You help users with:
- Skin care advice and routines
- Diet and lifestyle tips for healthy skin
- OTC medicine suggestions (always remind to consult doctor)
- Emergency guidance for severe skin conditions

Rules:
- Keep answers short, clear and friendly
- Use emojis to make responses engaging
- Always add disclaimer for medical advice
- If condition sounds severe, recommend seeing a dermatologist
- Focus only on skin, diet, lifestyle and health topics
- If asked anything unrelated, politely redirect to skin topics
- Never suggest prescription medicines directly`

function ChatBot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '👋 Hi! I am DermIQ Assistant!\n\nI can help you with:\n🧴 Skincare advice\n🥗 Diet tips for healthy skin\n💊 OTC medicine guidance\n🚨 Emergency skin help\n\nWhat would you like to know?'
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setLoading(true)

    // Add user message
    const updatedMessages = [...messages, { role: 'user', content: userMessage }]
    setMessages(updatedMessages)

    try {
      const response = await fetch('http://localhost:5000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      })

      const data = await response.json()

      if (data.success) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.reply
        }])
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: '⚠️ Sorry, I am having trouble connecting. Please try again!'
        }])
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ Cannot connect to server. Make sure backend is running!'
      }])
    }

    setLoading(false)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const quickQuestions = [
    '🧴 Best routine for oily skin?',
    '💊 What helps acne fast?',
    '🥗 Foods for glowing skin?',
    '🚨 My skin is very red, help!',
  ]

  return (
    <>
      {/* FLOATING BUTTON */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform duration-200"
      >
        {isOpen ? (
          <span className="text-white text-2xl">✕</span>
        ) : (
          <span className="text-2xl">🩺</span>
        )}
      </button>

      {/* CHAT WINDOW */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 md:w-96 bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-100"
          style={{ height: '520px' }}>

          {/* HEADER */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-xl">🩺</span>
            </div>
            <div>
              <p className="text-white font-extrabold text-sm">DermIQ Assistant</p>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                <p className="text-emerald-100 text-xs">AI Skin Expert • Online</p>
              </div>
            </div>
          </div>

          {/* MESSAGES */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50">
            {messages.map((msg, i) => (
              <div key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-emerald-500 text-white rounded-br-sm'
                    : 'bg-white text-gray-700 shadow-sm rounded-bl-sm'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}

            {/* Loading dots */}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white px-4 py-3 rounded-2xl shadow-sm flex gap-1">
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{animationDelay:'0ms'}}></div>
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{animationDelay:'150ms'}}></div>
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{animationDelay:'300ms'}}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* QUICK QUESTIONS */}
          {messages.length === 1 && (
            <div className="px-3 py-2 bg-gray-50 border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-2 px-1">Quick questions:</p>
              <div className="flex flex-wrap gap-1">
                {quickQuestions.map((q, i) => (
                  <button key={i}
                    onClick={() => setInput(q)}
                    className="text-xs bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-1 rounded-lg hover:bg-emerald-100 transition">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* INPUT */}
          <div className="px-3 py-3 bg-white border-t border-gray-100 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about your skin..."
              className="flex-1 bg-gray-100 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-300 text-gray-700"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition ${
                input.trim() && !loading
                  ? 'bg-emerald-500 hover:bg-emerald-600'
                  : 'bg-gray-200'
              }`}>
              <span className="text-white text-lg">➤</span>
            </button>
          </div>

        </div>
      )}
    </>
  )
}

export default ChatBot