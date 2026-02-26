import { createRouter, createWebHistory } from 'vue-router'
import { getAuth } from "firebase/auth"

const routes = [
  { path: '/', name: 'Login', component: () => import('../components/Login.vue') },
  { path: '/register', name: 'Register', component: () => import('../components/Register.vue') },
  { path: '/messags', name: 'Messags', component: () => import('../components/Messags.vue') },
  { path: '/profile', name: 'Profile', component: () => import('../components/Profile.vue') }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const auth = getAuth()
  const user = auth.currentUser

  if (to.meta.requiresAuth && !user) {
    next('/')
  } else {
    next()
  }
})

export default router   