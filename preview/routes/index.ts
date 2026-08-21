import routeGuides from './guides'
import routeSuites from './suites'
import routeExamples from './examples'
import routeReferences from './references'

const routes = [
  { title: 'Reference', path: '/reference', ...routeReferences },
  { title: 'Example', path: '/example', ...routeExamples },
  { title: 'Tests', path: '/suite', ...routeSuites },
  { title: 'Guides', path: '/', ...routeGuides },
];

export default routes;