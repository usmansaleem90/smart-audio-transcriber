<template>
  <v-app id="dashboard">
    <v-navigation-drawer
      v-model="drawer"
      :permanent="!isMobile"
      :temporary="isMobile"
      :rail="isRail && !isMobile"
      @click="handleDrawerClick"
      elevation="1"
    >
      <v-list-item
        :prepend-avatar="companyLogo"
        :title="isRail ? '' : 'Company Name'"
        nav
      >
        <template v-slot:append>
          <v-btn
            v-if="!isMobile"
            variant="text"
            :icon="isRail ? 'mdi-chevron-right' : 'mdi-chevron-left'"
            @click.stop="isRail = !isRail"
          ></v-btn>
        </template>
      </v-list-item>

      <v-divider></v-divider>

      <v-list density="compact" nav>
        <template v-for="(item, index) in menuItems" :key="index">
          <!-- Group Items -->
          <v-list-group v-if="item.type === 'group'" :value="item.value">
            <template v-slot:activator="{ props }">
              <v-list-item
                v-bind="props"
                :prepend-icon="item.icon"
                :title="item.title"
              ></v-list-item>
            </template>

            <v-list-item
              v-for="(child, childIndex) in item.children"
              :key="childIndex"
              :value="child.path"
              :to="child.path"
              :prepend-icon="child.icon"
              :title="child.title"
              :class="{ 'bg-primary-lighten-4': isCurrentRoute(child.path) }"
            ></v-list-item>
          </v-list-group>

          <!-- Single Items -->
          <v-list-item
            v-else
            :value="item.path"
            :to="item.path"
            :prepend-icon="item.icon"
            :title="item.title"
            :class="{ 'bg-primary-lighten-4': isCurrentRoute(item.path) }"
          ></v-list-item>
        </template>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar
      elevation="1"
      position="sticky"
    >
      <v-app-bar-nav-icon
        v-if="isMobile"
        variant="text"
        @click.stop="drawer = !drawer"
      ></v-app-bar-nav-icon>
      <v-app-bar-title>{{ getPageTitle }}</v-app-bar-title>
      <v-spacer></v-spacer>

      <!-- User Menu -->
      <v-menu
        v-model="userMenu"
        :close-on-content-click="false"
        location="bottom end"
      >
        <template v-slot:activator="{ props }">
          <v-btn
            class="ml-2"
            v-bind="props"
          >
            <v-avatar size="35" color="primary">
              <span class="text-h6 font-weight-medium">{{ userInitials }}</span>
            </v-avatar>
            <v-icon
              :icon="userMenu ? 'mdi-chevron-up' : 'mdi-chevron-down'"
              class="ml-2"
            ></v-icon>
          </v-btn>
        </template>

        <v-card min-width="200">
          <v-list>
            <v-list-item>
              <template v-slot:prepend>
                <v-avatar size="40" color="primary">
                  <span class="text-h6 font-weight-medium">{{ userInitials }}</span>
                </v-avatar>
              </template>
              <v-list-item-title class="text-subtitle-1 font-weight-medium">
                {{ userName }}
              </v-list-item-title>
              <v-list-item-subtitle>{{ userEmail }}</v-list-item-subtitle>
            </v-list-item>

            <v-divider></v-divider>

            <v-list-item
              value="profile"
              @click="navigateToProfile"
            >
              <template v-slot:prepend>
                <v-icon icon="mdi-account-outline"></v-icon>
              </template>
              <v-list-item-title>Profile</v-list-item-title>
            </v-list-item>

            <v-list-item
              value="subscriptions"
              @click="navigateToSubscriptions"
            >
              <template v-slot:prepend>
                <v-icon icon="mdi-credit-card"></v-icon>
              </template>
              <v-list-item-title>Subscription Plans</v-list-item-title>
            </v-list-item>

            <v-list-item
              value="logout"
              @click="handleLogout"
              color="error"
              :loading="loading"
            >
              <template v-slot:prepend>
                <v-icon icon="mdi-logout"></v-icon>
              </template>
              <v-list-item-title>{{ loading ? 'Logging out...' : 'Logout' }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-menu>
    </v-app-bar>

    <v-main class="bg-grey-lighten-3 overflow-y-auto">
      <v-container fluid class="h-100 pa-4">
        <router-view></router-view>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
/**
 * @component DashboardLayout
 * @description Main layout component for the dashboard area
 */
import { useAuthStore } from '@/stores/authStore'
import { mapState, mapActions } from 'pinia'

export default {
  name: 'DashboardLayout',

  data() {
    return {
      drawer: null,
      isRail: false,
      isMobile: false,
      userMenu: false,
      companyLogo: '/path/to/your/logo.png',
      menuItems: [
        {
          title: 'Files',
          icon: 'mdi-folder',
          type: 'group',
          value: 'files',
          children: [
            {
              title: 'Transcripts',
              icon: 'mdi-view-list',
              path: '/dashboard/listing'
            },
            {
              title: 'Articles',
              icon: 'mdi-file-document-outline',
              path: '/dashboard/articles'
            }
          ]
        },
        {
          title: 'Transcribe',
          icon: 'mdi-microphone',
          type: 'group',
          value: 'transcribe',
          children: [
            {
              title: 'Upload Audios',
              icon: 'mdi-upload',
              path: '/dashboard/upload-audio'
            },
            {
              title: 'Extract Audios from YouTube',
              icon: 'mdi-youtube',
              path: '/dashboard/extract-audio-from-youtube'
            },
            {
              title: 'Transcribe Audios',
              icon: 'mdi-microphone',
              path: '/dashboard/transcribe-audio'
            }
          ]
        },
        {
          title: 'Write',
          icon: 'mdi-pencil',
          type: 'group',
          value: 'write',
          children: [
            {
              title: 'Blog Articles',
              icon: 'mdi-post-outline',
              path: '/dashboard/blog-articles'
            }
          ]
        }
      ]
    }
  },

  mounted() {
    this.checkScreen()
    window.addEventListener('resize', this.checkScreen)
  },

  beforeUnmount() {
    window.removeEventListener('resize', this.checkScreen)
  },

  computed: {
    /**
     * Computes user initials from user name
     * @returns {string}
     */
    userInitials() {
      return (this.user?.user?.name || '')
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
    },

    ...mapState(useAuthStore, ['loading', 'user']),

    userName() {
      return this.user?.user?.name || 'User'
    },

    userEmail() {
      return this.user?.user?.email || 'user@example.com'
    },

    /**
     * Gets the page title based on current route
     * @returns {string} Current page title
     */
    getPageTitle() {
      // if (this.$route.path === '/dashboard') return 'Dashboard';
      // if (this.$route.path === '/dashboard/profile') return 'User Profile';

      // Search in all menu items and their children
      for (const item of this.menuItems) {
        if (item.type === 'group') {
          const child = item.children.find(child => child.path === this.$route.path);
          if (child) return child.title;
        } else if (item.path === this.$route.path) {
          return item.title;
        }
      }
      
      return 'Dashboard';
    }
  },

  methods: {
    ...mapActions(useAuthStore, ['logout']),

    handleDrawerClick() {
      if (this.isRail && !this.isMobile) {
        this.isRail = false
      }
    },

    checkScreen() {
      this.isMobile = window.innerWidth < 768
      this.drawer = !this.isMobile
      if (this.isMobile) {
        this.isRail = false
      }
    },

    /**
     * Checks if the given path matches the current route
     * Handles route groups to prevent multiple highlights
     * @param {string} path - Route path to check
     * @returns {boolean}
     */
    isCurrentRoute(path) {
      // Define route groups that should be mutually exclusive
      const routeGroups = [
        ['/dashboard/listing', '/dashboard/upload-audio'],
        // Add other groups if needed
      ];

      // Check if path is part of a group
      const group = routeGroups.find(group => group.includes(path));
      if (group) {
        // If in a group, only highlight if exact match
        return this.$route.path === path;
      }

      // For non-grouped routes, use normal matching
      return this.$route.path === path;
    },

    /**
     * Navigates to user profile page
     * @returns {void}
     */ 
    navigateToProfile() {
      this.userMenu = false
      this.$router.push('/dashboard/profile')
    },

    /**
     * Navigates to subscriptions page
     * @returns {void}
     */
    navigateToSubscriptions() {
      this.userMenu = false
      this.$router.push('/dashboard/subscriptions')
    },

    /**
     * Handles user logout
     * @returns {Promise<void>}
     */
    async handleLogout() {
      try {
        await this.logout()
        this.$router.push('/login')
      } catch (error) {
        console.error('Logout failed:', error)
      }
    }
  }
}
</script>

<style scoped>
.v-navigation-drawer ::v-deep .v-navigation-drawer__content::-webkit-scrollbar {
  width: 5px;
}

.v-navigation-drawer ::v-deep .v-navigation-drawer__content::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 5px;
}

:deep(.v-main) {
  height: 100vh;
  overflow-y: auto;
}

:deep(.v-container) {
  max-height: 100%;
}

#dashboard {
  height: 100vh;
  overflow: hidden;
}
</style> 