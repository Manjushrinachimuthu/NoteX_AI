import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './HomePage.css'

const features = [
  {
    icon: '🎙️',
    title: 'Live Transcription',
    desc: 'Real-time speech-to-text powered by Web Speech API. Every word captured as you speak, instantly.',
  },
  {
    icon: '🤖',
    title: 'AI-Powered Summaries',
    desc: 'Groq LLM distills hours of conversation into crisp, actionable meeting summaries in seconds.',
  },
  {
    icon: '🌐',
    title: 'Multi-Language Support',
    desc: 'Translate transcripts and summaries into 12+ languages including Hindi, Spanish, French and more.',
  },
  {
    icon: '📹',
    title: 'Video Upload & Process',
    desc: 'Upload recorded meeting videos and let Whisper AI extract and transcribe the audio automatically.',
  },
  {
    icon: '💬',
    title: 'AI Chatbot Q&A',
    desc: 'Ask questions about your meeting content. The AI answers from the transcript context instantly.',
  },
  {
    icon: '📄',
    title: 'PDF Export',
    desc: 'Download polished PDF reports of your notes, summaries and transcripts in any language.',
  },
]

const testimonials = [
  {
    name: 'Arjun Mehta',
    role: 'Product Manager',
    avatar: 'AM',
    text: 'NoteX AI completely changed how our team runs standups. The AI summaries save us 30 minutes every single day.',
  },
  {
    name: 'Sarah Chen',
    role: 'Engineering Lead',
    avatar: 'SC',
    text: 'The live transcription is incredibly accurate. I can focus on the conversation instead of furiously taking notes.',
  },
  {
    name: 'Riya Patel',
    role: 'Startup Founder',
    avatar: 'RP',
    text: 'Multi-language support is a game changer for our global team. We finally have notes everyone can read.',
  },
]

const stats = [
  { value: '10x', label: 'Faster Notes' },
  { value: '12+', label: 'Languages' },
  { value: '99%', label: 'Accuracy' },
  { value: '∞', label: 'Meetings' },
]

