<template>
  <v-card class="pa-6">
    <h2 class="text-h5 mb-6">Choose Blog Generation Method</h2>
    
    <div class="option-cards">
      <v-card
        v-for="option in options"
        :key="option.value"
        :class="['option-card mb-4', { 'selected': selectedOption === option.value }]"
        elevation="2"
        @click="selectOption(option.value)"
      >
        <v-card-item>
          <div class="d-flex align-center mb-2">
            <v-icon :icon="option.icon" color="primary" class="me-2"></v-icon>
            <div class="text-h6">{{ option.title }}</div>
          </div>
          <div class="text-body-2">{{ option.description }}</div>
        </v-card-item>
      </v-card>
    </div>

    <v-btn 
      color="primary" 
      block 
      :disabled="!selectedOption"
      @click="confirmSelection"
    >
      Continue
    </v-btn>
  </v-card>
</template>

<script>
export default {
  name: 'BlogTypePrompt',
  
  data() {
    return {
      selectedOption: null,
      options: [
        {
          value: 1,
          title: 'Transcript Based',
          description: 'Generate blog outline using only your uploaded transcripts',
          icon: 'mdi-text-box'
        },
        {
          value: 2,
          title: 'AI Prompt Based',
          description: 'Generate blog outline using AI with your custom instructions',
          icon: 'mdi-robot'
        },
        {
          value: 3,
          title: 'Combined Approach',
          description: 'Use both transcripts and AI instructions for comprehensive blog generation',
          icon: 'mdi-puzzle'
        }
      ]
    }
  },

  methods: {
    selectOption(value) {
      this.selectedOption = value
    },
    confirmSelection() {
      this.$emit('option-selected', this.selectedOption)
    }
  }
}
</script>

<style scoped>
.option-card {
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.option-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.option-card.selected {
  border-color: rgb(var(--v-theme-primary));
  background-color: rgb(var(--v-theme-primary-lighten-5));
}
</style> 