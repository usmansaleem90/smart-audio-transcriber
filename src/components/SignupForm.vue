<template>
    <div>
        
            <div class="d-flex align-center company-brand pa-4">
                <div>
                    <v-img
                    src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIyMCIgZmlsbD0iIzI1NjNlYiIvPjxwYXRoIGQ9Ik0xMiAyMGgxNk0yMCAxMnYxNiIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSI0Ii8+PC9zdmc+"
                    width="32" height="32" class="me-2" contain />
                </div>
                <span class="text-h6 text-sm-h5 font-weight-bold text-primary">Company Name</span>
            </div>
        

        <v-container class="fill-height auth-background pt-0">
            <v-row justify="center" align="center">
                <v-col cols="12" sm="8" md="6" lg="4">
                    <div class="text-center mb-4">
                        <h1 class="text-h5 text-sm-h4 font-weight-bold text-primary mb-1">
                            Create Account
                        </h1>
                        <p class="text-body-2 text-medium-emphasis">
                            Fill in your details to get started
                        </p>
                    </div>

                    <v-card class="pa-4 auth-card">
                        <v-card-text>
                            <!-- Google Sign Up Button -->
                            <div class="d-flex justify-center mb-4">
                                <GoogleLogin :callback="handleGoogleSignup" />
                            </div>

                            <div class="text-center my-4">
                                <v-divider class="my-3">
                                    <span class="text-body-2 text-medium-emphasis">OR</span>
                                </v-divider>
                            </div>

                            <v-alert
                                v-if="error || successMessage"
                                :type="error ? 'error' : 'success'"
                                variant="tonal"
                                closable
                                class="mb-4 alert-icon-centered "
                                border="start"
                                :text="error || successMessage"
                                density="comfortable"
                            >
                            </v-alert>

                            <v-form @submit.prevent="handleSubmit" v-model="isFormValid" ref="signupForm">
                                <v-text-field 
                                    v-model="formData.firstName" 
                                    label="First Name"
                                    :rules="validationRules.requiredRule" 
                                    required 
                                    prepend-inner-icon="mdi-account"
                                    density="comfortable"
                                    class="mb-2" 
                                />

                                <v-text-field 
                                    v-model="formData.lastName" 
                                    label="Last Name"
                                    :rules="validationRules.requiredRule" 
                                    required 
                                    prepend-inner-icon="mdi-account"
                                    density="comfortable"
                                    class="mb-2" 
                                />

                                <v-text-field 
                                    v-model="formData.email" 
                                    label="Email" 
                                    type="email"
                                    :rules="validationRules.emailRules" 
                                    required 
                                    prepend-inner-icon="mdi-email"
                                    density="comfortable"
                                    class="mb-2" 
                                />

                                <v-text-field 
                                    v-model="formData.password" 
                                    label="Password"
                                    :type="showPassword ? 'text' : 'password'" 
                                    :rules="validationRules.passwordRules"
                                    required 
                                    prepend-inner-icon="mdi-lock"
                                    :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                                    @click:append-inner="togglePassword" 
                                    density="comfortable"
                                    class="mb-4" 
                                />

                                <v-btn 
                                    color="primary" 
                                    block 
                                    type="submit" 
                                    :loading="loading" 
                                    :disabled="!isFormValid"
                                    class="mb-3"
                                >
                                    Create Account
                                </v-btn>

                                <div class="text-center text-body-2">
                                    Already have an account?
                                    <router-link to="/login" class="font-weight-medium text-primary text-decoration-none">
                                        Sign in instead
                                    </router-link>
                                </div>
                            </v-form>
                        </v-card-text>
                    </v-card>
                </v-col>
            </v-row>
        </v-container>
    </div>
</template>

<script>
/**
 * @component SignupForm
 * @description Handles new user registration with comprehensive user details
 */
import { GoogleLogin } from 'vue3-google-login'
import { useAuthStore } from '@/stores/authStore'
import { mapState, mapActions } from 'pinia'

