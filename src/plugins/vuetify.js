/**
 * @file Vuetify configuration and theme setup
 */

import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

/**
 * Custom theme configuration for the application
 * @type {Object}
 */
const customTheme = {
  dark: false,
  colors: {
    primary: '#7C3AED',
    secondary: '#475569',
    accent: '#9F67FF',
    success: '#22c55e',
    'success-lighten': '#dcfce7',
    error: '#ef4444',
    'error-lighten': '#fee2e2',
    warning: '#f59e0b',
    info: '#3b82f6',
    background: '#f8fafc',
    surface: '#ffffff',
    'surface-variant': '#F3F4F6',
    'border-color': '#E5E7EB',
    'on-success': '#ffffff',
    'on-error': '#ffffff',
    'on-surface': '#1e293b',
    'tooltip-background': '#1e293b',
    'tooltip-text': '#000',
  }
}

/**
 * Vuetify instance configuration
 * @type {import('vuetify').VuetifyOptions}
 */
const vuetifyConfig = {
  components,
  directives,
  theme: {
    defaultTheme: 'customTheme',
    themes: {
      customTheme,
    },
  },
  defaults: {
    VCard: {
      elevation: 0,
      rounded: 'lg',
    },
    VTextField: {
      variant: 'outlined',
      density: 'comfortable',
      color: 'primary',
    },
    VBtn: {
      rounded: 'lg',
      height: 44,
      fontWeight: '600',
    },
    VTooltip: {  
      color: 'tooltip-background',
      contentClass: 'text-tooltip-text',
    },
  },
}

export default createVuetify(vuetifyConfig)
