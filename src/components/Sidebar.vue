<script setup>
import { RouterLink, useRoute } from "vue-router";
import { computed } from "vue";
import Button from "primevue/button";

const props = defineProps({
  collapsed: {
    type: Boolean,
    required: true,
  },
  mobileOpen: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["toggle", "close-mobile"]);

const route = useRoute();

const navigation = [
  { name: "Dashboard", href: "/", icon: "pi pi-home" },
  {
    name: "Data Downloading",
    href: "/data-downloading",
    icon: "pi pi-download",
  },
  { name: "Device Settings", href: "/device-settings", icon: "pi pi-cog" },
];

const isActive = (path) => route.path === path;

function toggleSidebar() {
  emit("toggle");
}

function closeMobile() {
  emit("close-mobile");
}
</script>

<template>
  <div>
    <!-- Mobile Overlay -->
    <div
      class="mobile-overlay"
      :class="{ show: mobileOpen }"
      @click="closeMobile"
    ></div>

    <aside
      class="sidebar"
      :class="{ collapsed: collapsed, 'mobile-open': mobileOpen }"
    >
      <div class="logo-container">
        <i class="pi pi-shield logo-icon"></i>
        <span class="logo-text" v-show="!collapsed">Landslide Warning</span>
      </div>

      <nav class="nav-menu">
        <RouterLink
          v-for="item in navigation"
          :key="item.name"
          :to="item.href"
          class="nav-item"
          :class="{ active: isActive(item.href) }"
          :title="collapsed ? item.name : ''"
          @click="closeMobile"
        >
          <i :class="item.icon"></i>
          <span v-show="!collapsed">{{ item.name }}</span>
        </RouterLink>
      </nav>

      <div class="sidebar-footer">
        <Button
          @click="toggleSidebar"
          :icon="
            collapsed ? 'pi pi-angle-double-right' : 'pi pi-angle-double-left'
          "
          text
          rounded
          aria-label="Toggle Sidebar"
          class="toggle-btn"
        />
      </div>
    </aside>
  </div>
</template>

<style scoped>
.sidebar {
  width: 250px;
  background-color: var(--surface-card);
  border-right: 0.5px solid rgba(138, 138, 138, 0.226);
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 1000;
  transition:
    width 0.3s ease,
    transform 0.3s ease;
}

.sidebar.collapsed {
  width: 64px;
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem;
  height: 64px;
  border-bottom: 1px solid var(--surface-border);
  overflow: hidden;
  justify-content: flex-start;
}

.sidebar.collapsed .logo-container {
  justify-content: center;
  padding: 1.5rem 0;
}

.logo-icon {
  font-size: 1.5rem;
  color: var(--primary-color);
  flex-shrink: 0;
}

.logo-text {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-menu {
  flex: 1;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  overflow-x: hidden;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  color: var(--text-color);
  text-decoration: none;
  transition: all 0.2s;
  font-weight: 500;
  white-space: nowrap;
}

.sidebar.collapsed .nav-item {
  justify-content: center;
  padding: 0.75rem;
}

.nav-item i {
  font-size: 1.1rem;
  flex-shrink: 0;
}

.nav-item:hover {
  background-color: var(--surface-hover);
  color: var(--primary-color);
}

.nav-item.active {
  background-color: var(--primary-50);
  color: var(--primary-color);
  border-left: 4px solid var(--primary-color);
}

:deep(.nav-item.active) {
  background-color: rgba(var(--primary-color-rgb, 16, 185, 129), 0.1);
}

.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid var(--surface-border);
  display: flex;
  justify-content: flex-end;
}

.sidebar.collapsed .sidebar-footer {
  justify-content: center;
}

/* Mobile Styling */
.mobile-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.mobile-overlay.show {
  opacity: 1;
  pointer-events: auto;
}

@media (max-width: 768px) {
  .mobile-overlay {
    display: block;
    pointer-events: none;
  }

  .sidebar {
    transform: translateX(-100%);
    width: 250px !important; /* Always full width on mobile when open */
  }

  .sidebar.mobile-open {
    transform: translateX(0);
  }

  .sidebar.collapsed {
    width: 250px; /* Disable collapsing on mobile */
  }

  .sidebar-footer {
    display: none; /* Hide collapse button on mobile */
  }
}
</style>
