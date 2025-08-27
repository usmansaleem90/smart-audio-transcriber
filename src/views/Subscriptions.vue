<template>
  <v-container>
    <!-- Header Section -->
    <div class="d-flex flex-wrap align-center justify-space-between mb-6">
      <div class="mb-3 mb-sm-0">
        <h1 class="text-h5 text-sm-h4 font-weight-bold mb-1">
          Subscription Plans
        </h1>
        <p class="text-body-2 text-sm-body-1 text-medium-emphasis">
          Choose the plan that best fits your needs
        </p>
      </div>
    </div>

    <!-- Plan Toggle -->
    <div class="text-center mb-6">
      <v-btn-toggle
        v-model="billingCycle"
        mandatory
        rounded="pill"
        density="comfortable"
        color="primary"
        class="custom-toggle"
      >
        <v-btn value="yearly" class="text-body-2 toggle-btn"> Yearly (-20%) </v-btn>
        <v-btn value="monthly" class="text-body-2 toggle-btn"> Monthly </v-btn>
      </v-btn-toggle>
    </div>

    <!-- Subscription Cards -->
    <v-row justify="center" align="stretch">
      <v-col cols="12" sm="6" md="4" v-for="plan in plans" :key="plan.name">
        <v-card
          class="h-100 subscription-card"
          :class="{ 'most-popular': plan.popular }"
          elevation="2"
          @click="selectPlan(plan)"
        >
          <v-card-item>
            <!-- Popular Badge -->
            <v-chip
              v-if="plan.popular"
              color="success"
              size="small"
              class="most-popular-chip"
            >
              Most Popular
            </v-chip>

            <v-card-title class="text-h6 mb-2">{{ plan.name }}</v-card-title>
            <v-card-subtitle class="mb-2 text-medium-emphasis">
              {{ plan.description }}
            </v-card-subtitle>

            <!-- Price -->
            <div class="d-flex align-baseline mb-4">
              <span class="text-h4 font-weight-bold">
                ${{ getPlanPrice(plan) }}
              </span>
              <span class="text-subtitle-1 ml-1" v-if="billingCycle === 'monthly'">/mo</span>
              <span class="text-subtitle-1 ml-1" v-else>/year</span>
            </div>

            <v-card-actions class="pa-4">
              <v-btn
                block
                :color="plan.popular ? 'primary' : undefined"
                :variant="plan.popular ? 'flat' : 'outlined'"
                class="text-none"
              >
                Purchase Plan
              </v-btn>
            </v-card-actions>

            <!-- Features -->
            <v-list density="compact" class="bg-transparent">
              <v-list-item
                v-for="(feature, index) in plan.features"
                :key="index"
                class="px-0"
              >
                <template v-slot:prepend>
                  <v-icon color="success" size="small">mdi-check</v-icon>
                </template>
                <v-list-item-title class="text-body-2">
                  {{ feature }}
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-card-item>
        </v-card>
      </v-col>
    </v-row>

    <!-- Subscription Confirmation Dialog -->
    <v-dialog v-model="showConfirmDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h5 pa-4"> Confirm Subscription </v-card-title>
        <v-card-text class="pa-4">
          <p class="mb-4">
            You are about to subscribe to the {{ selectedPlan?.name }} plan.
          </p>
          <v-list density="compact" class="bg-transparent mb-4">
            <v-list-item>
              <template v-slot:prepend>
                <v-icon color="primary">mdi-check-circle</v-icon>
              </template>
              <v-list-item-title>
                {{ billingCycle === "yearly" ? "Yearly" : "Monthly" }} billing
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <template v-slot:prepend>
                <v-icon color="primary">mdi-check-circle</v-icon>
              </template>
              <v-list-item-title>
                ${{ getPlanPrice(selectedPlan) }}/month
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showConfirmDialog = false">
            Cancel
          </v-btn>
          <v-btn
            color="primary"
            @click="confirmSubscription"
            :loading="processing"
          >
            Confirm
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
/**
 * @component Subscriptions
 * @description Subscription plans management component with billing cycle options
 */
