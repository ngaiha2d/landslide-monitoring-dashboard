<script setup>
import { onMounted } from "vue";
import { storeToRefs } from "pinia";
import { useDeviceStore } from "../stores/deviceStore";

import Card from "primevue/card";
import Badge from "primevue/badge";
import ProgressBar from "primevue/progressbar";
import Message from "primevue/message";
import Panel from "primevue/panel";
import DataTable from "primevue/datatable";
import Column from "primevue/column";
import Tag from "primevue/tag";
import Skeleton from "primevue/skeleton";
import Chip from "primevue/chip";

import MultiSensorChart from "../components/MultiSensorChart.vue";

const store = useDeviceStore();
const {
  deviceData,
  loading,
  lastUpdate,
  historicalData,
  isMqttConnected,
  isDeviceLive,
  statusSeverity,
  statusLabel,
  activeAlertsList,
} = storeToRefs(store);

// Helper functions (UI formatting only)
const formatTime = (timestamp) => {
  if (!timestamp) return "Waiting for data...";

  const date = new Date(timestamp);
  const options = {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  };

  return date.toLocaleTimeString("en-US", options);
};

const safeValue = (val, decimals = 1) => {
  if (val === null || val === undefined || isNaN(val)) return "N/A";
  return typeof val === "number" ? val.toFixed(decimals) : val;
};

const getProgressSeverity = (value, threshold) => {
  if (value >= threshold) return "danger";
  if (value >= threshold * 0.8) return "warn";
  return "success";
};

onMounted(() => {
  store.initMQTT();

  // Handled by store, but if we need to force loading off initially:
  if (loading.value && !isMqttConnected.value) {
    setTimeout(() => {
      loading.value = false;
    }, 1000);
  }
});
</script>

