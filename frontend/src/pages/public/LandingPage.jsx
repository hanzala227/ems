import { useState, useRef, useLayoutEffect, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, CheckCircle, Menu, X, Calendar, Map, Zap, BarChart2, User, Bell, ChevronRight } from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import CountUpLib from 'react-countup'
const CountUp = CountUpLib.default ?? CountUpLib
import styles from './LandingPage.module.css'

gsap.registerPlugin(ScrollTrigger)

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState(-1)
  const navigate = useNavigate()
  const [statsVisible, setStatsVisible] = useState(false)
  
  const container = useRef(null)
  const loaderRef = useRef(null)
  const heroImageRef = useRef(null)
  const titleLine1 = useRef(null)
  const titleLine2 = useRef(null)
  const titleLine3 = useRef(null)
  const mobileMenuRef = useRef(null)
  const mobileMenuContentRef = useRef(null)
  const statsRef = useRef(null)

  // Handle mobile menu toggle with animation
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
      gsap.to(mobileMenuRef.current, { opacity: 1, duration: 0.2 })
      gsap.fromTo(mobileMenuContentRef.current, 
        { x: '100%' }, 
        { x: 0, duration: 0.4, ease: "power3.out" }
      )
    } else {
      document.body.style.overflow = ''
      if (mobileMenuContentRef.current) {
        gsap.to(mobileMenuContentRef.current, { 
          x: '100%', 
          duration: 0.3, 
          ease: "power3.in",
          onComplete: () => {
            if (mobileMenuRef.current) {
              gsap.to(mobileMenuRef.current, { opacity: 0, duration: 0.1 })
            }
          }
        })
      }
    }
  }, [isMobileMenuOpen])

  // Close menu on route change or scroll
  useEffect(() => {
    const handleScroll = () => setIsMobileMenuOpen(false)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline()

      // 1. Loader Sequence
      tl.fromTo('.loaderLogoWrapper', 
        { opacity: 0, scale: 0.8 }, 
        { opacity: 1, scale: 1, duration: 0.8, ease: "back.out(1.7)" }
      )
      .fromTo('.loaderText',
        { y: 30 },
        { y: 0, duration: 0.6, ease: "power3.out" },
        "-=0.4"
      )
      .to('.loaderText', { y: -30, opacity: 0, duration: 0.5, delay: 0.6, ease: "power3.in" })
      .to('.loaderLogoWrapper', { opacity: 0, scale: 0.8, duration: 0.5, ease: "power3.in" }, "-=0.3")
      .to(loaderRef.current, { 
        yPercent: -100, 
        duration: 0.8, 
        ease: "power4.inOut",
        onComplete: () => {
          if(loaderRef.current) loaderRef.current.style.display = 'none';
        }
      })

      // 2. Hero Reveal
      tl.fromTo([titleLine1.current, titleLine2.current, titleLine3.current],
        { y: 100, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: "power4.out" },
        "-=0.2"
      )
      .fromTo(`.${styles.heroSub}`, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8 }, "-=0.4")
      .fromTo(`.${styles.heroButtons}, .${styles.heroTrustmarks}`,
        { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8, stagger: 0.1 }, "-=0.6"
      )
      .fromTo(heroImageRef.current,
        { opacity: 0, x: 100, rotateY: -25, rotateX: 10 },
        { opacity: 1, x: 0, rotateY: -15, rotateX: 5, duration: 1.2, ease: "power3.out" },
        "-=1"
      )

      // 3. ScrollTrigger Animations
      gsap.fromTo(`.${styles.featureCard}`,
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power2.out",
          scrollTrigger: { trigger: `.${styles.features}`, start: "top 75%" }
        }
      )
      gsap.fromTo(`.${styles.workflowCol}`,
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.2, ease: "back.out(1.2)",
          scrollTrigger: { trigger: `.${styles.workflow}`, start: "top 70%" }
        }
      )
      gsap.fromTo(`.${styles.statItem}`,
        { opacity: 0, scale: 0.9 },
        { opacity: 1, scale: 1, duration: 0.5, stagger: 0.1, ease: "power2.out",
          scrollTrigger: { 
            trigger: statsRef.current, 
            start: "top 85%",
            onEnter: () => setStatsVisible(true)
          }
        }
      )
      gsap.fromTo(`.${styles.priceCard}`,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.15, ease: "power3.out",
          scrollTrigger: { trigger: `.${styles.pricing}`, start: "top 75%" }
        }
      )

      // Bottom section (FAQ + CTA)
      gsap.fromTo(`.${styles.faqCol}`,
        { opacity: 0, x: -40 },
        { opacity: 1, x: 0, duration: 0.8, ease: "power3.out",
          scrollTrigger: { trigger: `.${styles.bottomSection}`, start: "top 75%" }
        }
      )
      gsap.fromTo(`.${styles.ctaCol}`,
        { opacity: 0, x: 40 },
        { opacity: 1, x: 0, duration: 0.8, ease: "power3.out",
          scrollTrigger: { trigger: `.${styles.bottomSection}`, start: "top 75%" }
        }
      )

      // Footer columns stagger
      gsap.fromTo(`.${styles.footCol}`,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power2.out",
          scrollTrigger: { trigger: `.${styles.footer}`, start: "top 85%" }
        }
      )
      gsap.fromTo(`.${styles.footBrand}`,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out",
          scrollTrigger: { trigger: `.${styles.footer}`, start: "top 85%" }
        }
      )

    }, container)

    return () => ctx.revert()
  }, [])

  return (
    <div className={styles.page} ref={container}>
      
      {/* Premium GSAP Loader */}
      <div className={styles.premiumLoader} ref={loaderRef}>
        <div className="loaderLogoWrapper">
          <div className={styles.loaderRing}></div>
          <svg className={styles.loaderIcon} viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        <div className={styles.loaderTextWrapper}>
          <div className="loaderText">EventSphere</div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className={styles.mobileMenuOverlay} ref={mobileMenuRef} onClick={() => setIsMobileMenuOpen(false)}>
          <div className={styles.mobileMenuContent} ref={mobileMenuContentRef} onClick={(e) => e.stopPropagation()}>
            <div className={styles.mobileMenuHeader}>
              <Link to="/" className={styles.logo} onClick={() => setIsMobileMenuOpen(false)}>
                <div className={styles.logoIcon}>
                  <svg width="18" height="18" viewBox="0 0 28 28" fill="none">
                    <circle cx="14" cy="14" r="11" stroke="#b89de0" strokeWidth="2" fill="none"/>
                    <circle cx="14" cy="14" r="3" fill="#b89de0"/>
                  </svg>
                </div>
                <span>EventSphere</span>
              </Link>
              <button className={styles.mobileMenuClose} onClick={() => setIsMobileMenuOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <div className={styles.mobileMenuLinks}>
              <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className={styles.mobileMenuLink}>
                <span>Features</span>
                <ChevronRight size={18} />
              </a>
              <a href="#workflow" onClick={() => setIsMobileMenuOpen(false)} className={styles.mobileMenuLink}>
                <span>How it works</span>
                <ChevronRight size={18} />
              </a>
              <a href="#pricing" onClick={() => setIsMobileMenuOpen(false)} className={styles.mobileMenuLink}>
                <span>Pricing</span>
                <ChevronRight size={18} />
              </a>
            </div>
            <div className={styles.mobileMenuFooter}>
              <Link to="/login" className={styles.loginBtn} onClick={() => setIsMobileMenuOpen(false)}>
                Log in
              </Link>
              <Link to="/register" className={styles.primaryBtnSm} onClick={() => setIsMobileMenuOpen(false)}>
                Get Started Free <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Navbar */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <Link to="/" className={styles.logo}>
            <div className={styles.logoIcon}>
              <svg width="18" height="18" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="11" stroke="#b89de0" strokeWidth="2" fill="none"/>
                <circle cx="14" cy="14" r="3" fill="#b89de0"/>
              </svg>
            </div>
            <span>EventSphere</span>
          </Link>
          <div className={styles.navLinks}>
            <a href="#features">Features</a>
            <a href="#workflow">How it works</a>
            <a href="#pricing">Pricing</a>
          </div>
          <div className={styles.navCtas}>
            <Link to="/login" className={styles.loginBtn}>Log in</Link>
            <Link to="/register" className={styles.primaryBtnSm}>Get Started Free <ArrowRight size={14} /></Link>
          </div>
          <button className={styles.mobileToggle} onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroInner}>
          <div className={styles.heroContent}>
            <div className={styles.badge}>
              <span className={styles.badgeDot}></span> The Future of Event Management <span>›</span>
            </div>
            <h1 className={styles.heroTitle}>
              <span className={styles.heroTitleLine}><span ref={titleLine1} className={styles.heroTitleText}>Run World-Class</span></span>
              <span className={styles.heroTitleLine}><span ref={titleLine2} className={styles.heroTitleText}>Expos With</span></span>
              <span className={styles.heroTitleLine}><span ref={titleLine3} className={`${styles.heroTitleText} ${styles.textGradient}`}>Complete Control</span></span>
            </h1>
            <p className={styles.heroSub}>
              All-in-one SaaS platform to organize, exhibit, and manage trade shows and exhibitions with real-time analytics, smart messaging, and powerful workflows.
            </p>
            <div className={styles.heroButtons}>
              <Link to="/register" className={styles.primaryBtnLg}>Start for Free <ArrowRight size={16}/></Link>
              <a href="#demo" className={styles.secondaryBtnLg}>Book a Demo</a>
            </div>
            <div className={styles.heroTrustmarks}>
              <span><CheckCircle size={14} color="#7c5cbf"/> No Credit Card</span>
              <span><CheckCircle size={14} color="#7c5cbf"/> Setup in Minutes</span>
              <span><CheckCircle size={14} color="#7c5cbf"/> Cancel Anytime</span>
            </div>
          </div>
          <div className={styles.heroImageWrapper}>
            <img src="/dashboard-preview.png" alt="Dashboard" className={styles.heroImage} ref={heroImageRef} />
          </div>
        </div>
      </section>

      {/* Logo Cloud */}
      <section className={styles.logos}>
        <p className={styles.sectionLabelSm}>TRUSTED BY THOUSANDS OF ORGANIZERS WORLDWIDE</p>
        <div className={styles.logoGrid}>
          <span className={styles.logoItem} style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.05em' }}>TC TechCrunch</span>
          <span className={styles.logoItem} style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: '1.3rem' }}>Forbes</span>
          <span className={styles.logoItem} style={{ fontWeight: 900, fontSize: '1.4rem' }}>Inc.</span>
          <span className={styles.logoItem} style={{ fontWeight: 700, fontSize: '1.3rem' }}>aws</span>
          <span className={styles.logoItem} style={{ fontWeight: 800, fontSize: '1.2rem' }}>NVIDIA</span>
          <span className={styles.logoItem} style={{ fontWeight: 600, fontSize: '1.2rem' }}>Microsoft</span>
          <span className={styles.logoItem} style={{ fontWeight: 500, fontSize: '1.3rem' }}>Google</span>
        </div>
      </section>

      {/* Features */}
      <section id="features" className={styles.features}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionBadge}>FEATURES</div>
          <h2 className={styles.sectionTitle}>Everything you need to<br/>create <span className={styles.textGradient}>extraordinary</span> events</h2>
        </div>
        <div className={styles.featureGrid}>
          {[
            { icon: Calendar, title: 'Event Management', desc: 'Create, publish, and manage world-class events with full lifecycle control and dynamic scheduling.' },
            { icon: Map, title: 'Interactive Floor Plans', desc: 'Visual booth layouts with drag-and-drop, real-time updates, and multi-hall intelligent support.' },
            { icon: Zap, title: 'Real-Time Engagement', desc: 'Live messaging between organizers, exhibitors, and attendees with instant notifications.' },
            { icon: BarChart2, title: 'Advanced Analytics', desc: 'Track registrations, booth occupancy, revenue, and engagement with beautiful interactive charts.' },
            { icon: User, title: 'Exhibitor Portal', desc: 'Streamlined application workflow, booth assignment, and a dedicated exhibitor communication hub.' },
            { icon: Bell, title: 'Live Updates', desc: 'Real-time session status, live notifications, and instant announcements.' },
          ].map((feat, i) => (
            <div key={i} className={styles.featureCard}>
              <div className={styles.featureIcon}><feat.icon size={20} color="#b89de0"/></div>
              <div className={styles.featureContent}>
                <h3>{feat.title}</h3>
                <p>{feat.desc}</p>
                <ArrowRight size={16} className={styles.featureArrow} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className={styles.workflow}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionBadge}>WORKFLOW</div>
          <h2 className={styles.sectionTitle}>Seamless execution for everyone</h2>
        </div>
        <div className={styles.workflowGrid}>
          <div className={styles.workflowConnector} />
          {[
            { img: '/workflow_organizer.png', num: '1', role: 'ORGANIZER', steps: ['Create an expo workspace', 'Configure halls & booth layouts', 'Review applications & go live'] },
            { img: '/workflow_exhibitor.png', num: '2', role: 'EXHIBITOR', steps: ['Browse available expos', 'Apply and secure a booth', 'Manage your forms & engage'] },
            { img: '/workflow_attendee.png', num: '3', role: 'ATTENDEE', steps: ['Discover upcoming events', 'Register and explore floor plans', 'Book sessions & connect'] },
          ].map((wf, i) => (
            <div key={i} className={styles.workflowCol}>
              <img src={wf.img} alt={wf.role} className={styles.workflowImage} />
              <div className={styles.workflowLabel}><span className={styles.workflowNum}>{wf.num}</span> {wf.role}</div>
              <ul className={styles.workflowList}>
                {wf.steps.map((s, j) => <li key={j}>{s}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className={styles.stats} ref={statsRef}>
        <div className={styles.statsInner}>
          {[
            { val: 10000, suffix: '+', label: 'Events Powered', icon: <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/> },
            { val: 500000, suffix: '+', label: 'Happy Attendees', icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></> },
            { val: 20000, suffix: '+', label: 'Exhibitors Onboarded', icon: <><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="12" y1="17" x2="12" y2="21"/></> },
            { val: 98.7, decimals: 1, suffix: '%', label: 'Customer Satisfaction', icon: <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/> },
          ].map((stat, i) => (
            <div key={i} style={{ display: 'contents' }}>
              <div className={styles.statItem}>
                <div className={styles.statIcon}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{stat.icon}</svg></div>
                <div className={styles.statContent}>
                  <h4>
                    {statsVisible ? (
                      <CountUp 
                        end={stat.val} 
                        suffix={stat.suffix} 
                        decimals={stat.decimals || 0}
                        duration={2}
                        separator=","
                      />
                    ) : (
                      '0'
                    )}
                  </h4>
                  <p>{stat.label}</p>
                </div>
              </div>
              {i < 3 && <div className={styles.statDivider} />}
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className={styles.pricing}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionBadge}>PRICING</div>
          <h2 className={styles.sectionTitle}>Simple, transparent plans</h2>
        </div>
        <div className={styles.pricingGrid}>
          <div className={styles.priceCard}>
            <span className={styles.priceName}>STARTER</span>
            <div className={styles.priceValue}>Free</div>
            <ul className={styles.priceFeatures}>
              <li><CheckCircle size={16} className={styles.check} /> 1 Active Event</li>
              <li><CheckCircle size={16} className={styles.check} /> 50 Exhibitors</li>
              <li><CheckCircle size={16} className={styles.check} /> Basic Map Engine</li>
              <li><CheckCircle size={16} className={styles.check} /> Email Support</li>
            </ul>
            <Link to="/register" className={styles.priceBtn}>Get Started</Link>
          </div>
          <div className={`${styles.priceCard} ${styles.priceHighlight}`}>
            <div className={styles.mostPopular}>MOST POPULAR</div>
            <span className={styles.priceName}>PRO</span>
            <div className={styles.priceValue}>$99 <span>/mo</span></div>
            <ul className={styles.priceFeatures}>
              <li><CheckCircle size={16} className={styles.check} /> Unlimited Events</li>
              <li><CheckCircle size={16} className={styles.check} /> 500 Exhibitors</li>
              <li><CheckCircle size={16} className={styles.check} /> Advanced Analytics</li>
              <li><CheckCircle size={16} className={styles.check} /> Real-time Messaging</li>
              <li><CheckCircle size={16} className={styles.check} /> Priority Support</li>
            </ul>
            <Link to="/register" className={styles.priceBtnActive}>Start Free Trial</Link>
          </div>
          <div className={styles.priceCard}>
            <span className={styles.priceName}>ENTERPRISE</span>
            <div className={styles.priceValue}>Custom</div>
            <ul className={styles.priceFeatures}>
              <li><CheckCircle size={16} className={styles.check} /> Custom Integrations</li>
              <li><CheckCircle size={16} className={styles.check} /> Dedicated Account Manager</li>
              <li><CheckCircle size={16} className={styles.check} /> White-label Interface</li>
              <li><CheckCircle size={16} className={styles.check} /> 24/7 Phone Support</li>
            </ul>
            <Link to="/register" className={styles.priceBtn}>Contact Sales</Link>
          </div>
        </div>
      </section>

      {/* Bottom Split (FAQ + CTA) */}
      <section className={styles.bottomSection}>
        <div className={styles.bottomInner}>
          <div className={styles.faqCol}>
            <div className={styles.faqBadge}>FAQ</div>
            <h2 className={styles.faqTitle}>Common questions</h2>
            <div className={styles.faqList}>
              {[
                { q: 'How do I create my first expo?', a: 'Register as an organizer, click "Create Expo", fill in the details, then publish.' },
                { q: 'Can exhibitors apply directly?', a: 'Yes. Exhibitors browse expos and submit applications. Organizers review and assign booths.' },
                { q: 'Is the floor plan interactive?', a: 'Absolutely. Full drag-and-drop editor with zoom, pan, and multi-hall support.' },
                { q: 'What happens after I go live?', a: 'Attendees get notified, the floor plan goes live, and sessions are managed in real-time.' }
              ].map((faq, i) => (
                <div key={i} className={`${styles.faqItem} ${openFaq === i ? styles.faqOpen : ''}`}>
                  <button className={styles.faqQ} onClick={() => setOpenFaq(openFaq === i ? -1 : i)}>
                    {faq.q}
                    <span className={styles.faqCross}>{openFaq === i ? '−' : '+'}</span>
                  </button>
                  {openFaq === i && <div className={styles.faqA}>{faq.a}</div>}
                </div>
              ))}
            </div>
          </div>
          <div className={styles.ctaCol}>
            <img src="/cta_stage.png" alt="Stage" className={styles.ctaBg} />
            <div className={styles.ctaContent}>
              <h2 className={styles.ctaTitle}>Ready to host<br/>your <span className={styles.textGradient}>next expo</span>?</h2>
              <p className={styles.ctaSub}>Join thousands of organizers who use EventSphere to run world-class events.</p>
              <Link to="/register" className={styles.primaryBtnLg}>Start for Free <ArrowRight size={16}/></Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footBrand}>
            <div className={styles.logo}>
              <div className={styles.logoIcon}>
                <svg width="18" height="18" viewBox="0 0 28 28" fill="none">
                  <circle cx="14" cy="14" r="11" stroke="#b89de0" strokeWidth="2" fill="none"/>
                  <circle cx="14" cy="14" r="3" fill="#b89de0"/>
                </svg>
              </div>
              <span>EventSphere</span>
            </div>
            <p className={styles.footDesc}>The complete SaaS platform for modern event management.</p>
            <div className={styles.socials}>
              <a href="#" className={styles.socialIcon}>X</a>
              <a href="#" className={styles.socialIcon}>in</a>
              <a href="#" className={styles.socialIcon}>yt</a>
              <a href="#" className={styles.socialIcon}>ig</a>
            </div>
          </div>
          <div className={styles.footNav}>
            <div className={styles.footCol}>
              <span className={styles.footHead}>PRODUCT</span>
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
              <a href="#workflow">How it works</a>
            </div>
            <div className={styles.footCol}>
              <span className={styles.footHead}>RESOURCES</span>
              <a href="#">Blog</a>
              <a href="#">Help Center</a>
              <a href="#">Guides</a>
            </div>
            <div className={styles.footCol}>
              <span className={styles.footHead}>COMPANY</span>
              <a href="#">About Us</a>
              <a href="#">Careers</a>
              <a href="#">Contact</a>
            </div>
            <div className={styles.footCol}>
              <span className={styles.footHead}>ACCOUNT</span>
              <Link to="/login">Log in</Link>
              <Link to="/register">Register</Link>
            </div>
          </div>
        </div>
        <div className={styles.footBottom}>
          <div>© {new Date().getFullYear()} EventSphere. All rights reserved.</div>
          <div className={styles.footLegal}>
            <a href="#">Terms</a>
            <a href="#">Privacy</a>
            <a href="#">Security</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
