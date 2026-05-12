import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  thesisSidebar: [
    {
      type: 'category',
      label: 'Танилцуулга',
      items: ['intro/system-goal', 'intro/mvp-verification', 'intro/limitations'],
    },
    {
      type: 'category',
      label: 'Архитектур',
      items: ['architecture/overview', 'architecture/services', 'architecture/kafka-flow', 'architecture/database'],
    },
    {
      type: 'category',
      label: 'Өгөгдлийн гэрээ',
      items: ['contracts/event-types', 'contracts/raw-events', 'contracts/session-enriched', 'contracts/feature-ready', 'contracts/prediction-done'],
    },
    {
      type: 'category',
      label: 'Оношлогоо',
      items: ['diagnosis/s1-s7', 'diagnosis/dominant-reason', 'diagnosis/recommendation-logic'],
    },
    {
      type: 'category',
      label: 'Машин сургалт',
      items: ['ml/xgboost', 'ml/training-data', 'ml/metrics', 'ml/lstm-future-work'],
    },
    {
      type: 'category',
      label: 'Dashboard гарын авлага',
      items: ['dashboard/overview', 'dashboard/sessions', 'dashboard/diagnosis', 'dashboard/recommendations', 'dashboard/integration'],
    },
    {
      type: 'category',
      label: 'Demo ба туршилт',
      items: ['demo/uc1', 'demo/uc2', 'demo/uc3', 'demo/e2e-script'],
    },
    {
      type: 'category',
      label: 'Хөгжүүлэгчийн гарын авлага',
      items: ['developer/docker', 'developer/environment', 'developer/api-endpoints', 'developer/troubleshooting'],
    },
    {
      type: 'category',
      label: 'Аюулгүй байдал',
      items: ['security/api-key', 'security/secrets', 'security/tenant-isolation', 'security/privacy'],
    },
  ],
  overviewSidebar: [
    {
      type: 'category',
      label: 'Legacy overview',
      items: ['overview/intro', 'overview/architecture', 'overview/getting-started'],
    },
  ],
  webSidebar: [
    {
      type: 'category',
      label: 'KICKLAB demo ecommerce',
      items: [
        'web/kicklab/intro',
        'web/kicklab/configuration',
        'web/kicklab/running-locally',
        'web/kicklab/deployment',
        'web/kicklab/auth',
        'web/kicklab/troubleshooting',
      ],
    },
    {
      type: 'category',
      label: 'Cart Analytics dashboard',
      items: [
        'web/cart-analytics/intro',
        'web/cart-analytics/configuration',
        'web/cart-analytics/running-locally',
        'web/cart-analytics/auth',
        'web/cart-analytics/troubleshooting',
      ],
    },
  ],
  servicesSidebar: [
    {
      type: 'category',
      label: 'Observer Service',
      items: [
        'services/observer/intro',
        'services/observer/api',
        'services/observer/data-models',
        'services/observer/configuration',
        'services/observer/running-locally',
        'services/observer/deployment',
        'services/observer/troubleshooting',
        'services/observer/adr',
      ],
    },
    {
      type: 'category',
      label: 'Session Service',
      items: [
        'services/session/intro',
        'services/session/api',
        'services/session/data-models',
        'services/session/configuration',
        'services/session/running-locally',
        'services/session/troubleshooting',
        'services/session/runbook',
      ],
    },
    {
      type: 'category',
      label: 'Feature Service',
      items: [
        'services/feature/intro',
        'services/feature/configuration',
        'services/feature/running-locally',
        'services/feature/troubleshooting',
        'services/feature/adr',
      ],
    },
    {
      type: 'category',
      label: 'ML Prediction Service',
      items: [
        'services/ml/intro',
        'services/ml/api',
        'services/ml/data-models',
        'services/ml/configuration',
        'services/ml/running-locally',
        'services/ml/troubleshooting',
        'services/ml/runbook',
        'services/ml/adr',
      ],
    },
    {
      type: 'category',
      label: 'Main Service',
      items: [
        'services/main/intro',
        'services/main/api',
        'services/main/data-models',
        'services/main/configuration',
        'services/main/running-locally',
        'services/main/troubleshooting',
        'services/main/runbook',
        'services/main/adr',
      ],
    },
  ],
};

export default sidebars;
