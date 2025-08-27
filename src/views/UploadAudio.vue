<template>
  <v-container>
    <!-- Error/Success Alert -->
    <v-alert v-if="error || isFileUploaded" :type="error ? 'error' : 'success'"
      :color="error ? 'error-lighten' : 'success-lighten'" class="mb-4 alert-icon-centered" closable @click="() => {
        error = null;
        isFileUploaded = false;
      }
        ">
      <template v-slot:prepend>
        <v-icon :icon="error ? 'mdi-alert-circle' : 'mdi-check-circle'" :color="error ? 'error' : 'success'" start />
      </template>
      {{ error || "Files uploaded successfully!" }}
    </v-alert>

    <v-row>
      <v-col cols="12" class="">
        <v-card class="upload-container">
          <!-- Sticky Header -->
          <v-card-title class="d-flex align-center py-4 px-6">
            <v-icon icon="mdi-upload" :size="$vuetify.display.smAndDown ? '24' : '32'" class="me-3" color="primary" />
            <span :class="$vuetify.display.smAndDown ? 'text-subtitle-2' : 'text-h6'
              ">
              Add one or more audio Files with optional title to transcribe
            </span>
          </v-card-title>

          <v-divider></v-divider>

          <!-- Add More Button -->
          <div v-if="audioFiles?.length" class="sticky-header d-flex align-center justify-end pa-3">
            <v-btn prepend-icon="mdi-plus" class="add-more-button text-capitalize" :class="$vuetify.display.smAndDown ? 'text-caption' : 'text-button'
              " size="small" variant="outlined" color="primary" @click="addNewCard" :disabled="audioFiles.length >= 5">
              Add More Files ({{ audioFiles.length }}/5)
            </v-btn>
          </div>

          <!-- Cards Container -->
          <div class="cards-container">
            <template v-if="audioFiles.length === 0">
              <div class="empty-state pa-8 text-center">
                <v-icon size="64" color="primary" class="mb-4">mdi-upload</v-icon>
                <div class="text-h6 mb-2">No Audio Files Added</div>
                <div class="text-body-2 text-medium-emphasis mb-4">
                  Add audio files to upload and transcribe
                </div>
                <v-btn color="primary" prepend-icon="mdi-plus" @click="triggerFileInput">
                  Add Audio File
                </v-btn>
              </div>
            </template>

            <template v-else>
              <div class="cards-wrapper">
                <v-slide-y-transition group>
                  <div v-for="(file, index) in audioFiles" :key="index" class="pa-4">
                    <v-card class="bg-grey-lighten-4 audio-card" elevation="1">
                      <v-card-title class="d-flex align-center py-4 px-6">
                        <v-icon icon="mdi-file-music" :size="24" class="me-3" color="primary" />
                        <span class="text-subtitle-1">Source
                          {{ audioFiles.length > 1 ? index + 1 : "" }}</span>
                        <v-spacer />
                        <v-btn icon="mdi-delete" variant="text" density="comfortable" @click="removeFile(index)"
                          color="error" :disabled="uploading" />
                      </v-card-title>

                      <v-card-text class="pa-4">
                        <div class="input-fields-wrapper">
                          <div class="d-flex align-center mb-3">
                            <v-text-field v-model="file.title" label="Title (optional)" variant="outlined"
                              density="comfortable" :disabled="uploading" hide-details="auto" class="flex-grow-1">
                              <template #prepend-inner>
                                <v-icon>mdi-format-title</v-icon>
                              </template>
                            </v-text-field>
                          </div>

                          <div class="d-flex align-center">
                            <v-file-input v-model="file.file" :label="file.name || 'Choose File'" variant="outlined"
                              density="comfortable" accept="audio/*" :error-messages="file.fileError"
                              :disabled="uploading" @change="(e) => handleFileChange(e, index)" hide-details="auto"
                              class="flex-grow-1" prepend-icon="">
                              <template #prepend-inner>
                                <v-icon>mdi-paperclip</v-icon>
                              </template>
                            </v-file-input>
                          </div>

                          <div v-if="file.file" class="file-info d-flex align-center mt-2 ms-6">
                            <div class="text-truncate">{{ file.name }}</div>
                            <div class="text-caption text-medium-emphasis ms-2">
                              ({{ (file.size / (1024 * 1024)).toFixed(2) }} MB)
                            </div>
                          </div>

                          <!-- Update the progress indicator section in the template -->
                          <div v-if="uploading && fileProgress[file.id] && !uploadedFiles.has(file.id)" class="mt-4">
                            <div class="d-flex justify-space-between mb-1">
                              <span class="text-caption">Transcription Progress</span>
                              <span class="text-caption">{{ fileProgress[file.id].percentage }}%</span>
                            </div>
                            <v-progress-linear
                              :model-value="fileProgress[file.id].percentage"
                              color="primary"
                              height="8"
                              rounded
                            ></v-progress-linear>
                          </div>

                          <!-- Add an indicator for completed uploads -->
                          <div v-if="uploadedFiles.has(file.id)" class="mt-4">
                            <div class="d-flex align-center text-success">
                              <v-icon color="success" class="me-2">mdi-check-circle</v-icon>
                              <span class="text-caption">Upload Complete</span>
                            </div>
                          </div>

                          <!-- Show linear loader if chunks are being processed -->
                          <v-progress-linear 
                            v-if="isChunkProcessingComplete[file.id]" 
                            indeterminate 
                            color="primary"
                            class="mt-2">
                          </v-progress-linear>
                        </div>
                      </v-card-text>
                    </v-card>
                  </div>
                </v-slide-y-transition>
              </div>
            </template>

            <!-- Fixed Upload Button -->
            <div v-if="audioFiles.length" class="upload-button-wrapper">
              <v-btn color="primary" :loading="uploading" :disabled="!isValidForm" @click="uploadFiles"
                :size="$vuetify.display.smAndDown ? 'small' : 'large'" prepend-icon="mdi-upload" class="text-capitalize"
                block>
                Upload {{ audioFiles.length > 1 ? "All" : "" }}
                {{ audioFiles.length > 1 ? "Audios" : "Audio" }}
              </v-btn>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Update the display of transcriptions -->
    <div v-if="transcription.length > 0" class="transcription-container">
      <div v-for="item in transcription" :key="item.id" class="transcription-item">
        <h3>{{ item.fileName }}</h3>
        <p>{{ item.text }}</p>
      </div>
    </div>
  </v-container>
