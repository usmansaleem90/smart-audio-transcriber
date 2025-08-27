<template>
  <v-container>
    <!-- Error/Success Alert -->
    <v-alert 
      v-if="error || isExtractionSuccess" 
      :type="error ? 'error' : 'success'" 
      :color="error ? 'error-lighten' : 'success-lighten'"
      :class="[
        'mb-4 alert-icon-centered',
        error ? 'error-alert' : 'success-alert'
      ]"
      closable 
      @click="() => {
        error = null;
        isExtractionSuccess = false;
      }"
    >
      <template v-slot:prepend>
        <v-icon
          :icon="error ? 'mdi-alert-circle' : 'mdi-check-circle'"
          :color="error ? 'error' : 'success'"
          start
        />
      </template>
      {{ error || 'Audio extraction completed successfully!' }}
    </v-alert>

    <v-row>
      <v-col cols="12">
        <v-card class="youtube-container">
          <!-- Sticky Header -->
          <v-card-title class="d-flex align-center py-4 px-6">
            <v-icon icon="mdi-youtube" :size="$vuetify.display.smAndDown ? '24' : '32'" class="me-3" color="primary"/>
            <span :class="$vuetify.display.smAndDown ? 'text-subtitle-2' : 'text-h6'">
              Extract Audio from YouTube
            </span>
          </v-card-title>

          <v-divider></v-divider>

          <!-- Add More Button -->
          <div v-if="youtubeCards.length" class="sticky-header d-flex align-center justify-end pa-3">
            <v-btn
              prepend-icon="mdi-plus"
              class="add-more-button text-capitalize"
              :class="$vuetify.display.smAndDown ? 'text-caption' : 'text-button'"
              size="small"

              variant="outlined"
              color="primary"
              @click="addNewCard"
              :disabled="youtubeCards.length >= 5"
            >
              Add More Links ({{ youtubeCards.length }}/5)
            </v-btn>
          </div>

          <!-- Cards Container with Scrollable Area -->
          <div class="cards-container">
            <!-- Empty State -->
            <div v-if="youtubeCards.length === 0" class="empty-state pa-8 text-center">
              <v-icon size="64" color="primary" class="mb-4">mdi-youtube</v-icon>
              <div class="text-h6 mb-2">No YouTube Links Added</div>
              <div class="text-body-2 text-medium-emphasis mb-4">
                Add YouTube links to extract audio from videos
              </div>
              <v-btn color="primary" prepend-icon="mdi-plus" @click="addNewCard">
                Add YouTube Link
              </v-btn>
            </div>

            <!-- Scrollable Cards Wrapper -->
            <div v-else class="cards-wrapper">
              <v-slide-y-transition group>
                <div v-for="(card, index) in youtubeCards" :key="card.id" class="pa-4">
                  <v-card class="bg-grey-lighten-4 youtube-card" elevation="1">

                    <v-card-title class="d-flex align-center py-4 px-6">
                      <v-icon icon="mdi-youtube" :size="24" class="me-3" color="error"/>
                      <span class="text-subtitle-1">Video {{ youtubeCards.length > 1 ? index + 1 : '' }}</span>
                      <v-spacer />
                      <v-btn
                        icon="mdi-delete"
                        variant="text"
                        density="comfortable"
                        @click="removeCard(card.id)"
                        color="error"
                        :disabled="processing"
                      />
                    </v-card-title>

                    <v-card-text class="pa-4">
                      <v-text-field
                        :id="card.titleId"
                        v-model="card.title"
                        label="Video Title"
                        variant="outlined"
                        density="comfortable"
                        class="mb-3"
                        prepend-inner-icon="mdi-format-title"
                        :rules="[validateTitle]"
                        :error-messages="card.titleError"
                        :disabled="processing"
                        hide-details="auto"
                      />

                      <v-text-field
                        :id="card.linkId"
                        v-model="card.link"
                        label="YouTube Video Link"
                        variant="outlined"
                        density="comfortable"
                        prepend-inner-icon="mdi-link"
                        :rules="[validateYoutubeUrl]"
                        :error-messages="card.linkError"
                        :disabled="processing"
                        hide-details="auto"
                      />
                    </v-card-text>
                  </v-card>
                </div>
              </v-slide-y-transition>
            </div>

            <!-- Fixed Extract Button -->
            <div class="extract-button-wrapper">
              <v-btn
                color="primary"
                :loading="processing"
                :disabled="!isValidForm || youtubeCards.length === 0"
                @click="processYoutubeLinks"
                :size="$vuetify.display.smAndDown ? 'small' : 'large'"
                prepend-icon="mdi-download"
                class="text-capitalize"
                block
              >
                Extract {{ youtubeCards.length > 1 ? 'All' : '' }} {{ youtubeCards.length > 1 ? 'Audios' : 'Audio' }}
              </v-btn>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
