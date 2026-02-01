<script setup>
import { ref } from "vue";
import { database, get, ref as dbRef } from "@/firebase";
import Card from "primevue/card";
import Button from "primevue/button";
import Calendar from "primevue/calendar";
import Message from "primevue/message";
import DataTable from "primevue/datatable";
import Column from "primevue/column";

const allHistoryData = ref([]);
const selectedDate = ref(new Date());
const downloadLoading = ref(false);

const fetchDataByDate = async () => {
  downloadLoading.value = true;

  try {
    // Get date range
    const startDate = new Date(selectedDate.value);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(selectedDate.value);
    endDate.setHours(23, 59, 59, 999);

    const startTimestamp = startDate.getTime();
    const endTimestamp = endDate.getTime();

    // Fetch from Firebase
    const historyRef = dbRef(database, "devices/device_001/history/readings");
    const snapshot = await get(historyRef);

    if (snapshot.exists()) {
      const data = snapshot.val();
      const filteredData = [];

      for (const [key, value] of Object.entries(data)) {
        if (
          value.timestamp >= startTimestamp &&
          value.timestamp <= endTimestamp
        ) {
          filteredData.push({
            id: key,
            raw_timestamp: value.timestamp ?? "N/A",
            timestamp: value.timestamp
              ? new Date(value.timestamp).toLocaleString()
              : "N/A",
            pitch: value.pitch?.toFixed(2) ?? "N/A",
            roll: value.roll?.toFixed(2) ?? "N/A",
            tof_drift_mm: value.tof_drift_mm ?? "N/A",
            rain_1h_mm: value.rain_1h_mm?.toFixed(2) ?? "N/A",
            rain_total_mm: value.rain_total_mm?.toFixed(2) ?? "N/A",
            temperature: value.temperature?.toFixed(2) ?? "N/A",
            humidity: value.humidity ?? "N/A",
            soil_moisture: value.soil_moisture ?? "N/A",
            gps_lat: value.gps_lat?.toFixed(5) ?? "N/A",
            gps_lng: value.gps_lng?.toFixed(5) ?? "N/A",
            status: value.status,
          });
        }
      }

      // Sort by timestamp descending
      filteredData.sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
      );
      allHistoryData.value = filteredData;

      if (filteredData.length > 0) {
        console.log(
          `✅ Found ${
            filteredData.length
          } records for ${selectedDate.value.toDateString()}`,
        );
      } else {
        console.log("⚠️ No data found for this date");
        allHistoryData.value = []; // Clear previous data if none found
      }
    }
  } catch (error) {
    console.error("❌ Error fetching data:", error);
  } finally {
    downloadLoading.value = false;
  }
};

