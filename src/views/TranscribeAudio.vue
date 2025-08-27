<template>
  <v-container>
    <!-- Error/Success Alert -->
    <v-alert 
      v-if="error || isTranscriptionSuccess" 
      :type="error ? 'error' : 'success'" 
      :color="error ? 'error-lighten' : 'success-lighten'"
      :class="['mb-4 alert-icon-centered']"
      closable 
      @click="() => {
        error = null;
        isTranscriptionSuccess = false;
      }"
    >
      <template v-slot:prepend>
        <v-icon
          :icon="error ? 'mdi-alert-circle' : 'mdi-check-circle'"
          :color="error ? 'error' : 'success'"
          start
        />
      </template>
      {{ error || 'Transcription started successfully!' }}
    </v-alert>

    <v-row>
      <v-col cols="12">
        <v-card class="transcribe-container">
          <!-- Header -->
          <v-card-title class="d-flex align-center py-4 px-6">
            <v-icon 
              icon="mdi-transcribe" 
              :size="$vuetify.display.smAndDown ? '24' : '32'" 
              class="me-3"
              color="primary" 
            />
            <span :class="$vuetify.display.smAndDown ? 'text-subtitle-2' : 'text-h6'">
              Transcribe Audio Files
            </span>
          </v-card-title>

          <v-divider></v-divider>

          <!-- Content Container -->
          <div class="content-container">
            <!-- Empty State -->
            <div v-if="!hasAudioFiles" class="empty-state pa-8 text-center">
              <v-icon size="64" color="primary" class="mb-4">mdi-file-music</v-icon>
              <div class="text-h6 mb-2">No Audio Files Available</div>
              <div class="text-body-2 text-medium-emphasis mb-4">
                Upload audio files or extract from YouTube first
              </div>
              <v-btn color="primary" prepend-icon="mdi-upload" @click="$router.push('/dashboard/upload-audio')">
                Upload Audio Files
              </v-btn>
            </div>

            <!-- Form Content -->
            <div v-else class="form-wrapper pa-6">
              <v-select
                v-model="selectedAudios"
                :items="availableAudios"
                item-title="title"
                item-value="id"
                label="Select Audio Files"
                multiple
                chips
                variant="outlined"
                prepend-inner-icon="mdi-music-note"
                :rules="[v => !!v.length || 'Please select at least one audio file']"
              >
                <template v-slot:selection="{ item }">
                  <v-chip
                    :prepend-icon="item.raw.source === 'youtube' ? 'mdi-youtube' : 'mdi-file-music'"
                    :color="item.raw.source === 'youtube' ? 'error' : 'primary'"
                    class="mr-1"
                  >
                    {{ item.title }}
                  </v-chip>
                </template>
              </v-select>

              <v-select
                v-model="language"
                :items="languages"
                label="Audio Language"
                variant="outlined"
                prepend-inner-icon="mdi-translate"
                class="mt-4"
                :rules="[v => !!v || 'Please select a language']"
              />

              <!-- Fixed Button -->
              <div class="transcribe-button-wrapper">
                <v-btn
                  block
                  color="primary"
                  :size="$vuetify.display.smAndDown ? 'small' : 'large'"
                  :loading="processing"
                  :disabled="!isValidForm"
                  @click="processTranscription"
                  prepend-icon="mdi-transcribe"
                >
                  Start Transcription
                </v-btn>
              </div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { useAudioStore } from '@/stores/audioStore';

export default {
  name: 'TranscribeAudio',

  data() {
    return {
      selectedAudios: [],
      language: '',
      languages: [
        { title: 'English', value: 'en' },
        { title: 'Spanish', value: 'es' },
        { title: 'French', value: 'fr' },
        { title: 'German', value: 'de' },
        { title: 'Italian', value: 'it' },
      ],
      processing: false,
      error: null,
      isTranscriptionSuccess: false,
    };
  },

  computed: {
    audioStore() {
      return useAudioStore();
    },

    availableAudios() {
      return this.audioStore.getReadyAudios;
    },

    hasAudioFiles() {
      return this.availableAudios.length > 0;
    },

    isValidForm() {
      return this.selectedAudios.length > 0 && this.language;
    },
  },

  methods: {
    async processTranscription() {
      if (!this.isValidForm) return;

      this.processing = true;
      this.error = null;

      try {
        // Update status for selected audios
        this.selectedAudios.forEach(audioId => {
          this.audioStore.updateAudioStatus(audioId, 'transcribing');
        });

        // Make API call to process transcription
        await this.audioStore.transcribeAudios(
          this.selectedAudios,
          this.language
        );

        // Reset form after successful processing
        this.selectedAudios = [];
        this.language = '';
      } catch (error) {
        this.error = error.message || 'Failed to process transcription';
        // Revert status for failed transcriptions
        this.selectedAudios.forEach(audioId => {
          this.audioStore.updateAudioStatus(audioId, 'ready');
        });
      } finally {
        this.processing = false;
      }
    },
  },
};
</script>

<style scoped>
.transcribe-container {
  position: relative;
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
}

.content-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}

.form-wrapper {
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

.transcribe-button-wrapper {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background: white;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 -2px 4px rgba(0,0,0,0.05);
}

/* Custom scrollbar styles */
.form-wrapper::-webkit-scrollbar {
  width: 8px;
}

.form-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.form-wrapper::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.form-wrapper::-webkit-scrollbar-thumb:hover {
  background: #666;
}

/* Add responsive styles for mobile */
@media (max-width: 600px) {
  .transcribe-button-wrapper {
    padding: 12px;
  }

  .form-wrapper {
    padding: 16px;
    padding-bottom: 70px;
  }

  .empty-state {
    margin: 8px;
  }
}
</style>