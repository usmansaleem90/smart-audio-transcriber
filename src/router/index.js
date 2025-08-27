import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'

const routes = [
  {
    path: '/',
    redirect: '/dashboard',
    // meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/components/LoginForm.vue'),
    // meta: { requiresGuest: true }
  },
  {
    path: '/signup',
    name: 'Signup',
    component: () => import('@/components/SignupForm.vue'),
    // meta: { requiresGuest: true }
  },
  {
    path: '/dashboard',
    component: () => import('@/layouts/DashboardLayout.vue'),
    // meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: '/dashboard/upload-audio'
      },
      {
        path: 'upload-audio',
        name: 'UploadAudio',
        component: () => import('@/views/UploadAudio.vue')
      },
      {
        path: 'listing',
        name: 'Listing',
        component: () => import('@/views/DashboardHome.vue')
      },
      {
        path: 'extract-audio-from-youtube',
        name: 'ExtractAudioFromYoutube',
        component: () => import('@/views/ExtractAudioFromYoutube.vue')
      },
      {
        path: 'transcribe-audio',
        name: 'TranscribeAudio',
        component: () => import('@/views/TranscribeAudio.vue')
      },
      {
        path: 'articles',
        name: 'Articles',
        component: () => import('@/views/GeneratedArticles.vue')
      },
      {
        path: 'subscriptions',
        name: 'Subscriptions',
        component: () => import('@/views/Subscriptions.vue')
      },
      {
        path: 'blog-articles',
        name: 'BlogArticles',
        component: () => import('@/views/BlogArticles.vue'),
        // meta: { requiresAuth: true }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard'
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

// Navigation guard
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const isAuthenticated = authStore.isAuthenticated

  // Routes that require authentication
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!isAuthenticated) {
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
    } else {
      next()
    }
  }
  
  // Routes that require guest access (login, signup)
  else if (to.matched.some(record => record.meta.requiresGuest)) {
    if (isAuthenticated) {
      next('/dashboard')
    } else {
      next()
    }
  }
  
  // Public routes
  else {
    next()
  }
})

export default router
