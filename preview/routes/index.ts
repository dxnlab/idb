import routeProject from './project'
import routeTests from './tests'
import routeExamples from './examples'
import routeReferences from './references'

const routes = [
  { title: 'Reference', path: '/reference', ...routeReferences },
  { title: 'Example', path: '/example', ...routeExamples },
  { title: 'Tests', path: '/test', ...routeTests },
  { title: '@dxnlab/idb', path: '/', ...routeProject },
];

export default routes;