export default {
    name: 'SignupForm',

    components: {
        GoogleLogin
    },

    data() {
        return {
            /** 
             * @type {Object} Form input data
             * @property {string} firstName - User's first name
             * @property {string} lastName - User's last name
             * @property {string} email - User's email address
             * @property {string} password - User's password
             * @property {string|null} country - Selected country
             * @property {string} phone - User's phone number
             */
            formData: {
                firstName: '',
                lastName: '',
                email: '',
                password: '',
                country: null,
                phone: ''
            },
            /** @type {boolean} Toggle for password visibility */
            showPassword: false,
            /** @type {boolean} Loading state for form submission */
            loading: false,
            /** @type {boolean} Form validation state */
            isFormValid: false,
            /** @type {Array<string>} List of available countries */
            countries: [
                'United States',
                'United Kingdom',
                'Canada',
                'Australia',
                'Germany',
                'France',
                'Japan',
            ],
            /** @type {Object} Validation rules for form fields */
            validationRules: {
                /** @type {Array<Function>} Required field validation */
                requiredRule: [
                    v => !!v || 'This field is required'
                ],
                /** @type {Array<Function>} Email validation rules */
                emailRules: [
                    v => !!v || 'Email is required',
                    v => /.+@.+\..+/.test(v) || 'Email must be valid'
                ],
                /** @type {Array<Function>} Password validation rules */
                passwordRules: [
                    v => !!v || 'Password is required',
                    v => v?.length >= 8 || 'Password must be at least 8 characters'
                ],
                /** @type {Array<Function>} Phone number validation rules */
                phoneRules: [
                    v => !!v || 'Phone number is required',
                    v => /^\+?[\d\s-]{8,}$/.test(v) || 'Please enter a valid phone number'
                ]
            }
        }
    },

    computed: {
        /**
         * Maps loading, error, and successMessage states from the auth store
         * @returns {Object} Object containing loading state, error messages, and success messages
         */
        ...mapState(useAuthStore, ['loading', 'error', 'successMessage'])
    },

    methods: {
        /**
         * Maps authentication actions from the auth store
         */
        ...mapActions(useAuthStore, ['register', 'login', 'googleAuth']),

        /**
         * Toggles password field visibility between text and password type
         * @returns {void}
         */
        togglePassword() {
            this.showPassword = !this.showPassword
        },

        /**
         * Handles form submission for user registration
         * @async
         * @returns {Promise<void>}
         * @throws {Error} When signup API call fails
         */
        async handleSubmit() {
            const isValid = await this.$refs.signupForm.validate()

            if (isValid) {
                try {
                    await this.register({
                        name: `${this.formData.firstName} ${this.formData.lastName}`,
                        email: this.formData.email,
                        password: this.formData.password
                    })
                    
                    // Wait for a moment to show the success message
                    setTimeout(() => {
                        this.$router.push('/login')
                    }, 2000)
                } catch (error) {
                    console.error('Signup failed:', error)
                }
            }
        },

        /**
         * Handles Google signup authentication
         * @async
         * @param {Object} response - Google OAuth response object
         * @param {string} response.credential - Google OAuth credential token
         * @returns {Promise<void>}
         * @throws {Error} When Google authentication fails
         */
        async handleGoogleSignup(response) {
            try {
                await this.googleAuth(response.credential)
                this.$router.push('/dashboard')
            } catch (error) {
                console.error('Google signup failed:', error)
            }
        }
    }
}
</script>

<style scoped>
.auth-background {
    background: linear-gradient(135deg, var(--v-background-base) 0%, var(--v-surface-base) 100%);
    min-height: calc(100vh - 80px); /* Adjust for company brand height */
}



.auth-card {
    border: 1px solid #e2e8f0;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
}

/* Mobile Responsive Styles */
@media (max-width: 600px) {
    .company-brand {
        padding: 12px !important;
    }

    .company-brand .v-img {
        width: 28px !important;
        height: 28px !important;
    }

    :deep(.text-h4) {
        font-size: 1.5rem !important;
    }

    :deep(.text-h5) {
        font-size: 1.25rem !important;
    }

    :deep(.text-h6) {
        font-size: 1rem !important;
    }

    :deep(.text-body-2) {
        font-size: 0.875rem !important;
    }

    :deep(.v-card-text) {
        padding: 16px 12px;
    }

    .auth-card {
        margin: 0 8px;
    }

    :deep(.v-text-field) {
        margin-bottom: 12px !important;
    }
}
</style>