/**
 * @component ExtractAudioFromYoutube
 * @description Handles YouTube video audio extraction functionality
 */
import { useAudioStore } from '@/stores/audioStore';

export default {
  name: "ExtractAudioFromYoutube",

  data() {
    return {
      /** @type {Array<Object>} Array of YouTube card data */
      youtubeCards: [],
      /** @type {boolean} Processing state */
      processing: false,
      /** @type {string|null} Error message */
      error: null,
      /** @type {boolean} Success state */
      isExtractionSuccess: false,
    };
  },

  computed: {
    /**
     * Checks if all form inputs are valid
     * @returns {boolean} Form validity state
     */
    isValidForm() {
      return this.youtubeCards.every(
        (card) =>
          card.title.trim() &&
          card.link.trim() &&
          this.validateYoutubeUrl(card.link) &&
          this.validateTitle(card.title)
      );
    },
  },

  methods: {
    /**
     * Creates a new YouTube card with unique IDs
     * @returns {Object} New card object
     */
    createNewCard() {
      return {
        id: `card-${Math.random().toString(36).substr(2, 9)}`,
        titleId: `title-${Math.random().toString(36).substr(2, 9)}`,
        linkId: `link-${Math.random().toString(36).substr(2, 9)}`,
        title: "",
        link: "",
      };
    },

    /**
     * Adds a new YouTube card if limit not reached
     */
    addNewCard() {
      if (this.youtubeCards.length < 5) {
        this.youtubeCards.push(this.createNewCard());
      }
    },

    /**
     * Removes a card by ID
     * @param {string} cardId - ID of card to remove
     */
    removeCard(cardId) {
      const index = this.youtubeCards.findIndex((card) => card.id === cardId);
      if (index !== -1) {
        this.youtubeCards.splice(index, 1);
      }
    },

    /**
     * Validates YouTube URL format
     * @param {string} url - URL to validate
     * @returns {boolean|string} True if valid, error message if invalid
     */
    validateYoutubeUrl(url) {
      if (!url) return true;
      const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
      return pattern.test(url) || "Please enter a valid YouTube URL";
    },

    /**
     * Validates title format
     * @param {string} value - Title to validate
     * @returns {boolean|string} True if valid, error message if invalid
     */
    validateTitle(value) {
      if (!value) return true;
      return (
        /^[a-zA-Z0-9\s]+$/.test(value) ||
        "Title must contain only letters, numbers, and spaces"
      );
    },

    /**
     * Processes YouTube links for audio extraction
     * @returns {Promise<void>}
     */
    async processYoutubeLinks() {
      if (!this.isValidForm) return;

      this.processing = true;
      this.error = null;
      const audioStore = useAudioStore();

      try {
        console.log("Processing YouTube cards:", this.youtubeCards);
        
        for (const card of this.youtubeCards) {
          // Extract video ID from YouTube URL
          const videoId = this.extractVideoId(card.link);
          console.log("Extracted video ID:", videoId);
          
          if (!videoId) {
            throw new Error(`Invalid YouTube URL: ${card.link}`);
          }

          const transcript = await audioStore.extractYoutubeTranscript(videoId);
          console.log("Extracted transcript for video:", card.title);
          // console.log("Transcript:", transcript);
        }

        this.isExtractionSuccess = true;
      } catch (error) {
        console.error("Error processing YouTube links:", error);
        this.error = error.message || "Failed to process YouTube links";
      } finally {
        this.processing = false;
      }
    },

    // Add this helper method to extract video ID
    extractVideoId(url) {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
    },
  },
};
</script>

<style scoped>
.youtube-container {
  position: relative;
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
}

.sticky-header {
  position: sticky;
  top: 0;
  z-index: 1;
  background-color: white;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.cards-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.cards-wrapper {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 80px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  background-color: rgb(var(--v-theme-surface-variant));
  border-radius: 8px;
  margin: 16px;
}

.extract-button-wrapper {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background: white;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 -2px 4px rgba(0,0,0,0.05);
}

.add-more-button {
  min-width: 140px !important;
  height: 36px !important;
}

/* Custom scrollbar styles */
.cards-wrapper::-webkit-scrollbar {
  width: 8px;
}

.cards-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.cards-wrapper::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.cards-wrapper::-webkit-scrollbar-thumb:hover {
  background: #666;
}

/* Add responsive styles for mobile */
@media (max-width: 600px) {
  .extract-button-wrapper {
    padding: 12px;
  }

  .cards-wrapper {
    padding-bottom: 70px;
  }

  .empty-state {
    margin: 8px;
  }
}

.youtube-card {
  position: relative;
  overflow: hidden;
  border-radius: 8px !important;
}

.youtube-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 4px;
  background: linear-gradient(to bottom, rgb(var(--v-theme-error)), rgb(var(--v-theme-primary)));
  border-radius: 4px 0 0 4px;
}
</style>
