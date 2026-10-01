import './assets/main.css'
import './assets/luxury.css'
import './lib/lenis'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

createApp(App).use(router).mount('#app')
