import { useState } from 'react'
import { api } from '../../services/api'

const Chatbot = ({ meetingId }) => {
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!question.trim()) return

    const userMessage = { role: 'user', content: question }
    setMessages(prev => [...prev, userMessage])
    setQuestion('')
    setLoading(true)

    try {
      const response = await api.chatWithNotes(meetingId, question)
      const botMessage = { role: 'assistant', content: response.answer }
      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      console.error('Failed to get answer:', error)
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I failed to get an answer.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="chatbot">
      <div className="chatbot-messages">
        {messages.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center' }}>
            Ask questions about the meeting notes
          </p>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className={`message ${msg.role}`}>
              <p>{msg.content}</p>
            </div>
          ))
        )}
        {loading && <div className="message assistant"><p>Thinking...</p></div>}
      </div>
      <form onSubmit={handleSubmit} className="chatbot-input">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question..."
          disabled={loading}
        />
        <button type="submit" disabled={loading || !question.trim()}>
          Send
        </button>
      </form>
    </div>
  )
}

export default Chatbot
