<template>
  <div class="d-flex blog-container">
    <!-- Mobile Menu Button -->
    <v-app-bar
      v-if="isMobile"
      density="compact"
      elevation="0" class="mobile-app-bar bg-grey-lighten-4"
    >
      <v-app-bar-nav-icon  color="primary" @click="drawer = !drawer"></v-app-bar-nav-icon>
      <v-app-bar-title class="text-body-2 text-primary">Blog Articles</v-app-bar-title>
    </v-app-bar>

    <!-- Chat History Drawer -->
    <v-navigation-drawer
      v-model="drawer"
      :permanent="!isMobile"
      :temporary="isMobile"
      width="300"
      class="chat-drawer"
    >
      <v-list>
        <!-- New Chat Button -->
        <v-list-item
          prepend-icon="mdi-plus"
          title="New Chat"
          color="primary"
          class="mb-2"
          @click="startNewChat"
        ></v-list-item>

        <v-divider class="mb-2"></v-divider>

        <!-- Chat History Items -->
        <v-list-item
          v-for="(chat, index) in chatHistory"
          :key="index"
          :active="currentChatId === chat.id"
          class="chat-history-item"
          @click="loadChat(chat)"
        >
          <v-tooltip
            :text="chat.title"
            location="right"
            :disabled="chat.title.length <= 25"
          >
            <template v-slot:activator="{ props }">
              <v-list-item-title 
                class="text-truncate"
                v-bind="props"
              >
                {{ chat.title }}
              </v-list-item-title>
            </template>
          </v-tooltip>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <!-- Main Content Area -->
    <div class="flex-grow-1 main-content">
      <v-card v-if="!outline" class="pa-6">
        <BlogTypePrompt 
          v-if="!selectedBlogType"
          @option-selected="selectedBlogType = $event"
        />
        
        <template v-else>
          <h2 class="text-h5 mb-6">Generate Blog Article</h2>

          <v-form 
            @submit.prevent="handleGenerateOutline"
            v-model="formValid"
          >
            <div v-if="visibleFields.includes('blogTitle')" class="mb-4">
              <label class="text-subtitle-1 mb-1 d-block">
                Blog Title <span class="text-red">*</span>
              </label>
              <v-text-field 
                v-model="blogTitle" 
                placeholder="How to make money Farming?"
                :rules="requiredRule"
                density="comfortable"
                variant="outlined"
                hide-details="auto"
                required
              ></v-text-field>
            </div>

            <div v-if="visibleFields.includes('transcripts')" class="mb-4">
              <label class="text-subtitle-1 mb-1 d-block">
                Attach Transcriptions <span class="text-red">*</span>
              </label>
              <v-select 
                v-model="selectedTranscripts" 
                :items="availableTranscripts" 
                multiple
                chips 
                :rules="requiredArrayRule"
                density="comfortable"
                variant="outlined"
                hide-details="auto"
                placeholder="Select transcriptions to include"
                no-data-text="No transcriptions available"
                required
              >
                <template v-slot:selection="{ item }">
                  <v-chip>{{ item.title }}</v-chip>
                </template>
              </v-select>
            </div>

            <div v-if="visibleFields.includes('length')" class="mb-4">
              <label class="text-subtitle-1 mb-1 d-block">
                Article Length <span class="text-red">*</span>
              </label>
              <v-select 
                v-model="articleLength" 
                :items="lengthOptions"
                :rules="requiredRule"
                density="comfortable"
                variant="outlined"
                hide-details="auto"
                required
              ></v-select>
            </div>

            <div v-if="visibleFields.includes('tone')" class="mb-4">
              <label class="text-subtitle-1 mb-1 d-block">
                Tone of Voice <span class="text-red">*</span>
              </label>
              <v-select 
                v-model="toneOfVoice" 
                :items="toneOptions"
                :rules="requiredRule"
                density="comfortable"
                variant="outlined"
                hide-details="auto"
                required
              ></v-select>
            </div>

            <div v-if="visibleFields.includes('pov')" class="mb-4">
              <label class="text-subtitle-1 mb-1 d-block">
                Point of View <span class="text-red">*</span>
              </label>
              <v-select 
                v-model="pointOfView" 
                :items="povOptions"
                :rules="requiredRule"
                density="comfortable"
                variant="outlined"
                hide-details="auto"
                required
              ></v-select>
            </div>

            <div v-if="visibleFields.includes('instructions')" class="mb-4">
              <label class="text-subtitle-1 mb-1 d-block">
                Instructions to AI <span class="text-red">*</span>
              </label>
              <v-textarea 
                v-model="additionalInstructions" 
                rows="3"
                density="comfortable"
                variant="outlined"
                hide-details="auto"
                :rules="selectedBlogType === 2 ? requiredRule : []"
                placeholder="Add specific instructions for the AI (e.g., 'Create a blog about farming techniques', 'Focus on beginner-friendly content')"
                :required="selectedBlogType === 2"
              ></v-textarea>
            </div>

            <v-btn 
              color="primary" 
              block 
              :loading="loading" 
              type="submit"
              :disabled="!isFormValid"
            >
              Generate Outline
            </v-btn>
          </v-form>
        </template>
      </v-card>

      <v-card v-else-if="outline && !article" class="pa-6">
        <div class="d-flex justify-space-between align-center mb-6">
          <div class="d-flex align-center">
            <v-btn icon="mdi-arrow-left" variant="text" class="me-4" @click="goBackToInput"></v-btn>
            <h2 class="text-h5">Article Outline</h2>
          </div>
          <v-btn color="primary" @click="handleGenerateArticle" :loading="loading">
            ✨ Write Article ✨
          </v-btn>
        </div>

        <div class="outline-sections mb-3">
          <!-- Wrap all sections in draggable component -->
          <draggable 
            v-model="outline.sections" 
            item-key="id"
            handle=".drag-handle"
            class="dragArea"
          >
            <template #item="{element: section, index}">
              <v-card class="section-card mb-4">
                <v-card-item>
                  <div class="d-flex align-center">
                    <v-btn 
                      icon="mdi-drag" 
                      variant="text" 
                      size="small" 
                      class="drag-handle me-2"
                    ></v-btn>
                    <v-card class="element-card flex-grow-1 me-2">
                      <v-card-item class="d-flex align-center pa-2 custom-width">
                        <div class="d-flex align-center">
                          <v-select 
                            v-model="section.level" 
                            :items="headingTypes" 
                            hide-details 
                            density="compact"
                            class="heading-type-select" 
                            variant="plain"
                            style="min-width: 120px; width: 120px;"
                          ></v-select>
                          <v-text-field 
                            v-model="section.title" 
                            hide-details 
                            density="compact" 
                            variant="underlined"
                            class="title-field"
                            placeholder="Enter title"
                          ></v-text-field>
                        </div>
                      </v-card-item>
                    </v-card>
                    <v-btn 
                      icon="mdi-close" 
                      variant="text" 
                      size="small" 
                      color="error" 
                      class="ms-2"
                      @click="removeSection(index)"
                    ></v-btn>
                  </div>

                  <!-- Subsections -->
                  <draggable 
                    v-model="section.subsections" 
                    item-key="id"
                    handle=".subsection-drag-handle"
                    class="dragArea mt-3"
                  >
                    <template #item="{element: subsection, index: subIndex}">
                      <div class="subsection-item">
                        <div class="d-flex align-center">
                          <v-btn 
                            icon="mdi-drag" 
                            variant="text" 
                            size="small" 
                            class="subsection-drag-handle me-2"
                          ></v-btn>
                          <v-card class="element-card flex-grow-1 me-2">
                            <v-card-item class="d-flex align-center pa-2 custom-width">
                              <div class="d-flex align-center flex-grow-1">
                                <v-select 
                                  v-model="subsection.level" 
                                  :items="headingTypes" 
                                  hide-details 
                                  density="compact"
                                  class="heading-type-select me-4" 
                                  variant="plain"
                                ></v-select>
                                <v-text-field 
                                  v-model="subsection.title" 
                                  hide-details 
                                  density="compact" 
                                  variant="underlined"
                                  class="flex-grow-1"
                                  placeholder="Enter title"
                                ></v-text-field>
                              </div>
                            </v-card-item>
                          </v-card>
                          <v-btn 
                            icon="mdi-close" 
                            variant="text" 
                            size="small" 
                            color="error" 
                            class="ms-2"
                            @click="removeSubsection(index, subIndex)"
                          ></v-btn>
                        </div>
                      </div>
                    </template>
                  </draggable>

                  <!-- Add Subsection Menu -->
                  <v-menu location="bottom">
                    <template v-slot:activator="{ props }">
                      <v-btn variant="text" size="small" color="primary" class="ms-8 mt-2" prepend-icon="mdi-plus"
                        v-bind="props">
                        Add Element
                      </v-btn>
                    </template>
                    <v-list>
                      <v-list-item v-for="type in elementTypes" :key="type.value" :title="type.title"
                        @click="addSubsection(index, type.value)"></v-list-item>
                    </v-list>
                  </v-menu>
                </v-card-item>
              </v-card>
            </template>
          </draggable>
        </div>

        <!-- Add Section Menu -->
        <v-menu location="bottom">
          <template v-slot:activator="{ props }">
            <v-btn color="success" block prepend-icon="mdi-plus" v-bind="props">
              Add Section
            </v-btn>
          </template>
          <v-list>
            <v-list-item v-for="type in elementTypes" :key="type.value" :title="type.title"
              @click="addSection(type.value)"></v-list-item>
          </v-list>
        </v-menu>
      </v-card>
    </div>
    
  </div>
