<script setup>
import { ref, onMounted } from "vue";
import { database, get, ref as dbRef, update } from "@/firebase";
import { storeToRefs } from "pinia";
import { useDeviceStore } from "../stores/deviceStore";
import Card from "primevue/card";
import Button from "primevue/button";
import InputSwitch from "primevue/inputswitch";
import InputText from "primevue/inputtext";
import Toast from "primevue/toast";
import Tag from "primevue/tag";
import { useToast } from "primevue/usetoast";

const store = useDeviceStore();
const { deviceData } = storeToRefs(store);
const toast = useToast();

const safeValue = (val, decimals = 1) => {
  if (val === null || val === undefined || isNaN(val)) return "N/A";
  return typeof val === "number" ? val.toFixed(decimals) : val;
};

// Settings State
const settings = ref({
  call_enabled: false,
  sms_enabled: false,
  phone: "",
});
const settingsLoading = ref(false);
const testCallLoading = ref(false);
const testSmsLoading = ref(false);

const saveSettings = async () => {
  settingsLoading.value = true;
  try {
    const settingsRef = dbRef(database, "devices/device_001/settings");

    // Fetch old data to compare changes
    const oldSnapshot = await get(settingsRef);
    const oldData = oldSnapshot.exists() ? oldSnapshot.val() : {};
    const oldPhone = oldData.phone || "";
    const oldCall = oldData.call_enabled || false;
    const oldSms = oldData.sms_enabled || false;

    // 1. UPDATE PHONE
    if (settings.value.phone !== oldPhone) {
      store.sendDeviceCommand(
        "cmd",
        {
          cmd: "update_phone",
          val: settings.value.phone,
        },
        { qos: 1, retain: false },
      );
    }

    // 2. TOGGLE CALL
    if (settings.value.call_enabled !== oldCall) {
      store.sendDeviceCommand(
        "cmd",
        {
          cmd: "set_call",
          val: settings.value.call_enabled,
        },
        { qos: 1, retain: false },
      );
    }

    // 3. TOGGLE SMS
    if (settings.value.sms_enabled !== oldSms) {
      store.sendDeviceCommand(
        "cmd",
        {
          cmd: "set_sms",
          val: settings.value.sms_enabled,
        },
        { qos: 1, retain: false },
      );
    }

    await update(settingsRef, {
      call_enabled: settings.value.call_enabled,
      sms_enabled: settings.value.sms_enabled,
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

const triggerTestCall = () => {
  testCallLoading.value = true;

  const success = store.sendDeviceCommand("cmd", {
    cmd: "trigger_call",
  });

  if (success) {
    toast.add({
      severity: "info",
      summary: "Sent",
      detail: "Test call command sent",
      life: 3000,
    });
  } else {
    toast.add({
      severity: "warn",
      summary: "Failed",
      detail: "MQTT not connected",
      life: 3000,
    });
  }

  setTimeout(() => {
    testCallLoading.value = false;
  }, 1000);
};

const triggerTestSMS = () => {
  testSmsLoading.value = true;

  const success = store.sendDeviceCommand("cmd", {
    cmd: "trigger_sms",
  });

  if (success) {
    toast.add({
      severity: "info",
      summary: "Sent",
      detail: "Test SMS command sent",
      life: 3000,
    });
  } else {
    toast.add({
      severity: "warn",
      summary: "Failed",
      detail: "MQTT not connected",
      life: 3000,
    });
  }

  setTimeout(() => {
    testSmsLoading.value = false;
  }, 1000);
};

const fetchSettings = async () => {
  const settingsRef = dbRef(database, "devices/device_001/settings");
  const snapshot = await get(settingsRef);
  if (snapshot.exists()) {
    const data = snapshot.val();
    settings.value = {
      call_enabled: data.call_enabled || false,
      sms_enabled: data.sms_enabled || false,
      phone: data.phone || "",
    };
  } else {
    // Set defaults if not exist
    settings.value = { call_enabled: false, sms_enabled: false, phone: "+91" };
  }
};

onMounted(() => {
  store.initMQTT(); // Ensure MQTT is connected
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
      <!-- Device Info -->
      <Card class="mb-4 sensor-card">
        <template #title>
          <i class="pi pi-info-circle mr-2"></i>
          Device Information
        </template>
        <template #content>
          <div class="info-list">
            <div class="info-item">
              <span class="info-label">Name</span>
              <span class="info-value">{{
                deviceData.info?.name || "N/A"
              }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Location</span>
              <span class="info-value">{{
                deviceData.info?.location || "N/A"
              }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">SIM Number</span>
              <span class="info-value">{{
                deviceData.info?.sim_number || "N/A"
              }}</span>
            </div>
            <div class="info-item" v-if="deviceData.current?.gps_valid">
              <span class="info-label">GPS</span>
              <span class="info-value">
                {{ safeValue(deviceData.current.gps_lat, 5) }},
                {{ safeValue(deviceData.current.gps_lng, 5) }}
              </span>
            </div>
            <div class="info-item" v-else>
              <span class="info-label">GPS</span>
              <Tag severity="warn" value="No Fix" icon="pi pi-map-marker" />
            </div>
          </div>
        </template>
      </Card>

      <Card class="settings-card">
        <template #title>
          <div class="flex align-items-center">
            <i class="pi pi-cog mr-2"></i>
            Emergency Configuration
          </div>
        </template>
        <template #content>
          <div class="flex flex-column gap-3">
            <!-- Automated Calls -->
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

            <!-- Automated SMS -->
            <div
              class="flex align-items-center justify-content-between p-3 border-round surface-100 configuration-item"
            >
              <div class="flex flex-column">
                <span class="font-bold">Enable Automated SMS</span>
                <span class="text-sm text-secondary"
                  >Device will send SMS alerts</span
                >
              </div>
              <InputSwitch v-model="settings.sms_enabled" />
            </div>

            <div class="flex flex-column gap-2 mt-2">
              <label class="font-bold">Recipient Phone Number</label>
              <div class="p-inputgroup" >
                <span class="p-inputgroup-addon" 
                  ><i class="pi pi-phone"></i
                ></span>
                <InputText v-model="settings.phone" placeholder="+91..." style="margin-right: 10px;"/>
                <Button
                  icon="pi pi-save"
                  label="Save Config"
                  @click="saveSettings"
                  :loading="settingsLoading"
                />
              </div>
            </div>

            <div class="separator my-2"></div>

            <div class="test-actions flex gap-2 p-3">
              <Button
                label="Trigger Test Call"
                icon="pi pi-mobile"
                severity="help"
                @click="triggerTestCall"
                :loading="testCallLoading"
                outlined
                class="flex-1"
                style="margin-right: 10px;"
              />
              <Button
                label="Trigger Test SMS"
                icon="pi pi-envelope"
                severity="info"
                @click="triggerTestSMS"
                :loading="testSmsLoading"
                outlined
                class="flex-1"
              />
            </div>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<style scoped>
.device-settings-container {
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
.content {
  display: flex;
  gap: 1rem;
}

.sensor-card {
  flex: 1;
}

.settings-card {
  flex: 1;
}

.separator {
  height: 1px;
  background-color: var(--surface-border);
  margin: 1rem 0;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: var(--surface-ground);
  border-radius: 6px;
}

.info-label {
  font-weight: 600;
  color: var(--text-color-secondary);
}

.info-value {
  color: var(--text-color);
  font-weight: 500;
}
</style>
