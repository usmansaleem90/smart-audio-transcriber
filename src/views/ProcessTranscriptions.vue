<template>
  <v-container class="fill-height pa-0" fluid>
    <v-row class="fill-height">
      <!-- Navigation Drawer -->
      <v-navigation-drawer v-model="drawer" :permanent="!isMobile" :temporary="isMobile" :rail="isRail && !isMobile"
        @click="handleDrawerClick" elevation="1" width="200">
        <v-list density="compact" nav>
          <v-list-item v-for="(chat, index) in chats" :key="index" :value="chat" :title="chat.title"
            @click="selectChat(chat)">
            <template v-slot:prepend>
              <v-icon>mdi-message-text</v-icon>
            </template>
          </v-list-item>
        </v-list>
      </v-navigation-drawer>

      <!-- Main Content Area -->
      <v-col class="d-flex flex-column pa-0 chat-container"
        :class="this.$vuetify.display.smAndDown ? 'mobile-chat-container' : 'desktop-chat-container'">
        <!-- Mobile Menu Button -->
        <v-app-bar v-if="isMobile" density="compact" elevation="0" class="mobile-app-bar bg-grey-lighten-4">
          <v-app-bar-nav-icon @click="drawer = !drawer" color="primary"></v-app-bar-nav-icon>
          <v-toolbar-title class="text-body-2 text-primary">
            Chat History
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-refresh" variant="text" size="small" color="primary"></v-btn>
        </v-app-bar>

        <!-- Audio Files Selection Section -->
        <div v-if="!isArticleOutlineSection" class="d-flex flex-column flex-grow-1">
          <!-- Audio Files Selection -->
          <div class="chat-messages px-6 pt-6">
            <label class="text-subtitle-1 mb-1 d-block">
              Select Audio Files <span class="text-red">*</span>
            </label>
            <v-select v-model="selectedAudios" :items="availableAudios" label="Select Audio Files" multiple chips
              closable-chips class="mb-4" variant="outlined" density="comfortable" :rules="requiredArrayRule">
              <template v-slot:chip="{ props, item }">
                <v-chip v-bind="props" :text="item.raw.title"></v-chip>
              </template>
              <template v-slot:item="{ props, item }">
                <v-list-item v-bind="props" :title="item.raw.title" :subtitle="item.raw.duration">
                  <template v-slot:prepend>
                    <v-icon>mdi-music-note</v-icon>
                  </template>
                </v-list-item>
              </template>
            </v-select>
          </div>

          <!-- Prompt Input Area -->
          <div class="prompt-area px-6 mx-1 mb-6">
            <v-row class="pa-2 bg-grey-lighten-2 rounded-lg">
              <v-col class="pa-2">
                <v-textarea v-model="userPrompt" placeholder="Enter your prompt" rows="1" auto-grow hide-details
                  class="mb-2 prompt-textarea" :loading="loading" :disabled="loading" variant="flat"
                  density="comfortable" max-rows="4" :rules="requiredRule"></v-textarea>
                <div class="d-flex align-center">
                  <v-chip-group class="mx-4">
                    <v-chip v-for="(suggestion, index) in promptSuggestions" :key="index" size="small"
                      @click="userPrompt = suggestion">
                      {{ suggestion }}
                    </v-chip>
                  </v-chip-group>
                  <v-spacer></v-spacer>
                  <v-btn color="primary" icon="mdi-send" @click="handleGenerateOutline" size="small" :loading="loading"
                    :disabled="!isFormValid"></v-btn>
                </div>
              </v-col>
            </v-row>
          </div>
        </div>

        <!-- Article Outline Section -->
        <v-card v-else class="pa-6">
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
            <draggable v-model="outline.sections" item-key="id" handle=".drag-handle" class="dragArea">
              <template #item="{ element: section, index }">
                <v-card class="section-card mb-4">
                  <v-card-item class=" custom-width">
                    <div class="d-flex align-center">
                      <v-btn icon="mdi-drag" variant="text" size="small" class="drag-handle me-2"></v-btn>
                      <v-card class="element-card flex-grow-1 me-2">
                        <v-card-item class="d-flex align-center pa-2 custom-width">
                          <div class="d-flex align-center">
                            <v-select v-model="section.level" :items="headingTypes" hide-details density="compact"
                              class="heading-type-select" variant="plain"
                              style="min-width: 120px; width: 120px;"></v-select>
                            <v-text-field v-model="section.title" hide-details density="compact" variant="underlined"
                              class="title-field" placeholder="Enter title"></v-text-field>
                          </div>
                        </v-card-item>
                      </v-card>
                      <v-btn icon="mdi-close" variant="text" size="small" color="error" class="ms-2"
                        @click="removeSection(index)"></v-btn>
                    </div>

                    <!-- Subsections -->
                    <draggable v-model="section.subsections" item-key="id" handle=".subsection-drag-handle"
                      class="dragArea mt-3">
                      <template #item="{ element: subsection, index: subIndex }">
                        <div class="subsection-item">
                          <div class="d-flex align-center">
                            <v-btn icon="mdi-drag" variant="text" size="small"
                              class="subsection-drag-handle me-2"></v-btn>
                            <v-card class="element-card flex-grow-1 me-2">
                              <v-card-item class="d-flex align-center pa-2 custom-width">
                                <div class="d-flex align-center flex-grow-1">
                                  <v-select v-model="subsection.level" :items="headingTypes" hide-details
                                    density="compact" class="heading-type-select me-4" variant="plain"></v-select>
                                  <v-text-field v-model="subsection.title" hide-details density="compact"
                                    variant="underlined" class="flex-grow-1" placeholder="Enter title"></v-text-field>
                                </div>
                              </v-card-item>
                            </v-card>
                            <v-btn icon="mdi-close" variant="text" size="small" color="error" class="ms-2"
                              @click="removeSubsection(index, subIndex)"></v-btn>
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
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import draggable from 'vuedraggable'
import { useBlogStore } from '@/stores/blogStore'

