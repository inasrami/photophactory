import { createRouter, createWebHistory } from 'vue-router'
import { lenis } from '../lib/lenis'
import HomeView from '../views/HomeView.vue'
export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/work', name: 'work', component: () => import('../views/Workview.vue') },
    {
      path: '/:type(concerts|portraits)/:slug',
      name: 'collection',
      component: () => import('../views/CollectionView.vue'),
    },
  ],
  scrollBehavior: (to, from) => {
    if (to.hash && to.path === from.path) lenis.scrollTo(to.hash)
    return false
  },
})
