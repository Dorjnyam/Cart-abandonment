import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Event Capture',
    Svg: require('@site/static/img/observer_event_capture.svg').default,
    description: (
      <>
        Browser snippet-ээс ирсэн event-үүдийг tier policy ашиглан шүүж,
        PostgreSQL болон Kafka руу дамжуулна.
      </>
    ),
  },
  {
    title: 'Field Catalog',
    Svg: require('@site/static/img/observer_field_catalog.svg').default,
    description: (
      <>
        T3, T2, T1 талбаруудын ялгаа, alias, хадгалах дүрэм болон судалгааны
        бүлгийг нэг лавлахад цуглуулсан.
      </>
    ),
  },
  {
    title: 'Integration',
    Svg: require('@site/static/img/observer_integration.svg').default,
    description: (
      <>
        Session service, Main service болон demo shop-той холбох алхмуудыг
        local runbook хэлбэрээр бичсэн.
      </>
    ),
  },
];

function Feature({title, Svg, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
