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
    title: 'Architecture',
    Svg: require('@site/static/img/docs_architecture.svg').default,
    description: (
      <>
        Observer, Session, Feature, ML, Main service болон Dashboard-ийн
        хоорондын урсгалыг нэг дор тайлбарласан.
      </>
    ),
  },
  {
    title: 'Contracts',
    Svg: require('@site/static/img/docs_contracts.svg').default,
    description: (
      <>
        Kafka topic, REST endpoint, event payload болон dashboard response-ийн
        contract-уудыг тусад нь баримтжуулсан.
      </>
    ),
  },
  {
    title: 'Defense Evidence',
    Svg: require('@site/static/img/docs_evidence.svg').default,
    description: (
      <>
        E2E шалгалт, build output, health check болон model evaluation-ийн
        нотолгоог хамгаалалтын материалд хадгалсан.
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