export default function HomePage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <div className="home">
      {/* ── Ambient orbs ── */}
      <div className="home-orb home-orb-1" />
      <div className="home-orb home-orb-2" />
      <div className="home-orb home-orb-3" />

      {/* ════════════ NAV ════════════ */}
      <nav className="home-nav">
        <div className="home-nav-inner">
          <div className="home-nav-logo">
            <div className="home-nav-logo-icon">🧠</div>
            <span className="home-nav-logo-text">NoteX AI</span>
          </div>

          <div className="home-nav-links">
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#testimonials">Reviews</a>
          </div>

          <div className="home-nav-actions">
            {user ? (
              <button className="home-btn-primary" onClick={() => navigate('/dashboard')}>
                Go to Dashboard →
              </button>
            ) : (
              <>
                <button className="home-btn-ghost" onClick={() => navigate('/login')}>
                  Sign In
                </button>
                <button className="home-btn-primary" onClick={() => navigate('/register')}>
                  Get Started Free
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ════════════ HERO ════════════ */}
      <section className="home-hero">
        <div className="home-hero-content">
          <div className="home-hero-badge">
            <span className="home-badge-dot" />
            AI-Powered Meeting Intelligence
          </div>

          <h1 className="home-hero-title">
            Let's Explore<br />
            <span className="home-hero-gradient">Intelligent</span><br />
            Meeting Notes
          </h1>

          <p className="home-hero-sub">
            With NoteX AI you can capture every word, generate smart summaries,
            and collaborate across languages — all in real time.
          </p>

          <div className="home-hero-btns">
            <button className="home-btn-primary home-btn-lg" onClick={() => navigate(user ? '/dashboard' : '/register')}>
              {user ? 'Go to Dashboard →' : 'Get It Now'}
            </button>
            <button className="home-btn-outline home-btn-lg" onClick={() => navigate(user ? '/dashboard' : '/login')}>
              Explore Features
            </button>
          </div>

          <div className="home-hero-social-proof">
            <div className="home-avatars">
              {['👩‍💼', '👨‍💻', '👩‍🔬', '👨‍🎨'].map((e, i) => (
                <div key={i} className="home-avatar-bubble">{e}</div>
              ))}
            </div>
            <span><strong>2,400+</strong> teams using NoteX AI</span>
          </div>
        </div>

        {/* Hero visual card */}
        <div className="home-hero-visual">
          <div className="home-hero-card">
            <div className="home-hero-card-glow" />
            <div className="home-hero-card-inner">
              <div className="home-hero-card-icon">🧠</div>
              <h3>Cinematic AI Notes</h3>
              <p>
                Be the best for more real and effective results — ready to explore
                the limitless world of intelligent meeting capture.
              </p>
              <div className="home-hero-card-tags">
                <span>Live Transcript</span>
                <span>AI Summary</span>
                <span>PDF Export</span>
              </div>
            </div>
          </div>

          {/* Floating sparkles */}
          <div className="home-sparkle home-sparkle-1">✦</div>
          <div className="home-sparkle home-sparkle-2">✦</div>
          <div className="home-sparkle home-sparkle-3">✧</div>
        </div>
      </section>

      {/* ════════════ STATS ════════════ */}
      <section className="home-stats">
        <div className="home-stats-inner">
          {stats.map((s, i) => (
            <div key={i} className="home-stat-item">
              <div className="home-stat-value">{s.value}</div>
              <div className="home-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════ FEATURES ════════════ */}
      <section className="home-features" id="features">
        <div className="home-section-header">
          <div className="home-section-badge">Core Features</div>
          <h2>Everything Your Meetings Need</h2>
          <p>From live capture to AI analysis — NoteX AI handles the entire meeting lifecycle.</p>
        </div>

        <div className="home-features-grid">
          {features.map((f, i) => (
            <div key={i} className="home-feature-card">
              <div className="home-feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
              <div className="home-feature-line" />
            </div>
          ))}
        </div>
      </section>

      {/* ════════════ HOW IT WORKS ════════════ */}
      <section className="home-how" id="how-it-works">
        <div className="home-section-header">
          <div className="home-section-badge">Workflow</div>
          <h2>New Experience In<br />Running Meetings</h2>
          <p>Three simple steps to transform how your team captures knowledge.</p>
        </div>

        <div className="home-steps">
          <div className="home-step">
            <div className="home-step-num">01</div>
            <div className="home-step-body">
              <h3>Create & Join</h3>
              <p>Create a meeting room in seconds. Invite your team via a shareable link and join from any browser.</p>
            </div>
          </div>
          <div className="home-step-arrow">→</div>
          <div className="home-step">
            <div className="home-step-num">02</div>
            <div className="home-step-body">
              <h3>Speak & Capture</h3>
              <p>NoteX AI listens in real time, transcribing every speaker with timestamps as the conversation flows.</p>
            </div>
          </div>
          <div className="home-step-arrow">→</div>
          <div className="home-step">
            <div className="home-step-num">03</div>
            <div className="home-step-body">
              <h3>Review & Export</h3>
              <p>Get an AI summary instantly. Translate, ask questions, and download a polished PDF report.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════ TESTIMONIALS ════════════ */}
      <section className="home-testimonials" id="testimonials">
        <div className="home-section-header">
          <div className="home-section-badge">Reviews</div>
          <h2>What Our Users Say</h2>
          <p>See what teams say about us. How good or bad — we will listen to evaluate and make things even better.</p>
        </div>

        <div className="home-testimonials-grid">
          {testimonials.map((t, i) => (
            <div key={i} className="home-testimonial-card">
              <div className="home-testimonial-stars">★★★★★</div>
              <p className="home-testimonial-text">"{t.text}"</p>
              <div className="home-testimonial-author">
                <div className="home-testimonial-avatar">{t.avatar}</div>
                <div>
                  <div className="home-testimonial-name">{t.name}</div>
                  <div className="home-testimonial-role">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════ VALUES / CTA ════════════ */}
      <section className="home-values">
        <div className="home-values-left">
          <div className="home-section-badge">Our Values</div>
          <h2>Our Company Values<br />Culture 🔥</h2>
          <p>
            We specialize in creating intelligent tools for teams and individuals
            who value clarity, speed, and collaboration in their work.
          </p>
          <div className="home-values-grid">
            <div className="home-value-item">
              <span>🎯</span>
              <span>Be Accurate</span>
            </div>
            <div className="home-value-item">
              <span>🤝</span>
              <span>Stronger Together</span>
            </div>
            <div className="home-value-item">
              <span>✨</span>
              <span>Keep It Simple</span>
            </div>
            <div className="home-value-item">
              <span>🧠</span>
              <span>Take Intelligent Steps</span>
            </div>
          </div>
        </div>

        <div className="home-values-right">
          <div className="home-cta-card">
            <div className="home-cta-glow" />
            <h3>Ready to Transform<br />Your Meetings?</h3>
            <p>Join thousands of teams already using NoteX AI to capture smarter notes.</p>
            <button className="home-btn-primary home-btn-lg" onClick={() => navigate(user ? '/dashboard' : '/register')}>
              {user ? 'Go to Dashboard →' : 'Start For Free →'}
            </button>
            <div className="home-cta-note">No credit card required · Free forever plan</div>
          </div>
        </div>
      </section>

      {/* ════════════ FOOTER ════════════ */}
      <footer className="home-footer">
        <div className="home-footer-inner">
          <div className="home-footer-logo">
            <div className="home-nav-logo-icon">🧠</div>
            <span className="home-nav-logo-text">NoteX AI</span>
          </div>
          <p className="home-footer-copy">© 2025 NoteX AI · Built with ❤️ for smarter meetings</p>
          <div className="home-footer-links">
            {user ? (
              <button className="home-btn-primary" onClick={() => navigate('/dashboard')}>Go to Dashboard →</button>
            ) : (
              <>
                <button className="home-btn-ghost" onClick={() => navigate('/login')}>Sign In</button>
                <button className="home-btn-primary" onClick={() => navigate('/register')}>Sign Up</button>
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}