/**
 * @component ProcessTranscriptions
 * @description Handles transcription processing and AI chat interactions
 */
export default {
  name: "ProcessTranscriptions",

  components: {
    draggable
  },

  data() {
    return {
      drawer: true,
      isRail: false,
      isMobile: false,
      userPrompt: '',
      selectedAudios: [],
      chats: [
        { id: 1, title: "Chat 1" },
        { id: 2, title: "Chat 2" },
      ],
      selectedChat: null,
      promptSuggestions: [
        'Create an article outline from this audio',
        'Generate a blog post structure',
        'Extract main topics and subtopics',
        'Create a detailed outline with sections'
      ],
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
      requiredRule: [
        v => !!v || 'This field is required',
      ],
      requiredArrayRule: [
        v => (Array.isArray(v) && v.length > 0) || 'At least one audio file is required'
      ],
      availableAudios: [
        {
          id: 1,
          title: 'Interview with John Doe',
          duration: '45:23',
          date: '2024-03-15'
        },
        {
          id: 2,
          title: 'Team Meeting Recording',
          duration: '1:12:05',
          date: '2024-03-14'
        },
        {
          id: 3,
          title: 'Product Demo Session',
          duration: '28:15',
          date: '2024-03-13'
        }
      ],
      isArticleOutlineSection: false,

      outline: {
        intro: {
          title: 'Introduction',
          level: 'H1',
          content: ''
        },
        sections: [
          {
            id: 'h2_1',
            level: 'H2',
            title: 'Influential Leadership and Policies',
            content: '',
            subsections: [
              {
                id: 'h3_1',
                level: 'H3',
                title: 'George Washington: Setting Precedents',
                content: ''
              },
              {
                id: 'h3_2',
                level: 'H3',
                title: 'Abraham Lincoln: Preserving the Union',
                content: ''
              },
              {
                id: 'h3_3',
                level: 'H3',
                title: 'Franklin D. Roosevelt: New Deal and WWII',
                content: ''
              }
            ]
          },
          {
            id: 'h2_2',
            level: 'H2',
            title: 'Legacy and Impact on Society',
            content: '',
            subsections: [
              {
                id: 'h3_4',
                level: 'H3',
                title: 'Thomas Jefferson: Expansion and Enlightenment',
                content: ''
              },
              {
                id: 'h3_5',
                level: 'H3',
                title: 'Theodore Roosevelt: Progressive Reforms',
                content: ''
              }
            ]
          }
        ]
      },
    }
  },

  mounted() {
    this.checkScreenSize()
    window.addEventListener("resize", this.checkScreenSize)
  },

  beforeDestroy() {
    window.removeEventListener("resize", this.checkScreenSize)
  },

  computed: {
    // ...mapState(useBlogStore, ['outline', 'article', 'loading']),

    isFormValid() {
      return !!(this.userPrompt && this.selectedAudios?.length > 0)
    }
  },

  methods: {

    handleDrawerClick() {
      if (this.isMobile) {
        this.drawer = !this.drawer
      }
    },

    checkScreenSize() {
      this.isMobile = window.innerWidth < 960
      if (this.isMobile) {
        this.drawer = false
      }
    },

    selectChat(chat) {
      this.selectedChat = chat
      if (this.isMobile) {
        this.drawer = false
      }
    },

    async handleGenerateOutline() {
      this.isArticleOutlineSection = true
    },

    async handleGenerateArticle() {
      const formattedOutline = this.outline.sections.reduce((acc, section, index) => {
        const orderedElements = [
          {
            level: section.level,
            title: section.title
          },
          ...section.subsections
        ].map(element => `${element.level}: ${element.title}`)

        acc[`Section${index + 1}`] = {
          name: `Section ${index + 1}: ${section.title}`,
          Outline: orderedElements
        }
        return acc
      }, {})

      await this.generateArticle(formattedOutline)
    },

    goBackToInput() {
      this.isArticleOutlineSection = false
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
    }
  },
 
}
</script>

