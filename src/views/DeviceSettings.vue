<script setup>
import { ref, onMounted } from "vue";
import { database, get, ref as dbRef, update } from "@/firebase";
import Card from "primevue/card";
import Button from "primevue/button";
import InputSwitch from "primevue/inputswitch";
import InputText from "primevue/inputtext";
import Toast from "primevue/toast";
import { useToast } from "primevue/usetoast";

// Settings State
const settings = ref({
  call_enabled: false,
  phone: "",
});
const settingsLoading = ref(false);
const toast = useToast();

const saveSettings = async () => {
  settingsLoading.value = true;
  try {
    const settingsRef = dbRef(database, "devices/device_001/settings");
    await update(settingsRef, {
      call_enabled: settings.value.call_enabled,
      phone: settings.value.phone,
    });

    toast.add({
      severity: "success",
      summary: "Updated",
      detail: "Settings saved to device",
      life: 3000,
    });
  } catch (e) {
    console.error(e);
    toast.add({
      severity: "error",
      summary: "Error",
      detail: "Failed to save settings",
      life: 3000,
    });
  } finally {
    settingsLoading.value = false;
  }
};

const fetchSettings = async () => {
  const settingsRef = dbRef(database, "devices/device_001/settings");
  const snapshot = await get(settingsRef);
  if (snapshot.exists()) {
    settings.value = snapshot.val();
  } else {
    // Set defaults if not exist
    settings.value = { call_enabled: false, phone: "+91" };
  }
};

onMounted(() => {
  fetchSettings();
});
</script>

<template>
  <div class="device-settings-container">
    <Toast />
    <div class="header">
      <h2>Device Settings</h2>
      <p>Configure your device settings here.</p>
    </div>

    <div class="content">
      <Card class="settings-card">
        <template #title>
          <div class="flex align-items-center">
            <i class="pi pi-cog mr-2"></i>
            Emergency Call Configuration
          </div>
        </template>
        <template #content>
          <div class="flex flex-column gap-3">
            <div
              class="flex align-items-center justify-content-between p-3 border-round surface-100 configuration-item"
            >
              <div class="flex flex-column">
                <span class="font-bold">Enable Automated Calls</span>
                <span class="text-sm text-secondary"
                  >Device will call during CRITICAL/WARNING status</span
                >
              </div>
              <InputSwitch v-model="settings.call_enabled" />
            </div>

            <div class="flex flex-column gap-2">
              <label class="font-bold">Recipient Phone Number</label>
              <div class="p-inputgroup">
                <span class="p-inputgroup-addon"
                  ><i class="pi pi-phone"></i
                ></span>
                <InputText v-model="settings.phone" placeholder="+91..." />
                <Button
                  icon="pi pi-save"
                  label="Save Config"
                  @click="saveSettings"
                  :loading="settingsLoading"
                />
              </div>
            </div>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<style scoped>
.device-settings-container {
  max-width: 800px;
  margin: 0 auto;
}

.header {
  margin-bottom: 2rem;
}

.header h2 {
  font-size: 1.8rem;
  color: var(--text-color);
  margin-bottom: 0.5rem;
}

.header p {
  color: var(--text-color-secondary);
}

.configuration-item {
  background-color: var(--surface-hover);
  border-radius: 6px;
  padding: 1rem;
}
</style>
