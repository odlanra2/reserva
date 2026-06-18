import { createRouter, createWebHistory } from 'vue-router'
import UsersScreen from '../page/UsersScreen.vue'
import ServicesScreen from '../page/ServicesScreen.vue'
import MisReservas from '../page/MisReservas.vue'

const routes = [
  { path: '/', component: UsersScreen },
  { path: '/services/:id', component: ServicesScreen },
  { path: '/reservations/:id', component: MisReservas },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router