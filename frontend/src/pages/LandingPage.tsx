import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { PublicNavbar } from '../components/public/PublicNavbar';
import { PublicFooter } from '../components/public/PublicFooter';
import { LogisticsNetworkBackground } from '../components/public/LogisticsNetworkBackground';
import { ProductPreview } from '../components/public/ProductPreview';
import { Map, Zap, LineChart, ShieldCheck, ArrowRight, Activity, Globe2, Layers } from 'lucide-react';
import styles from './LandingPage.module.css';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <PublicNavbar />
      
      <main className={styles.main}>
        {/* HERO SECTION */}
        <section className={styles.heroSection}>
          <LogisticsNetworkBackground />
          <div className={styles.heroContent}>
            <div className={styles.eyebrow}>
              <span className={styles.eyebrowDot}></span>
              LAST-MILE LOGISTICS INTELLIGENCE
            </div>
            
            <h1 className={styles.heroTitle}>
              Intelligent Dispatch.<br />
              <span className={styles.heroHighlight}>Every Delivery, Under Control.</span>
            </h1>
            
            <p className={styles.heroSubtitle}>
              DeliveryTracker combines geospatial intelligence, automated dispatch, real-time delivery tracking and operational analytics into one last-mile logistics platform.
            </p>
            
            <div className={styles.heroActions}>
              <Button size="lg" onClick={() => navigate('/login')} className={styles.primaryCta}>
                Enter DeliveryTracker
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/register')} className={styles.secondaryCta}>
                Create Account
              </Button>
            </div>
            
            <div className={styles.heroTrust}>
              Built with geospatial intelligence • Real-time operations • Intelligent dispatch
            </div>
          </div>
          
          <div className={styles.heroPreview}>
            <ProductPreview />
          </div>
        </section>

        {/* VALUE PROPOSITION SECTION */}
        <section id="platform" className={styles.valueSection}>
          <div className={styles.sectionHeader}>
            <h2>Core Platform Capabilities</h2>
            <p>Everything you need to orchestrate complex delivery operations at scale.</p>
          </div>
          
          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <Zap className={styles.featureIcon} />
              </div>
              <h3>Intelligent Dispatch</h3>
              <p>Automatically identify the most suitable available delivery agent using geographic proximity and operational state.</p>
            </div>
            
            <div className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <Activity className={styles.featureIcon} />
              </div>
              <h3>Real-Time Operations</h3>
              <p>Monitor delivery activity, agent availability and order lifecycle from a unified operational view.</p>
            </div>
            
            <div className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <LineChart className={styles.featureIcon} />
              </div>
              <h3>Delivery Intelligence</h3>
              <p>Understand delivery performance through completion metrics, feedback and operational history.</p>
            </div>
            
            <div className={styles.featureCard}>
              <div className={styles.featureIconWrapper}>
                <Map className={styles.featureIcon} />
              </div>
              <h3>Explainable Decisions</h3>
              <p>Understand exactly why an agent was selected through distance calculations and eligibility analysis.</p>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section id="tracking" className={styles.workflowSection}>
          <div className={styles.sectionHeader}>
            <h2>The Delivery Lifecycle</h2>
            <p>A strictly controlled state-machine from creation to fulfillment.</p>
          </div>
          
          <div className={styles.workflowSteps}>
            <div className={styles.step}>
              <div className={styles.stepNumber}>01</div>
              <h4 className={styles.stepTitle}>Create</h4>
              <p className={styles.stepDesc}>Create a delivery order and calculate its delivery pricing dynamically.</p>
            </div>
            
            <div className={styles.stepDivider}></div>
            
            <div className={styles.step}>
              <div className={styles.stepNumber}>02</div>
              <h4 className={styles.stepTitle}>Dispatch</h4>
              <p className={styles.stepDesc}>Identify the most suitable available agent using geographic intelligence.</p>
            </div>
            
            <div className={styles.stepDivider}></div>
            
            <div className={styles.step}>
              <div className={styles.stepNumber}>03</div>
              <h4 className={styles.stepTitle}>Deliver</h4>
              <p className={styles.stepDesc}>Track the order through its delivery lifecycle in real-time.</p>
            </div>
            
            <div className={styles.stepDivider}></div>
            
            <div className={styles.step}>
              <div className={styles.stepNumber}>04</div>
              <h4 className={styles.stepTitle}>Understand</h4>
              <p className={styles.stepDesc}>Analyze delivery performance and customer feedback.</p>
            </div>
          </div>
        </section>

        {/* CONTROL TOWER SECTION */}
        <section id="operations" className={styles.controlTowerSection}>
          <div className={styles.controlTowerContent}>
            <h2>One command center for every delivery.</h2>
            <p>
              The Control Tower provides total visibility into your active operations, delivery statuses, and fleet locations, backed by geospatial PostGIS queries.
            </p>
            <ul className={styles.controlList}>
              <li><ArrowRight size={16} className={styles.controlIcon} /> Active operations dashboard</li>
              <li><ArrowRight size={16} className={styles.controlIcon} /> Real-time fleet visibility</li>
              <li><ArrowRight size={16} className={styles.controlIcon} /> Geospatial intelligence</li>
            </ul>
          </div>
          <div className={styles.controlTowerVisual}>
            <div className={styles.abstractDashboard}>
              <div className={styles.absHeader} />
              <div className={styles.absBody}>
                <div className={styles.absSidebar} />
                <div className={styles.absMain}>
                  <div className={styles.absCard} style={{ width: '100%', height: '120px' }} />
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div className={styles.absCard} style={{ flex: 2, height: '200px' }} />
                    <div className={styles.absCard} style={{ flex: 1, height: '200px' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* INTELLIGENCE SECTION */}
        <section id="intelligence" className={styles.intelligenceSection}>
          <div className={styles.intelligenceHeader}>
            <h2 className={styles.intTitle}>
              Distance is data.<br />
              Availability is context.<br />
              <span className={styles.heroHighlight}>Every dispatch has a reason.</span>
            </h2>
          </div>
          
          <div className={styles.intelligenceFlow}>
            <div className={styles.flowNode}>Pickup Location</div>
            <div className={styles.flowLine} />
            <div className={styles.flowNode}>Candidate Agents</div>
            <div className={styles.flowLine} />
            <div className={styles.flowNode}>Distance + Availability</div>
            <div className={styles.flowLine} />
            <div className={styles.flowNode} style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}>Selected Agent</div>
          </div>
        </section>

        {/* TRUST SECTION */}
        <section className={styles.trustSection}>
          <div className={styles.trustGrid}>
            <div className={styles.trustItem}>
              <Globe2 size={24} className={styles.trustIcon} />
              <h4>PostGIS</h4>
              <p>Geospatial dispatch</p>
            </div>
            <div className={styles.trustItem}>
              <ShieldCheck size={24} className={styles.trustIcon} />
              <h4>Secure APIs</h4>
              <p>Role-based operations</p>
            </div>
            <div className={styles.trustItem}>
              <Layers size={24} className={styles.trustIcon} />
              <h4>Lifecycle Engine</h4>
              <p>Controlled delivery states</p>
            </div>
            <div className={styles.trustItem}>
              <Activity size={24} className={styles.trustIcon} />
              <h4>Operational Analytics</h4>
              <p>Performance visibility</p>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className={styles.ctaSection}>
          <h2>Ready to take control of the last mile?</h2>
          <p>Explore the platform and see how intelligent dispatch, tracking and operational visibility work together.</p>
          <div className={styles.heroActions} style={{ marginTop: '2rem' }}>
            <Button size="lg" onClick={() => navigate('/login')} className={styles.primaryCta}>
              Enter DeliveryTracker
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/register')} className={styles.secondaryCta}>
              Create Account
            </Button>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
};

export default LandingPage;
