import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import styles from './index.module.css';

const DOC_LINKS = [
  {
    title: 'Reference API',
    description: 'Observer endpoint, health, ingest болон query интерфейсүүд.',
    to: '/docs/reference/api',
  },
  {
    title: 'Events',
    description: 'Event schema, core талбарууд, payload бүтэц ба жишээ.',
    to: '/docs/reference/events',
  },
  {
    title: 'Fields',
    description: 'Tier1/Tier2/Tier3 ангилал, field-level mapping болон тайлбар.',
    to: '/docs/reference/fields/overview',
  },
  {
    title: 'Project Docs',
    description: 'Research field map, workflow, integration холбоотой төслийн материал.',
    to: '/project-docs/research_field_map',
  },
];

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout title={siteConfig.title} description={siteConfig.tagline}>
      <main className={styles.page}>
        <header className={styles.heroBanner}>
          <div className={`container ${styles.heroInner}`}>
            <p className={styles.badge}>THESIS TECHNICAL DOCS</p>
            <Heading as="h1" className={styles.heroTitle}>
              {siteConfig.title}
            </Heading>
            <p className={styles.heroSubtitle}>
              {siteConfig.tagline}. Event capture, tiered field policy, ingestion pipeline,
              болон analysis workflow-уудыг нэг дороос харах technical documentation.
            </p>
            <div className={styles.buttons}>
              <Link className="button button--primary button--lg" to="/docs/">
                Баримт бичиг нээх
              </Link>
              <Link className="button button--secondary button--lg" to="/project-docs/research_field_map">
                Research field map
              </Link>
            </div>
          </div>
        </header>

        <section className={styles.section}>
          <div className="container">
            <div className={styles.sectionHeading}>
              <Heading as="h2">Эхлэх цэгүүд</Heading>
              <p>Хамгийн хэрэгтэй баримтууд руу шууд орох shortcut картууд.</p>
            </div>
            <div className={styles.cardGrid}>
              {DOC_LINKS.map((item) => (
                <Link key={item.to} to={item.to} className={styles.docCard}>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className="container">
            <div className={styles.sectionHeading}>
              <Heading as="h2">Quickstart</Heading>
              <p>Observer API + docs + snippet smoke test ажиллуулах minimum алхмууд.</p>
            </div>
            <div className={styles.quickstartPanel}>
              <p>1) Observer API ажиллуулах</p>
              <pre>
                <code>python main.py</code>
              </pre>
              <p>2) Docusaurus docs ажиллуулах</p>
              <pre>
                <code>cd website{"\n"}npm run start</code>
              </pre>
              <p>3) Health болон ingest шалгах</p>
              <pre>
                <code>GET http://localhost:8001/health{"\n"}POST http://localhost:8001/track</code>
              </pre>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