<style scoped>

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
.chat-container {
  position: relative;
}

.mobile-chat-container {
  height: calc(100vh - 130px);
}

.desktop-chat-container {
  height: calc(100vh - 110px);
}

.mobile-app-bar {
  position: fixed !important;
  left: 0;
  right: 0;
  z-index: 100;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  position: absolute;
  top: 0;
  bottom: 120px;
  left: 0;
  right: 0;
  scroll-behavior: smooth;
  padding-top: 48px;
  /* Add padding to account for mobile app bar */
}

.prompt-area {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.05);
}

.prompt-wrapper {
  min-height: 40px;
  position: relative;
}

.prompt-textarea {
  flex-grow: 1;
}

.prompt-textarea :deep(.v-field__input) {
  min-height: 24px !important;
  padding: 4px 0 !important;
}

.prompt-textarea :deep(.v-field) {
  --v-field-padding-bottom: 0 !important;
  --v-field-padding-top: 0 !important;
}

.prompt-actions {
  padding: 4px 0;
}

.chat-messages-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.message-wrapper {
  padding: 1rem;
  border-radius: 8px;
  margin: 0 48px;
}

.user-message {
  background: #E3F2FD;
  margin-left: 96px;
}

.ai-message {
  background: white;
  margin-right: 96px;
  border: 1px solid #e0e0e0;
}

.prompt-textarea :deep(.v-field__input) {
  min-height: 24px !important;
  padding: 4px 0 !important;
}

.prompt-textarea :deep(.v-field) {
  --v-field-padding-bottom: 0 !important;
  --v-field-padding-top: 0 !important;
}

/* Add responsive styles */
@media (max-width: 600px) {
  .message-wrapper {
    margin: 0 16px;
  }

  .user-message {
    margin-left: 32px;
  }

  .ai-message {
    margin-right: 32px;
  }
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