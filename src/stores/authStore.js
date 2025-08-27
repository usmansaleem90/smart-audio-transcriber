import { defineStore } from 'pinia'
import { apiClient } from '@/api/axios'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
    loading: false,
    error: null,
    successMessage: null
  }),

  getters: {
    isAuthenticated: (state) => !!state.user,
    getUser: (state) => state.user,
    getToken: (state) => state.user?.access_token
  },

  actions: {
    clearMessages() {
      this.error = null
      this.successMessage = null
    },

    generateIv() {
      return Math.random().toString(36).substring(2, 15) + 
             Math.random().toString(36).substring(2, 15)
    },

    async register(userData) {
      try {
        this.loading = true
        this.clearMessages()
        const payload = {
          ...userData,
          iv: this.generateIv()
        }
        const response = await apiClient.post('/auth/signup', payload)
        this.successMessage = 'Registration successful! Please login to continue.'
        return response.data
      } catch (error) {
        if (Array.isArray(error.response?.data)) {
          this.error = error.response.data.join(', ')
        } else {
          this.error = error.response?.data?.message || 
                      error.response?.data || 
                      'Registration failed'
        }
        throw error
      } finally {
        this.loading = false
      }
    },

    async login(credentials) {
      try {
        this.loading = true
        this.clearMessages()
        const response = await apiClient.post('/auth/login', credentials)
        this.user = response.data
        localStorage.setItem('user', JSON.stringify(response.data))
        this.successMessage = 'Login successful! Welcome back!'
        return response.data
      } catch (error) {
        if (Array.isArray(error.response?.data)) {
          this.error = error.response.data.join(', ')
        } else {
            console.log("error::",error.message.message)
          this.error = error?.message?.message || 
                      error.response?.data?.message || 
                      'Login failed'
        }
        throw error
      } finally {
        this.loading = false
      }
    },

    async googleAuth(credential) {
      try {
        this.loading = true
        this.clearMessages()
        const response = await apiClient.post('/auth/google', { token: credential })
        this.user = response.data
        localStorage.setItem('user', JSON.stringify(response.data))
        this.successMessage = 'Google authentication successful! Welcome back!'
        return response.data
      } catch (error) {
        if (Array.isArray(error.response?.data)) {
          this.error = error.response.data.join(', ')
        } else {
          this.error = error.response?.data?.message || 
                      error.response?.data || 
                      'Google authentication failed'
        }
        throw error
      } finally {
        this.loading = false
      }
    },

    async logout() {
      try {
        this.loading = true
        this.clearMessages()
        
        this.user = null
        localStorage.removeItem('user')
        this.successMessage = 'Logged out successfully'
        
        return true
      } catch (error) {
        this.error = 'Logout failed'
        throw error
      } finally {
        this.loading = false
      }
    }
  }
}) 