const downloadAsCSV = () => {
  if (allHistoryData.value.length === 0) {
    alert("No data to download");
    return;
  }

  const headers = [
    "Timestamp",
    "Pitch (°)",
    "Roll (°)",
    "ToF Drift (mm)",
    "Rain 1h (mm)",
    "Temperature (°C)",
    "Humidity (%)",
    "Soil Moisture (%)",
    "GPS Lat",
    "GPS Lng",
    "Status",
  ];

  const rows = allHistoryData.value.map((row) => [
    row.timestamp,
    row.pitch,
    row.roll,
    row.tof_drift_mm,
    row.rain_1h_mm,
    row.temperature,
    row.humidity,
    row.soil_moisture,
    row.gps_lat,
    row.gps_lng,
    row.status,
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `disaster_data_${selectedDate.value.toISOString().split("T")[0]}.csv`,
  );
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const downloadAsJSON = () => {
  if (allHistoryData.value.length === 0) {
    alert("No data to download");
    return;
  }

  const jsonContent = JSON.stringify(allHistoryData.value, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `disaster_data_${selectedDate.value.toISOString().split("T")[0]}.json`,
  );
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
</script>

<template>
  <div class="data-downloading-container">
    <div class="header">
      <h2>Data Visualization & Downloading</h2>
      <p>Visualize and download historical data.</p>
    </div>

    <div class="content">
      <Card class="download-card">
        <template #title>
          <i class="pi pi-download mr-2"></i>
          Download Historical Data by Date
        </template>
        <template #content>
          <div class="download-controls">
            <div class="control-group">
              <label>Select Date:</label>
              <Calendar
                v-model="selectedDate"
                :showIcon="true"
                dateFormat="dd/mm/yy"
              />
            </div>
            <div class="action-buttons">
              <Button
                label="📊 Load Data"
                @click="fetchDataByDate"
                :loading="downloadLoading"
                icon="pi pi-refresh"
                severity="info"
              />
              <Button
                v-if="allHistoryData.length > 0"
                label="📄 CSV"
                @click="downloadAsCSV"
                icon="pi pi-download"
                severity="success"
              />
              <Button
                v-if="allHistoryData.length > 0"
                label="📋 JSON"
                @click="downloadAsJSON"
                icon="pi pi-download"
                severity="help"
              />
            </div>
          </div>

          <Message
            v-if="allHistoryData.length > 0"
            style="margin-top: 1rem"
            severity="success"
            class="mt-4"
            :closable="false"
          >
            <i class="pi pi-check-circle mr-2"></i>
            {{ allHistoryData.length }} records loaded for
            {{ selectedDate.toDateString() }}
          </Message>

          <Message
            v-else-if="!downloadLoading && allHistoryData.length === 0"
            severity="info"
            class="mt-4"
            style="margin-top: 1rem"
            :closable="false"
          >
            Select a date and click "Load Data" to view history.
          </Message>
        </template>
      </Card>

      <!-- Placeholder for future visualization -->
      <div v-if="allHistoryData.length > 0" style="margin-top: 1rem; border: solid; border-width: 1px; border-color: rgba(128, 128, 128, 0.151); border-radius: 8px; padding: 4px;">
        <DataTable
          :value="allHistoryData"
          paginator
          :rows="10"
          :rowsPerPageOptions="[10, 20, 50]"
          tableStyle="min-width: 50rem"
          class="p-datatable-sm"
        >
          <Column field="timestamp" header="Timestamp" sortable></Column>
          <Column field="pitch" header="Pitch (°)" sortable></Column>
          <Column field="roll" header="Roll (°)" sortable></Column>
          <Column
            field="tof_drift_mm"
            header="ToF Drift (mm)"
            sortable
          ></Column>
          <Column field="rain_1h_mm" header="Rain 1h (mm)" sortable></Column>
          <Column
            field="rain_total_mm"
            header="Rain Total (mm)"
            sortable
          ></Column>
          <Column
            field="temperature"
            header="Temperature (°C)"
            sortable
          ></Column>
          <Column field="humidity" header="Humidity (%)" sortable></Column>
          <Column
            field="soil_moisture"
            header="Soil Moisture (%)"
            sortable
          ></Column>
          <Column field="status" header="Status" sortable>
            <template #body="slotProps">
              <span
                :class="{
                  'text-green-500': slotProps.data.status === 'NORMAL',
                  'text-yellow-500': slotProps.data.status === 'WARNING',
                  'text-red-500': slotProps.data.status === 'CRITICAL',
                }"
              >
                {{ slotProps.data.status }}
              </span>
            </template>
          </Column>
        </DataTable>
      </div>
    </div>
  </div>
</template>

<style scoped>
.data-downloading-container {
  max-width: 1000px;
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

.download-card {
  background: var(--surface-card);
}

.download-controls {
  display: flex;
  gap: 1.5rem;
  align-items: flex-end;
  flex-wrap: wrap;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.control-group label {
  font-weight: 600;
  font-size: 0.875rem;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

@media (max-width: 600px) {
  .download-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .action-buttons {
    flex-direction: column;
  }
}
</style>