export default {
  name: "Subscriptions",

  data() {
    return {
      /** @type {'yearly'|'monthly'} Billing cycle selection */
      billingCycle: "yearly",
      /** @type {boolean} Dialog visibility state */
      showConfirmDialog: false,
      /** @type {Object|null} Currently selected plan */
      selectedPlan: null,
      /** @type {boolean} Processing state for subscription actions */
      processing: false,
      /** @type {Array<Object>} Available subscription plans */
      plans: [
        {
          name: "Essential",
          description:
            "There are many variations available, but the majority have suffered",
          monthlyPrice: 29,
          yearlyPrice: 23,
          features: [
            "Unlimited placeholder texts",
            "Consectetur adipiscing elit",
            "Excepteur sint occaecat cupidatat",
            "Officia deserunt mollit anim",
          ],
        },
        {
          name: "Perform",
          description:
            "There are many variations available, but the majority have suffered",
          monthlyPrice: 49,
          yearlyPrice: 39,
          popular: true,
          features: [
            "Unlimited placeholder texts",
            "Consectetur adipiscing elit",
            "Excepteur sint occaecat cupidatat",
            "Officia deserunt mollit anim",
            "Predefined chunks as necessary",
          ],
        },
        {
          name: "Enterprise",
          description:
            "There are many variations available, but the majority have suffered",
          monthlyPrice: 79,
          yearlyPrice: 63,
          features: [
            "Unlimited placeholder texts",
            "Consectetur adipiscing elit",
            "Excepteur sint occaecat cupidatat",
            "Officia deserunt mollit anim",
            "Predefined chunks as necessary",
            "Free from repetition",
          ],
        },
      ],
    };
  },

  methods: {
    /**
     * Calculates the price for a plan based on billing cycle
     * @param {Object} plan - The subscription plan object
     * @param {number} plan.monthlyPrice - Monthly price of the plan
     * @param {number} plan.yearlyPrice - Yearly price of the plan
     * @returns {number} Calculated price based on billing cycle
     */
    getPlanPrice(plan) {
      if (!plan) return 0;
      if (this.billingCycle === 'yearly') {
        return (plan.yearlyPrice * 12).toFixed(0);
      }
      return plan.monthlyPrice;
    },

    /**
     * Sets the selected plan and opens confirmation dialog
     * @param {Object} plan - The subscription plan to select
     */
    selectPlan(plan) {
      this.selectedPlan = plan;
      this.showConfirmDialog = true;
    },

    /**
     * Handles subscription confirmation process
     * Simulates API call for subscription processing
     * @returns {Promise<void>}
     */
    async confirmSubscription() {
      this.processing = true;
      try {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1500));
        this.showConfirmDialog = false;
        // TODO: Show success notification
      } catch (error) {
        // TODO: Show error notification
        console.error("Subscription failed:", error);
      } finally {
        this.processing = false;
      }
    },
  },
};
</script>

<style scoped>
.subscription-card {
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.subscription-card:hover {
  transform: translateY(-4px);
}

.most-popular {
  border: 2px solid rgb(var(--v-theme-primary));
}

.most-popular-chip {
  position: absolute;
  top: 12px;
  right: 12px;
}

:deep(.v-list-item) {
  min-height: 36px !important;
}

:deep(.v-btn-toggle) {
  background-color: rgb(var(--v-theme-surface-variant));
}

:deep(.v-btn-toggle .v-btn) {
  padding-inline: 24px;
}

:deep(.custom-toggle) {
  background-color: #f5f5f5;
  border: none !important;
  padding: 4px;
  border-radius: 100px;
  box-shadow: none;
}

:deep(.custom-toggle .v-btn) {
  background: transparent;
  color: rgba(0, 0, 0, 0.6);
  border: none !important;
  transition: all 0.3s ease;
  min-width: 120px;
  height: 40px;
  border-radius: 100px !important;
}

:deep(.custom-toggle .v-btn--active) {
  background: rgb(var(--v-theme-primary));
  color: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

:deep(.custom-toggle .v-btn:not(.v-btn--active):hover) {
  background: rgba(0, 0, 0, 0.04);
}

:deep(.v-btn-toggle .v-btn) {
  padding-inline: 24px;
}

/* Remove the border that appears on active state */
:deep(.v-btn--active:not(.v-btn--variant-outlined) .v-btn__overlay) {
  opacity: 0;
}
</style>