</template>

<script>
import { useBlogStore } from '@/stores/blogStore'
import { mapState, mapActions } from 'pinia'
import draggable from 'vuedraggable'
import BlogTypePrompt from '@/components/BlogTypePrompt.vue'

export default {
  name: 'BlogArticles',

  components: {
    draggable,
    BlogTypePrompt
  },

  data() {
    return {
      blogTitle: '',
      selectedTranscripts: [],
      articleLength: 'Medium',
      toneOfVoice: 'Professional',
      pointOfView: 'Second Person',
      additionalInstructions: '',
      chatHistory: [],
      headingTypes: [
        { title: 'Heading 1', value: 'H1' },
        { title: 'Heading 2', value: 'H2' },
        { title: 'Heading 3', value: 'H3' },
        { title: 'Heading 4', value: 'H4' },
        { title: 'Paragraph', value: 'P' }
      ],
      elementTypes: [
        { title: 'Heading 2', value: 'H2' },
        { title: 'Heading 3', value: 'H3' },
        { title: 'Heading 4', value: 'H4' },
        { title: 'Paragraph', value: 'P' }
      ],
      currentChatId: null,
      defaultChatTitle: 'New Chat',
      requiredRule: [
        v => !!v || 'This field is required',
      ],
      requiredArrayRule: [
        v => (Array.isArray(v) && v.length > 0) || 'At least one selection is required'
      ],
      lengthOptions: ['Short', 'Medium', 'Long'],
      toneOptions: ['Professional', 'Casual', 'Academic'],
      povOptions: ['First Person', 'Second Person', 'Third Person'],
      formValid: false,
      drawer: true,
      selectedBlogType: null,
    }
  },

  computed: {
    ...mapState(useBlogStore, ['outline', 'article', 'loading']),

    availableTranscripts() {
      // This would come from your audio store
      return [
        { title: 'Transcript 1', value: 1 },
        { title: 'Transcript 2', value: 2 }
      ]
    },

    isFormValid() {
      if (!this.selectedBlogType) return false
      
      const hasTitle = !!this.blogTitle
      
      if (this.selectedBlogType === 1) {
        return hasTitle && this.selectedTranscripts.length > 0
      } else if (this.selectedBlogType === 2) {
        return hasTitle && !!this.additionalInstructions
      } else if (this.selectedBlogType === 3) {
        return hasTitle && 
               this.selectedTranscripts.length > 0 && 
               this.articleLength && 
               this.toneOfVoice && 
               this.pointOfView
      }
      
      return false
    },

    isMobile() {
      return this.$vuetify.display.mobile
    },

    visibleFields() {
      if (!this.selectedBlogType) return []
      
      const fields = ['blogTitle']
      
      if (this.selectedBlogType === 1) {
        fields.push('transcripts')
      } else if (this.selectedBlogType === 2) {
        fields.push('instructions')
      } else if (this.selectedBlogType === 3) {
        fields.push('transcripts', 'length', 'tone', 'pov', 'instructions')
      }
      
      return fields
    }
  },

  watch: {
    isMobile: {
      immediate: true,
      handler(mobile) {
        this.drawer = !mobile
      }
    }
  },

  methods: {
    ...mapActions(useBlogStore, ['generateOutline', 'generateArticle']),

    startNewChat() {
      const blogStore = useBlogStore()
      const newChat = {
        id: Date.now(),
        title: this.defaultChatTitle,
        outline: null,
        article: null,
        settings: {
          blogTitle: '',
          selectedTranscripts: [],
          articleLength: 'Medium',
          toneOfVoice: 'Professional',
          pointOfView: 'Second Person',
          additionalInstructions: ''
        }
      }
      
      this.chatHistory.unshift(newChat)
      this.loadChat(newChat)
      // Reset the store state and form validation
      blogStore.$patch({
        outline: null,
        article: null
      })
      this.formValid = false
      this.selectedBlogType = null
    },

    loadChat(chat) {
      const blogStore = useBlogStore()
      this.currentChatId = chat.id
      
      // Reset form fields
      this.blogTitle = chat.settings.blogTitle || ''
      this.selectedTranscripts = chat.settings.selectedTranscripts || []
      this.articleLength = chat.settings.articleLength || 'Medium'
      this.toneOfVoice = chat.settings.toneOfVoice || 'Professional'
      this.pointOfView = chat.settings.pointOfView || 'Second Person'
      this.additionalInstructions = chat.settings.additionalInstructions || ''
      
      // Load outline and article if they exist
      blogStore.$patch({
        outline: chat.outline,
        article: chat.article
      })
    },

    async handleGenerateOutline() {
      try {
        // Save current chat state first
        const currentChat = this.chatHistory.find(chat => chat.id === this.currentChatId)
        if (currentChat) {
          currentChat.title = this.blogTitle || this.defaultChatTitle
          currentChat.settings = {
            blogTitle: this.blogTitle,
            selectedTranscripts: this.selectedTranscripts,
            articleLength: this.articleLength,
            toneOfVoice: this.toneOfVoice,
            pointOfView: this.pointOfView,
            additionalInstructions: this.additionalInstructions
          }
        }

        // Construct the prompt based on blog type and inputs
        let prompt = `Create a detailed outline for a blog article titled "${this.blogTitle}". `
        
        if (this.selectedBlogType === 1) {
          prompt += `Use the following transcripts as source material: ${this.selectedTranscripts.map(t => t.title).join(', ')}. `
        } else if (this.selectedBlogType === 2) {
          prompt += `Following these instructions: ${this.additionalInstructions}. `
        } else if (this.selectedBlogType === 3) {
          prompt += `
            Use these transcripts: ${this.selectedTranscripts.map(t => t.title).join(', ')}.
            Article length should be ${this.articleLength}.
            Tone should be ${this.toneOfVoice}.
            Write in ${this.pointOfView} point of view.
            Additional instructions: ${this.additionalInstructions}
          `
        }

        prompt += `
          Format the outline with main sections (H2) and subsections (H3).
          Return the response as a JSON object with this structure:
          {
            "sections": [
              {
                "id": "unique_id",
                "level": "H2",
                "title": "Section Title",
                "subsections": [
                  {
                    "id": "unique_id",
                    "level": "H3",
                    "title": "Subsection Title"
                  }
                ]
              }
            ]
          }
        `

        // Call the OpenAI API through your store action
        await this.generateOutline({
          prompt,
          title: this.blogTitle,
          transcripts: this.selectedTranscripts,
          length: this.articleLength,
          tone: this.toneOfVoice,
          pov: this.pointOfView,
          instructions: this.additionalInstructions
        })

        // Save generated outline to current chat
        if (currentChat) {
          currentChat.outline = this.outline
        }
      } catch (error) {
        console.error('Error generating outline:', error)
        // Handle error appropriately (show error message to user)
      }
    },

    async handleGenerateArticle() {
      // Format the outline data
      const formattedOutline = this.outline.sections.reduce((acc, section, index) => {
        // Create array of all elements in order (section title + subsections)
        const orderedElements = [
          {
            level: section.level,
            title: section.title
          },
          ...section.subsections
        ].map(element => `${element.level}: ${element.title}`);

        acc[`Section${index + 1}`] = {
          name: `Section ${index + 1}: ${section.title}`,
          Outline: orderedElements
        };
        console.log("write article output::::", acc)
        return acc;
      }, {});

      // Call generateArticle with formatted outline
      await this.generateArticle(formattedOutline);
      
      // Save generated article to current chat
      const currentChat = this.chatHistory.find(chat => chat.id === this.currentChatId);
      if (currentChat) {
        currentChat.article = this.article;
      }

      // Navigate to blog-articles route
      this.$router.push('/dashboard/articles');
    },

    goBackToInput() {
      const blogStore = useBlogStore()
      // Update the store state
      blogStore.$patch({
        outline: null,
        article: null
      })
      
      // Update the current chat's outline
      const currentChat = this.chatHistory.find(chat => chat.id === this.currentChatId)
      if (currentChat) {
        currentChat.outline = null
        currentChat.article = null
      }
    },

    addSection(type = 'H2') {
      const newId = `section_${Date.now()}`
      this.outline.sections.push({
        id: newId,
        level: type,
        title: `New ${type}`,
        content: '',
        subsections: []
      })
    },

    removeSection(index) {
      this.outline.sections.splice(index, 1)
    },

    addSubsection(sectionIndex, type = 'H3') {
      const newId = `subsection_${Date.now()}`
      this.outline.sections[sectionIndex].subsections.push({
        id: newId,
        level: type,
        title: `New ${type}`,
        content: ''
      })
    },

    removeSubsection(sectionIndex, subsectionIndex) {
      this.outline.sections[sectionIndex].subsections.splice(subsectionIndex, 1)
    },

    copyArticle() {
      navigator.clipboard.writeText(this.article)
    },

    downloadArticle() {
      const blob = new Blob([this.article], { type: 'text/html' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'article.html'
      a.click()
      window.URL.revokeObjectURL(url)
    }
  },

  created() {
    // Start with a new chat when component is created
    this.startNewChat()
  }
}
</script>

<style scoped>
.blog-container {
  height: calc(100vh - var(--v-layout-top));
}

.chat-drawer {
  border-right: 1px solid rgba(0, 0, 0, 0.12);
}

.main-content {
  padding: 16px;
  overflow-y: auto;
  height: 100%;
}

.article-content {
  font-family: 'Georgia', serif;
  line-height: 1.6;
}

.section-item {
  margin-bottom: 24px;
}

.subsection-item {
  margin-left: 32px;
  margin-top: 12px;
}

.section-label {
  background: #e0e0e0;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  min-width: 40px;
  text-align: center;
}

.outline-sections {
  max-width: 800px;
  margin: 0 auto;
  max-height: calc(100vh - 300px) !important;
  overflow-y: auto !important;
}

.section-card {
  border: 1px solid rgba(0, 0, 0, 0.12);
  background-color: rgb(250, 250, 250);
  transition: all 0.3s ease;
}

.section-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.heading-type-select {
  flex: 0 0 120px;
  margin-right: 16px;
}

.title-field {
  flex: 1;
  min-width: 0;
}

:deep(.title-field .v-field__input) {
  width: 100%;
}

.outline-sections {
  max-width: 800px;
  margin: 0 auto;
}

.section-card {
  transition: transform 0.2s ease;
}

.section-card:hover {
  transform: translateY(-2px);
}

.ghost {
  opacity: 0.5;
  background: #c8ebfb;
}

.chosen {
  opacity: 0.5;
  background: #c8ebfb;
}

.chat-history-item {
  margin-bottom: 4px;
}

.chat-history-item :deep(.v-list-item-title) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.v-navigation-drawer :deep(.v-list-item--active) {
  background-color: rgb(var(--v-theme-primary-lighten-1));
}

.text-red {
  color: rgb(var(--v-theme-error));
}

.element-card {
  background-color: white;
  border: 1px solid rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
  width: 100%;
}

.element-card:hover {
  border-color: rgba(0, 0, 0, 0.15);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.section-card {
  background-color: rgb(250, 250, 250);
  border: 1px solid rgba(0, 0, 0, 0.12);
  transition: all 0.3s ease;
}

.section-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

:deep(.v-card-item) {
  padding: 8px 12px;
}

:deep(.element-card .v-field__input) {
  padding-top: 8px;
  padding-bottom: 8px;
  width: 100%;
}

.drag-handle,
.subsection-drag-handle {
  cursor: move;
}

.dragArea {
  min-height: 10px;
}

.section-card {
  transition: transform 0.2s ease;
}

.section-card:hover {
  transform: translateY(-2px);
}

.ghost {
  opacity: 0.5;
  background: #c8ebfb;
}

.chosen {
  opacity: 0.5;
  background: #c8ebfb;
}

.chat-history-item {
  margin-bottom: 4px;
}

.chat-history-item :deep(.v-list-item-title) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.v-navigation-drawer :deep(.v-list-item--active) {
  background-color: rgb(var(--v-theme-primary-lighten-1));
}

.text-red {
  color: rgb(var(--v-theme-error));
}

.element-card {
  background-color: white;
  border: 1px solid rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
  width: 100%;
}

.element-card:hover {
  border-color: rgba(0, 0, 0, 0.15);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.section-card {
  background-color: rgb(250, 250, 250);
  border: 1px solid rgba(0, 0, 0, 0.12);
  transition: all 0.3s ease;
}

.section-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

:deep(.v-card-item) {
  padding: 8px 12px;
}

:deep(.element-card .v-field__input) {
  padding-top: 8px;
  padding-bottom: 8px;
  width: 100%;
}

:deep(.v-field__input) {
  white-space: normal !important;
  word-wrap: break-word !important;
}

:deep(.v-text-field input) {
  white-space: normal !important;
  word-wrap: break-word !important;
}
</style>

<style>
.custom-width .v-card-item__content{
  width: 100% !important;
}

@media (max-width: 600px) {
  .blog-container {
    height: calc(100vh - var(--v-layout-top) - 48px); /* Adjust for app bar */
  }
}
</style>