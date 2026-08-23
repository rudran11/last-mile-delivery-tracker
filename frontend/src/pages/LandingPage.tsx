import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { PublicNavbar } from '../components/public/PublicNavbar';
import { PublicFooter } from '../components/public/PublicFooter';
import { LogisticsNetworkBackground } from '../components/public/LogisticsNetworkBackground';
import { ProductPreview } from '../components/public/ProductPreview';
import { Map, Zap, LineChart, ShieldCheck, ArrowRight, Activity, Globe2, Layers } from 'lucide-react';
import styles from './LandingPageStyle.module.css';

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
          <div className={styles.sectionInner}>
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
          </div>
        </section>

        {/* HOW IT WORKS SECTION */}
        <section id="tracking" className={styles.workflowSection}>
          <div className={styles.sectionInner}>
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
          </div>
        </section>

        {/* CONTROL TOWER SECTION */}
        <section id="operations" className={styles.controlTowerSectionWrapper}>
          <div className={styles.sectionInner}>
            <div className={styles.controlTowerSection}>
              <div className={styles.controlTowerContent}>
                <div className={styles.eyebrow}>OPERATIONAL VISIBILITY</div>
                <h2>One command center<br />for every delivery.</h2>
                <p className={styles.controlTowerDesc}>
                  The Control Tower provides total visibility into your active operations, delivery statuses, and fleet locations, backed by geospatial PostGIS queries.
                </p>
                
                <div className={styles.marketingMetrics}>
                  <div className={styles.marketingMetric}>
                    <div className={styles.metricLabel}>ACTIVE ORDERS</div>
                    <div className={styles.metricValue}>07</div>
                  </div>
                  <div className={styles.marketingMetric}>
                    <div className={styles.metricLabel}>IN TRANSIT</div>
                    <div className={styles.metricValue}>03</div>
                  </div>
                  <div className={styles.marketingMetric}>
                    <div className={styles.metricLabel}>AVAILABLE AGENTS</div>
                    <div className={styles.metricValue}>05</div>
                  </div>
                  <div className={styles.marketingMetric}>
                    <div className={styles.metricLabel}>DELIVERED</div>
                    <div className={styles.metricValue}>12</div>
                  </div>
                </div>
                
                <ul className={styles.controlList}>
                  <li><ShieldCheck size={16} className={styles.controlIcon} /> Active operations dashboard</li>
                  <li><ShieldCheck size={16} className={styles.controlIcon} /> Real-time fleet visibility</li>
                  <li><ShieldCheck size={16} className={styles.controlIcon} /> Geospatial intelligence</li>
                </ul>
              </div>
              <div className={styles.controlTowerVisual}>
                <div className={styles.abstractDashboard}>
                  <div className={styles.absHeader}>
                    <div className={styles.absLogo}>CONTROL TOWER</div>
                    <div className={styles.absTabs}>
                      <span>Active: 12</span>
                      <span>Transit: 07</span>
                      <span>Delivered: 24</span>
                    </div>
                  </div>
                  <div className={styles.absBody}>
                    <div className={styles.absMap}>
                      <div className={styles.mapLabel}>MAP / ROUTES</div>
                      <div className={styles.mapNodes}>
                        <div className={styles.mapNode} style={{top: '20%', left: '30%'}}></div>
                        <div className={styles.mapLine} style={{top: '25%', left: '32%', width: '40px', transform: 'rotate(20deg)'}}></div>
                        <div className={styles.mapNode} style={{top: '30%', left: '45%'}}></div>
                        <div className={styles.mapLine} style={{top: '35%', left: '47%', width: '60px', transform: 'rotate(45deg)'}}></div>
                        <div className={styles.mapNode} style={{top: '60%', left: '60%'}}></div>
                      </div>
                    </div>
                    <div className={styles.absTable}>
                      <div className={styles.absTableRow + ' ' + styles.absTableHeader}>
                        <span>Fleet</span>
                        <span>Status</span>
                        <span>Zone</span>
                      </div>
                      <div className={styles.absTableRow}>
                        <span>Agent 104</span>
                        <span className={styles.statusActive}>Active</span>
                        <span>North</span>
                      </div>
                      <div className={styles.absTableRow}>
                        <span>Agent 217</span>
                        <span className={styles.statusTransit}>Transit</span>
                        <span>South</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* INTELLIGENCE SECTION */}
        <section id="intelligence" className={styles.intelligenceSectionWrapper}>
          <div className={styles.sectionInner}>
            <div className={styles.intelligenceSection}>
              <div className={styles.intelligenceHeader}>
                <h2 className={styles.intTitle}>
                  Distance is data.<br />
                  Availability is context.<br />
                </h2>
                <div className={styles.intSubtitle}>
                  Intelligent Dispatch Engine
                </div>
              </div>
              
              <div className={styles.dispatchPipeline}>
                <div className={styles.pipelineStage}>
                  <div className={styles.stageLabel}>PICKUP</div>
                  <div className={styles.stageBox}>
                    <div className={styles.stageTitle}>Location</div>
                    <div className={styles.stageValue}>
                      <Map size={14} /> Chennai Hub
                    </div>
                  </div>
                </div>
                
                <div className={styles.pipelineArrow}><ArrowRight size={20} /></div>
                
                <div className={styles.pipelineStage}>
                  <div className={styles.stageLabel}>CANDIDATES</div>
                  <div className={styles.stageBox}>
                    <div className={styles.stageTitle}>Active Agents</div>
                    <div className={styles.agentDots}>
                      <span className={styles.dot}></span>
                      <span className={styles.dot}></span>
                      <span className={styles.dot}></span>
                      <span className={styles.dot}></span>
                    </div>
                  </div>
                </div>
                
                <div className={styles.pipelineArrow}><ArrowRight size={20} /></div>
                
                <div className={styles.pipelineStage}>
                  <div className={styles.stageLabel}>EVALUATION</div>
                  <div className={styles.stageBox + ' ' + styles.evaluationBox}>
                    <div className={styles.evalRow}>
                      <span>Agent 01</span>
                      <span>2.4 km</span>
                      <span className={styles.statusAvailable}>AVAILABLE</span>
                    </div>
                    <div className={styles.evalRow}>
                      <span className={styles.mutedText}>Agent 02</span>
                      <span className={styles.mutedText}>4.1 km</span>
                      <span className={styles.statusBusy}>BUSY</span>
                    </div>
                    <div className={styles.evalRow}>
                      <span>Agent 03</span>
                      <span>6.8 km</span>
                      <span className={styles.statusAvailable}>AVAILABLE</span>
                    </div>
                    
                    <div className={styles.decisionScore}>
                      <div className={styles.scoreRow}>
                        <span>Distance</span>
                        <div className={styles.scoreBar}><div className={styles.scoreFill} style={{width: '92%'}}></div></div>
                      </div>
                      <div className={styles.scoreRow}>
                        <span>Availability</span>
                        <div className={styles.scoreBar}><div className={styles.scoreFill} style={{width: '100%'}}></div></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className={styles.pipelineArrow}><ArrowRight size={20} /></div>
                
                <div className={styles.pipelineStage}>
                  <div className={styles.stageLabel}>BEST MATCH</div>
                  <div className={styles.stageBox + ' ' + styles.selectedBox}>
                    <div className={styles.selectedHeader}>
                      <ShieldCheck size={16} className={styles.successIcon} />
                      <span>SELECTED AGENT</span>
                    </div>
                    <div className={styles.selectedAgent}>Agent 01</div>
                    <div className={styles.selectedDetails}>
                      <span>2.4 km away</span>
                      <span className={styles.statusAvailable}>Available</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className={styles.whyItMatters}>
                <div className={styles.whyTitle}>WHY IT MATTERS</div>
                <h3 className={styles.whyHeading}>Nearest isn't always best.</h3>
                <p className={styles.whyDesc}>
                  DeliveryTracker combines geographic proximity with agent availability and operational eligibility to make dispatch decisions.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* PHILOSOPHY SECTION */}
        <section className={styles.philosophySection}>
          <div className={styles.philosophyContent}>
            <h2>Every delivery generates a decision.</h2>
            <p>From assignment to completion, DeliveryTracker turns location, availability and operational state into actionable visibility.</p>
          </div>
        </section>

        {/* TECHNOLOGY STRIP */}
        <section className={styles.trustSectionWrapper}>
          <div className={styles.sectionInner}>
            <div className={styles.trustHeader}>
              <h3>THE ENGINE BEHIND DELIVERYTRACKER</h3>
            </div>
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
                <p>Controlled states</p>
              </div>
              <div className={styles.trustItem}>
                <Activity size={24} className={styles.trustIcon} />
                <h4>Analytics</h4>
                <p>Performance visibility</p>
              </div>
            </div>
          </div>
        </section>

        {/* OPERATIONAL VISIBILITY METRIC STRIP */}
        <section className={styles.metricStripSection}>
          <div className={styles.metricStripHeader}>BUILT FOR OPERATIONAL CLARITY</div>
          <div className={styles.metricStripLine}></div>
          <div className={styles.metricStripGrid}>
            <div className={styles.stripItem}>
              <span className={styles.stripTitle}>REAL-TIME</span>
              <span className={styles.stripDesc}>Delivery visibility</span>
            </div>
            <div className={styles.stripItem}>
              <span className={styles.stripTitle}>GEO-AWARE</span>
              <span className={styles.stripDesc}>Dispatch intelligence</span>
            </div>
            <div className={styles.stripItem}>
              <span className={styles.stripTitle}>ROLE-BASED</span>
              <span className={styles.stripDesc}>Secure operations</span>
            </div>
            <div className={styles.stripItem}>
              <span className={styles.stripTitle}>LIFECYCLE</span>
              <span className={styles.stripDesc}>Controlled states</span>
            </div>
          </div>
          <div className={styles.metricStripLine}></div>
        </section>

        {/* FINAL CTA */}
        <section className={styles.ctaSectionWrapper}>
          <div className={styles.sectionInner}>
            <div className={styles.ctaSection}>
              <div className={styles.ctaGlow}></div>
              <div className={styles.ctaContent}>
                <h2>READY TO TAKE CONTROL<br/>OF THE LAST MILE?</h2>
                <p>Explore how intelligent dispatch, tracking and operational visibility work together.</p>
                <div className={styles.heroActions} style={{ marginTop: '2rem' }}>
                  <Button size="lg" onClick={() => navigate('/login')} className={styles.primaryCta}>
                    Enter DeliveryTracker
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => navigate('/register')} className={styles.secondaryCta}>
                    Create Account
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
};

export default LandingPage;