</template>

<script>
import { useAudioStore } from "@/stores/audioStore";
import { io } from "socket.io-client";
import { baseURL } from "@/api/axios";
import { storeToRefs } from "pinia";

export default {
  name: "UploadAudio",

  data() {
    return {
      audioFiles: [],
      uploading: false,
      error: null,
      isFileUploaded: false,
      socket: null,
      transcription: [],
      uploadProgress: 0,
      isChunkProcessingComplete: {},
      apiUrl: import.meta.env.VITE_APP_API_KEY,
      fileProgress: {},
      uploadedFiles: new Set(),
    };
  },

  created() {
    // this.initializeWebSocket();
  },

  mounted() {
    this.checkMobile();
    window.addEventListener("resize", this.checkMobile);
  },

  beforeUnmount() {
    window.removeEventListener("resize", this.checkMobile);
    if (this.socket) {
      this.socket.disconnect();
    }
  },

  computed: {
    /**
     * Checks if the form is valid for submission
     * @returns {boolean} True if form is valid, false otherwise
     */
    isValidForm() {
      return (
        this.audioFiles.length > 0 &&
        this.audioFiles.every((file) => file.file) &&
        !Object.values(this.isChunkProcessingComplete).some(status => status === true)
      );
    },
  },

  methods: {
    /**
     * Initializes WebSocket connection and sets up event listeners
     */
    initializeWebSocket() {
      // Connect to the WebSocket server
      // use the base url from the apiClient
      this.socket = io(baseURL);

      // Listen for transcription chunks
      this.socket.on("transcription_chunk", (chunk) => {
        console.log("Chunk ---- On ------ ", chunk);
        this.transcription.push({
          id: Date.now() + '-' + chunk,
          text: chunk,
          fileName: ""
        });
      });

      this.socket.on("connect", () => {
        console.log("Connected to WebSocket server");
      });

      this.socket.on("disconnect", () => {
        console.log("Disconnected from WebSocket server");
      });
    },

    /**
     * Checks if the current viewport is mobile width
     * Updates isMobile state based on window width
     */
    checkMobile() {
      this.isMobile = window.innerWidth < 600;
    },

    /**
     * Adds a new audio file card to the list
     * Limited to maximum of 5 files
     */
    addNewCard() {
      if (this.audioFiles.length < 5) {
        this.audioFiles.push({
          id: `file-${Math.random().toString(36).substr(2, 9)}`,
          file: null,
          name: "",
          size: 0,
          title: "",
          fileError: null,
        });
      }
    },

    /**
     * Removes an audio file from the list at specified index
     * @param {number} index - Index of file to remove
     */
    removeFile(index) {
      const fileId = this.audioFiles[index].id;
      this.uploadedFiles.delete(fileId);
      delete this.fileProgress[fileId];
      this.audioFiles.splice(index, 1);
    },

    /**
     * Handles file selection/change events
     * @param {Event|File} event - File change event or File object
     * @param {number} index - Index of file in audioFiles array
     */
    handleFileChange(event, index) {
      if (!event) {
        const fileId = this.audioFiles[index].id;
        this.uploadedFiles.delete(fileId);
        delete this.fileProgress[fileId];
        this.audioFiles[index].file = null;
        this.audioFiles[index].name = "";
        this.audioFiles[index].size = 0;
        this.audioFiles[index].fileError = null;
        return;
      }

      const file = event instanceof File ? event : event.target.files?.[0];
      if (!file) return;

      this.audioFiles[index].file = file;
      this.audioFiles[index].name = file.name;
      this.audioFiles[index].size = file.size;
      this.audioFiles[index].fileError = null;

      this.splitAudioIntoChunks(file, index);
      console.log("Done ")
    },

    /**
     * Triggers file input by adding a new card
     */
    triggerFileInput() {
      this.addNewCard();
    },

    /**
     * Splits audio file into smaller chunks for processing
     * @param {File} file - Audio file to split
     * @param {number} index - Index of file in audioFiles array
     */
    async splitAudioIntoChunks(file, index) {
      this.isChunkProcessingComplete[this.audioFiles[index].id] = true;
      const audioContext = new AudioContext();
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Calculate optimal chunk size based on audio duration
      const optimalChunkDuration = this.calculateOptimalChunkSize(audioBuffer.duration);
      const sampleRate = audioBuffer.sampleRate;
      const samplesPerChunk = optimalChunkDuration * sampleRate;

      this.audioFiles[index].chunks = [];
      this.processingStatus = "Splitting audio into chunks...";

      let startSample = 0;
      while (startSample < audioBuffer.length) {
        const endSample = Math.min(startSample + samplesPerChunk, audioBuffer.length);
        const chunkDuration = (endSample - startSample) / sampleRate;

        // Only process chunks longer than 0.5 seconds to avoid empty chunks
        if (chunkDuration > 0.5) {
          const chunkBuffer = audioContext.createBuffer(
            audioBuffer.numberOfChannels,
            endSample - startSample,
            sampleRate
          );

          for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
            const channelData = audioBuffer.getChannelData(channel).slice(startSample, endSample);
            chunkBuffer.getChannelData(channel).set(channelData);
          }

          // Convert to WAV with properly maintained audio quality
          const chunkBlob = new Blob([this.convertBufferToWav(chunkBuffer, 32)], {
            type: "audio/wav",
          });

          this.audioFiles[index].chunks.push({
            blob: chunkBlob,
            startTime: startSample / sampleRate,
            duration: chunkDuration
          });
        }
        startSample = endSample;
      }

      console.log(`Created ${this.audioFiles[index].chunks.length} chunks for processing`);
      this.processingStatus = `Created ${this.audioFiles[index].chunks.length} chunks for processing`;
      this.isChunkProcessingComplete[this.audioFiles[index].id] = false;
    },

    /**
     * Calculates optimal chunk size based on audio duration
     * @param {number} totalDuration - Total duration of audio in seconds
     * @returns {number} Optimal chunk size in seconds
     */
    calculateOptimalChunkSize(totalDuration) {
      // For files under 1 minute, use 30-second chunks
      if (totalDuration <= 60) {
        return 30;
      }
      // For files between 1-5 minutes, use 45-second chunks
      else if (totalDuration <= 300) {
        return 45;
      }
      // For longer files, use 45 -second chunks
      return 45;
    },

    /**
     * Converts AudioBuffer to WAV format
     * @param {AudioBuffer} audioBuffer - Audio buffer to convert
     * @param {number} bitDepth - Bit depth for WAV conversion (default: 32)
     * @returns {ArrayBuffer} WAV format audio data
     */
    convertBufferToWav(audioBuffer, bitDepth = 32) {
      const numOfChan = audioBuffer.numberOfChannels;
      const length = audioBuffer.length * numOfChan * (bitDepth / 8) + 44;
      const buffer = new ArrayBuffer(length);
      const view = new DataView(buffer);
      const channels = [];
      const sampleRate = audioBuffer.sampleRate;

      let offset = 0;

      // Improved WAV header writing with error checking
      const writeString = (str) => {
        for (let i = 0; i < str.length; i++) {
          view.setUint8(offset + i, str.charCodeAt(i));
        }
        offset += str.length;
      };

      // Write WAV header with higher precision
      writeString("RIFF");
      view.setUint32(offset, 36 + audioBuffer.length * numOfChan * (bitDepth / 8), true);
      offset += 4;
      writeString("WAVE");
      writeString("fmt ");
      view.setUint32(offset, 16, true);
      offset += 4;
      view.setUint16(offset, 1, true);
      offset += 2;
      view.setUint16(offset, numOfChan, true);
      offset += 2;
      view.setUint32(offset, sampleRate, true);
      offset += 4;
      view.setUint32(offset, sampleRate * numOfChan * (bitDepth / 8), true);
      offset += 4;
      view.setUint16(offset, numOfChan * (bitDepth / 8), true);
      offset += 2;
      view.setUint16(offset, bitDepth, true);
      offset += 2;
      writeString("data");
      view.setUint32(offset, audioBuffer.length * numOfChan * (bitDepth / 8), true);
      offset += 4;

      // Improved audio data writing with better precision
      for (let i = 0; i < numOfChan; i++) {
        channels.push(audioBuffer.getChannelData(i));
      }

      if (bitDepth === 32) {
        // Use 32-bit float for better quality
        for (let i = 0; i < audioBuffer.length; i++) {
          for (let j = 0; j < numOfChan; j++) {
            view.setFloat32(offset, channels[j][i], true);
            offset += 4;
          }
        }
      } else {
        // Use 16-bit PCM as fallback
        const factor = 0x7fff; // 32767
        for (let i = 0; i < audioBuffer.length; i++) {
          for (let j = 0; j < numOfChan; j++) {
            const sample = Math.max(-1, Math.min(1, channels[j][i]));
            view.setInt16(offset, sample * factor, true);
            offset += 2;
          }
        }
      }

      return buffer;
    },

    /**
     * Uploads and processes all audio files
     * Handles transcription of audio chunks in batches
     */
    async uploadFiles() {
      if (!this.isValidForm) return;

      this.uploading = true;
      this.error = null;
      
      const apiKey = this.apiUrl;

      for (const file of this.audioFiles) {
        // Skip already uploaded files
        if (this.uploadedFiles.has(file.id)) {
          continue;
        }

        // Initialize progress for this file
        this.fileProgress[file.id] = {
          processed: 0,
          total: file.chunks.length,
          percentage: 0
        };

        this.processingStatus = `Processing file: ${file.name}`;
        let fileChunks = [];

        const batchSize = 3;
        for (let i = 0; i < file.chunks.length; i += batchSize) {
          const batch = file.chunks.slice(i, i + batchSize);
          const chunkPromises = batch.map((chunk, batchIndex) =>
            this.transcribeChunk(chunk.blob, file.name, apiKey, i + batchIndex)
          );

          try {
            const results = await Promise.all(chunkPromises);
            
            // Update progress for this file
            this.fileProgress[file.id].processed += batch.length;
            this.fileProgress[file.id].percentage = Math.round(
              (this.fileProgress[file.id].processed / this.fileProgress[file.id].total) * 100
            );

            results
              .sort((a, b) => a.index - b.index)
              .forEach(res => {
                if (res.text) {
                  fileChunks.push(res.text);
                }
              });

          } catch (error) {
            console.error("Error processing batch:", error);
            this.error = `Error processing file ${file.name}: ${error.message}`;
          }

          if (i + batchSize < file.chunks.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        // After successful processing, mark the file as uploaded
        this.uploadedFiles.add(file.id);

        // After processing all chunks for this file, combine them and add to transcription array
        if (fileChunks.length > 0) {
          this.transcription.push({
            id: Date.now() + '-' + file.name,
            fileName: file.name,
            text: fileChunks.join(' '),
            title: file.title || file.name
          });
        }
      }

      this.uploading = false;
      this.isFileUploaded = true;
      this.processingStatus = "Transcription complete";
      console.log("Final Transcriptions:", this.transcription);
    },

    /**
     * Transcribes a single audio chunk using OpenAI's Whisper API
     * @param {Blob} chunk - Audio chunk to transcribe
     * @param {string} fileName - Original file name
     * @param {string} apiKey - OpenAI API key
     * @param {number} index - Chunk index
     * @returns {Promise<{text: string, index: number}>} Transcription result
     */
    async transcribeChunk(chunk, fileName, apiKey, index) {
      const formData = new FormData();
      formData.append("file", chunk, `${fileName}-chunk-${index}.wav`);
      formData.append("model", "whisper-1");

      try {
        const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return { text: data.text || "", index };
      } catch (error) {
        console.error(`Error transcribing chunk ${index}:`, error);
        throw error; // Propagate error to be handled by caller
      }
    },

    /**
     * Creates a debounced version of a function
     * @param {Function} func - Function to debounce
     * @param {number} delay - Delay in milliseconds
     * @returns {Function} Debounced function
     */
    debounce(func, delay) {
      let timeout;
      return function (...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
      };
    },
  },
};
</script>

<style scoped>
.upload-container {
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

.upload-button-wrapper {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  background: white;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.05);
}

.add-more-button {
  min-width: 140px !important;
  height: 36px !important;
}

.audio-card {
  position: relative;
  overflow: hidden;
  border-radius: 8px !important;
}

.audio-card::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 4px;
  background: rgb(var(--v-theme-primary));
  border-radius: 4px 0 0 4px;
}

.file-info {
  padding: 8px;
  background: rgba(var(--v-theme-primary), 0.05);
  border-radius: 6px;
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

/* Mobile styles */
@media (max-width: 600px) {
  .upload-button-wrapper {
    padding: 12px;
  }

  .cards-wrapper {
    padding-bottom: 70px;
  }

  .empty-state {
    margin: 8px;
  }
}

.input-fields-wrapper {
  padding: 0 8px;
}

:deep(.v-card-text) {
  padding: 16px 8px !important;
}

.transcription-container {
  margin-top: 20px;
}

.transcription-item {
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

/* Add these new styles */
.progress-wrapper {
  background: rgba(var(--v-theme-surface-variant), 0.5);
  border-radius: 4px;
  padding: 8px;
}
</style>
