import { createRouter, createWebHistory } from 'vue-router'
import { lenis } from '../lib/lenis'
import HomeView from '../views/HomeView.vue'
import { collections } from '../data/gallery'
export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/about', name: 'about', component: () => import('../views/AboutView.vue') },
    { path: '/work', name: 'work', component: () => import('../views/WorkView.vue') },
    {
      path: '/:type(concerts|portraits)/:slug',
      name: 'collection',
      component: () => import('../views/CollectionView.vue'),
      // old folder-based links (e.g. /portraits/elena) redirect to the album's custom slug
      beforeEnter: (to) => {
        const c = collections.find((x) => x.type === to.params.type && x.key === to.params.slug && x.slug !== x.key)
        if (c) return { path: `/${c.type}/${c.slug}`, hash: to.hash, replace: true }
      },
    },
  ],
  scrollBehavior: (to, from) => {
    if (to.hash && to.path === from.path) lenis.scrollTo(to.hash)
    return false
  },
})