<template>
  <div class="dashboard">
    <!-- Header Status -->
    <div class="status-header">
      <div class="status-info">
        <div class="flex align-items-center gap-3">
          <Tag
            :severity="isMqttConnected ? 'success' : 'danger'"
            :value="isMqttConnected ? 'Connected' : 'Disconnected'"
            :icon="isMqttConnected ? 'pi pi-wifi' : 'pi pi-wifi-off'"
          ></Tag>

          <Tag
            v-if="isMqttConnected && !isDeviceLive"
            severity="danger"
            value="Device not sending data! Check device."
            icon="pi pi-exclamation-triangle"
          ></Tag>

          <p class="last-update">
            <i class="pi pi-clock"></i>
            Last Update: {{ formatTime(lastUpdate) }}
          </p>
        </div>
      </div>
      <Tag
        :value="statusLabel"
        :severity="statusSeverity"
        icon="pi pi-info-circle"
      />
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-grid">
      <Card v-for="i in 6" :key="i">
        <template #content>
          <Skeleton height="2rem" class="mb-3" />
          <Skeleton height="4rem" class="mb-2" />
          <Skeleton height="1rem" />
        </template>
      </Card>
    </div>

    <!-- Main Dashboard -->
    <template v-else-if="deviceData">
      <!-- Active Alerts Panel -->
      <Panel
        v-if="activeAlertsList.length > 0"
        header="🚨 Active Alerts"
        class="alerts-panel mb-4"
      >
        <DataTable :value="activeAlertsList" :rows="10">
          <Column field="type" header="Alert Type">
            <template #body="slotProps">
              <i :class="['pi', slotProps.data.icon, 'mr-2']"></i>
              {{ slotProps.data.type }}
            </template>
          </Column>
          <Column field="message" header="Message" />
          <Column field="value" header="Current Value">
            <template #body="slotProps">
              <Chip :label="slotProps.data.value" />
            </template>
          </Column>
          <Column header="Status">
            <template #body="slotProps">
              <Tag
                :severity="slotProps.data.severity"
                value="ALERT"
                icon="pi pi-exclamation-triangle"
              />
            </template>
          </Column>
        </DataTable>
      </Panel>

      <Message v-else severity="success" :closable="false" class="mb-4">
        <i class="pi pi-check-circle mr-2"></i>
        No active alerts - System operating normally
      </Message>

      <!-- Line Chart -->
      <Card class="mb-4 chart-card">
        <template #title>
          <div class="flex align-items-center justify-content-between">
            <div>
              <i class="pi pi-chart-bar mr-2"></i>
              Sensor Trends Analysis
            </div>
            <Tag severity="info" value="Live Data (Last 20 readings)"></Tag>
          </div>
        </template>
        <template #content>
          <MultiSensorChart
            v-if="historicalData.length > 0"
            :historicalData="historicalData"
          />
          <Message v-else severity="info" :closable="false">
            <i class="pi pi-info-circle mr-2"></i>
            Collecting data from Firebase...
          </Message>
        </template>
      </Card>

      <!-- Sensor Cards Grid -->
      <div class="grid">
        <!-- Tilt Sensor - Pitch -->
        <Card class="sensor-card">
          <template #title>
            <i class="pi pi-angle-double-up mr-2"></i>
            Pitch Angle (BNO055)
          </template>
          <template #content>
            <div class="sensor-value">
              {{ safeValue(deviceData.current?.pitch)
              }}<span class="unit">°</span>
            </div>
            <div class="threshold-info">Threshold: ±30°</div>
            <ProgressBar
              :value="Math.abs(deviceData.current?.pitch || 0)"
              :showValue="false"
              :severity="
                getProgressSeverity(
                  Math.abs(deviceData.current?.pitch || 0),
                  30,
                )
              "
            />
            <Badge
              v-if="Math.abs(deviceData.current?.pitch) >= 30"
              value="ALERT"
              severity="danger"
              class="mt-2"
            />
          </template>
        </Card>

        <!-- Tilt Sensor - Roll -->
        <Card class="sensor-card">
          <template #title>
            <i class="pi pi-replay mr-2"></i>
            Roll Angle (BNO055)
          </template>
          <template #content>
            <div class="sensor-value">
              {{ safeValue(deviceData.current?.roll)
              }}<span class="unit">°</span>
            </div>
            <div class="threshold-info">Critical: ±45°</div>
            <ProgressBar
              :value="Math.abs(deviceData.current?.roll || 0)"
              :showValue="false"
              :severity="
                getProgressSeverity(Math.abs(deviceData.current?.roll || 0), 45)
              "
            />
            <Badge
              v-if="Math.abs(deviceData.current?.roll) >= 45"
              value="CRITICAL"
              severity="danger"
              class="mt-2"
            />
          </template>
        </Card>

        <!-- Distance Drift -->
        <Card class="sensor-card">
          <template #title>
            <i class="pi pi-arrows-h mr-2"></i>
            Distance Drift (VL53L0X)
          </template>
          <template #content>
            <div class="sensor-value">
              {{ safeValue(deviceData.current?.tof_drift_mm, 0)
              }}<span class="unit">mm</span>
            </div>
            <div class="threshold-info">Threshold: 30 mm</div>
            <ProgressBar
              :value="deviceData.current?.tof_drift_mm || 0"
              :showValue="false"
              :severity="
                getProgressSeverity(deviceData.current?.tof_drift_mm || 0, 30)
              "
            />
            <div class="mt-2 text-sm">
              Baseline:
              {{ safeValue(deviceData.current?.tof_baseline_mm, 0) }} mm
            </div>
          </template>
        </Card>

        <!-- Rainfall -->
        <Card class="sensor-card">
          <template #title>
            <i class="pi pi-cloud mr-2"></i>
            Rainfall Monitoring
          </template>
          <template #content>
            <div class="sensor-value">
              {{ safeValue(deviceData.current?.rain_1h_mm)
              }}<span class="unit">mm/h</span>
            </div>
            <div class="threshold-info">Threshold: 15 mm/h</div>
            <ProgressBar
              :value="deviceData.current?.rain_1h_mm || 0"
              :showValue="false"
              :severity="
                getProgressSeverity(deviceData.current?.rain_1h_mm || 0, 15)
              "
            />
            <div class="mt-3 flex justify-content-between">
              <div>
                <div class="text-sm text-secondary">Total</div>
                <div class="font-bold">
                  {{ safeValue(deviceData.current?.rain_total_mm) }} mm
                </div>
              </div>
              <div>
                <div class="text-sm text-secondary">Tips</div>
                <div class="font-bold">
                  {{ deviceData.current?.rain_tips || 0 }}
                </div>
              </div>
            </div>
          </template>
        </Card>

        <!-- Temperature & Humidity -->
        <Card class="sensor-card">
          <template #title>
            <i class="pi pi-sun mr-2"></i>
            Environmental (DHT11)
          </template>
          <template #content>
            <div class="env-grid">
              <div class="env-item">
                <i class="pi pi-thermometer text-3xl text-orange-500"></i>
                <div>
                  <div class="text-sm text-secondary">Temperature</div>
                  <div class="sensor-value-sm">
                    {{ safeValue(deviceData.current?.temperature)
                    }}<span class="unit">°C</span>
                  </div>
                </div>
              </div>
              <div class="env-item">
                <i class="pi pi-percentage text-3xl text-blue-500"></i>
                <div>
                  <div class="text-sm text-secondary">Humidity</div>
                  <div class="sensor-value-sm">
                    {{ safeValue(deviceData.current?.humidity, 0)
                    }}<span class="unit">%</span>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </Card>

        <!-- Soil Moisture -->
        <Card class="sensor-card">
          <template #title>
            <i class="pi pi-filter mr-2"></i>
            Soil Moisture
          </template>
          <template #content>
            <div class="sensor-value">
              {{ safeValue(deviceData.current?.soil_moisture, 0)
              }}<span class="unit">%</span>
            </div>
            <div class="threshold-info">Moisture Level</div>
            <ProgressBar
              :value="deviceData.current?.soil_moisture || 0"
              :showValue="false"
              severity="info"
            />
            <Tag
              :value="
                deviceData.current?.soil_moisture > 60
                  ? 'Wet'
                  : deviceData.current?.soil_moisture > 30
                    ? 'Moist'
                    : 'Dry'
              "
              :severity="
                deviceData.current?.soil_moisture > 60
                  ? 'info'
                  : deviceData.current?.soil_moisture > 30
                    ? 'success'
                    : 'warn'
              "
              class="mt-2"
            />
          </template>
        </Card>
      </div>
    </template>

    <!-- No Data State -->
    <Message v-else severity="warn" :closable="false">
      <i class="pi pi-exclamation-triangle mr-2"></i>
      No device data available. Check if NodeMCU is connected and sending data.
    </Message>
  </div>
</template>

<style scoped>
.dashboard {
  padding: 0;
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: var(--surface-card);
  border-radius: 8px;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.status-info h2 {
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  color: var(--text-color);
}

.last-update {
  margin: 0;
  color: var(--text-color-secondary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.chart-card {
  margin-bottom: 1.5rem;
  margin-top: 1.5rem;
}

.loading-grid,
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.5rem;
}

.sensor-card {
  height: 100%;
}

.sensor-value {
  font-size: 3rem;
  font-weight: 700;
  color: var(--primary-color);
  margin-bottom: 0.5rem;
}

.sensor-value-sm {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-color);
}

.unit {
  font-size: 1.5rem;
  color: var(--text-color-secondary);
  margin-left: 0.25rem;
}

.threshold-info {
  color: var(--text-color-secondary);
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

.env-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.env-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--surface-ground);
  border-radius: 6px;
}

.alerts-panel {
  margin-top: 1.5rem;
  animation: alertPulse 2s ease-in-out infinite;
}

@keyframes alertPulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
  }
}

@media (max-width: 768px) {
  .status-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .env-grid {
    grid-template-columns: 1fr;
  }

  .sensor-value {
    font-size: 2rem;
  }
}
</style>
