import routeProject from './project'
import routeSuites from './suites'
import routeExamples from './examples'
import routeReferences from './references'

const routes = [
  { title: 'Reference', path: '/reference', ...routeReferences },
  { title: 'Example', path: '/example', ...routeExamples },
  { title: 'Tests', path: '/suite', ...routeSuites },
  { title: '@dxnlab/idb', path: '/', ...routeProject },
];

export default routes;