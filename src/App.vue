<script setup>
import { ref, computed } from "vue";
import Button from "primevue/button";
import Sidebar from "./components/Sidebar.vue";

const isDarkMode = ref(false);
const isSidebarCollapsed = ref(false);
const isMobileMenuOpen = ref(false);

function toggleDarkMode() {
  isDarkMode.value = !isDarkMode.value;
  document.documentElement.classList.toggle("my-app-dark");
}

function toggleSidebar() {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
}

function handleMenuToggle() {
  if (window.innerWidth >= 768) {
    toggleSidebar();
  } else {
    toggleMobileMenu();
  }
}

function toggleMobileMenu() {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
}

function closeMobileMenu() {
  isMobileMenuOpen.value = false;
}

const mainContentMargin = computed(() =>
  isSidebarCollapsed.value ? "64px" : "250px",
);
</script>

<template>
  <div class="app-container">
    <Sidebar
      :collapsed="isSidebarCollapsed"
      :mobile-open="isMobileMenuOpen"
      @toggle="toggleSidebar"
      @close-mobile="closeMobileMenu"
    />

    <div class="main-wrapper" :style="{ marginLeft: mainContentMargin }">
      <header class="top-bar">
        <div class="top-bar-left">
          <Button
            class="menu-btn"
            icon="pi pi-bars"
            text
            @click="handleMenuToggle"
            aria-label="Menu"
          />
        </div>

        <h2>Landslide Warning Real-Time Monitoring</h2>
        <div class="top-bar-right">
          <Button
            :style="
              isDarkMode
                ? 'background-color: grey'
                : 'background-color: lightgray'
            "
            :icon="isDarkMode ? 'pi pi-sun' : 'pi pi-moon'"
            @click="toggleDarkMode()"
            severity="secondary"
            text
            rounded
            aria-label="Toggle Dark Mode"
          />
        </div>
      </header>

      <main class="main-content">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-family);
  background-color: var(--surface-ground);
  color: var(--text-color);
}

.app-container {
  display: flex;
  min-height: 100vh;
}

.main-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  transition: margin-left 0.3s ease;
}

.top-bar {
  height: 64px;
  padding: 0 2rem;
  background-color: var(--surface-card);
  border-bottom: 0.5px solid rgba(128, 128, 128, 0.233);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.top-bar-left,
.top-bar-right {
  display: flex;
  align-items: center;
}

.menu-btn {
  margin-right: 1rem;
  color: var(--text-color);
}

.main-content {
  flex: 1;
  padding: 2rem;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .main-wrapper {
    margin-left: 0 !important;
  }

  .menu-btn {
    display: inline-flex !important;
  }

  .top-bar {
    padding: 0 1rem;
  }
}
</style>
