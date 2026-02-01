<script setup>
import { ref, onMounted } from 'vue'
import { database, set, get, onValue, ref as dbRef, update } from '@/firebase'
import Button from 'primevue/button'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import ProgressBar from 'primevue/progressbar'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'

// Test states
const testStatus = ref('')
const messages = ref([])
const loading = ref(false)
const firebaseConnected = ref(false)

// Test data
const testDeviceId = ref('device_001')
const testSensorData = ref({
  pitch: 5.2,
  roll: 2.1,
  tof_drift_mm: 12,
  rain_1h_mm: 8.5,
  temperature: 24.5,
  humidity: 78,
  soil_moisture: 65
})

const realtimeData = ref(null)
const dataHistory = ref([])

// Helper to add messages
const addMessage = (type, text) => {
  messages.value.unshift({
    id: Date.now(),
    type, // 'success', 'error', 'info'
    text,
    timestamp: new Date().toLocaleTimeString()
  })
  if (messages.value.length > 10) messages.value.pop()
}

// Test 1: Connection Test
const testConnection = async () => {
  loading.value = true
  testStatus.value = 'Testing Firebase connection...'
  
  try {
    const testRef = dbRef(database, 'connection_test')
    await set(testRef, {
      connected: true,
      timestamp: Date.now(),
      message: 'Connection test successful'
    })
    
    firebaseConnected.value = true
    addMessage('success', '✅ Firebase connection successful!')
    testStatus.value = 'Connected'
  } catch (error) {
    addMessage('error', `❌ Connection failed: ${error.message}`)
    testStatus.value = 'Failed'
  } finally {
    loading.value = false
  }
}

// Test 2: Write Test Data
const writeTestData = async () => {
  loading.value = true
  testStatus.value = 'Writing test data...'
  
  try {
    const devicePath = `devices/${testDeviceId.value}`
    
    const data = {
      info: {
        name: 'Firebase Test Device',
        location: 'Test Location',
        device_id: testDeviceId.value,
        created_at: Date.now()
      },
      current: {
        ...testSensorData.value,
        timestamp: Date.now(),
        status: 'normal'
      },
      alerts: {
        active: {
          pitch_alert: false,
          tof_alert: false,
          rain_alert: false,
          roll_alert: false
        }
      }
    }
    
    await set(dbRef(database, devicePath), data)
    
    addMessage('success', `✅ Test data written to: devices/${testDeviceId.value}`)
    testStatus.value = 'Data written successfully'
  } catch (error) {
    addMessage('error', `❌ Write failed: ${error.message}`)
    testStatus.value = 'Write failed'
  } finally {
    loading.value = false
  }
}

// Test 3: Read Test Data
const readTestData = async () => {
  loading.value = true
  testStatus.value = 'Reading test data...'
  
  try {
    const devicePath = `devices/${testDeviceId.value}`
    const snapshot = await get(dbRef(database, devicePath))
    
    if (snapshot.exists()) {
      const data = snapshot.val()
      addMessage('success', `✅ Data read successfully: ${JSON.stringify(data.current)}`)
      testStatus.value = 'Data read successfully'
    } else {
      addMessage('error', '❌ No data found at this path')
      testStatus.value = 'No data found'
    }
  } catch (error) {
    addMessage('error', `❌ Read failed: ${error.message}`)
    testStatus.value = 'Read failed'
  } finally {
    loading.value = false
  }
}

// Test 4: Update Test Data
const updateTestData = async () => {
  loading.value = true
  testStatus.value = 'Updating test data...'
  
  try {
    const devicePath = `devices/${testDeviceId.value}/current`
    
    const updates = {
      pitch: (Math.random() * 50 - 25).toFixed(1),
      roll: (Math.random() * 60 - 30).toFixed(1),
      temperature: (Math.random() * 15 + 15).toFixed(1),
      timestamp: Date.now()
    }
    
    await update(dbRef(database, devicePath), updates)
    
    addMessage('success', `✅ Data updated: ${JSON.stringify(updates)}`)
    testStatus.value = 'Data updated successfully'
  } catch (error) {
    addMessage('error', `❌ Update failed: ${error.message}`)
    testStatus.value = 'Update failed'
  } finally {
    loading.value = false
  }
}

// Test 5: Real-Time Listener
const startRealtimeListener = () => {
  testStatus.value = 'Starting real-time listener...'
  
  try {
    const devicePath = `devices/${testDeviceId.value}/current`
    
    const unsubscribe = onValue(
      dbRef(database, devicePath),
      (snapshot) => {
        if (snapshot.exists()) {
          realtimeData.value = snapshot.val()
          addMessage('info', '🔄 Real-time data received')
          
          // Add to history
          dataHistory.value.unshift({
            id: Date.now(),
            timestamp: new Date().toLocaleTimeString(),
            pitch: realtimeData.value.pitch,
            roll: realtimeData.value.roll,
            temperature: realtimeData.value.temperature,
            status: 'success'
          })
          
          if (dataHistory.value.length > 5) {
            dataHistory.value.pop()
          }
        }
      },
      (error) => {
        addMessage('error', `❌ Real-time listener error: ${error.message}`)
      }
    )
    
    addMessage('success', '✅ Real-time listener started')
    testStatus.value = 'Listening for real-time updates'
    
    // Store unsubscribe function for cleanup
    window.firebaseUnsubscribe = unsubscribe
  } catch (error) {
    addMessage('error', `❌ Listener setup failed: ${error.message}`)
    testStatus.value = 'Listener setup failed'
  }
}

// Stop real-time listener
const stopRealtimeListener = () => {
  if (window.firebaseUnsubscribe) {
    window.firebaseUnsubscribe()
    addMessage('info', '⏸️ Real-time listener stopped')
    testStatus.value = 'Listener stopped'
  }
}

onMounted(() => {
  addMessage('info', 'Firebase test page loaded. Click buttons to start testing.')
})
</script>

<template>
  <div class="firebase-test">
    <!-- Header -->
    <div class="test-header">
      <h1>🔥 Firebase Realtime Database Test</h1>
      <Tag 
        :value="firebaseConnected ? 'Connected' : 'Not Connected'"
        :severity="firebaseConnected ? 'success' : 'danger'"
        icon="pi pi-check-circle"
      />
    </div>

    <!-- Status Display -->
    <Card class="mb-4 status-card">
      <template #title>
        <i class="pi pi-info-circle mr-2"></i>
        Status
      </template>
      <template #content>
        <p class="status-text">{{ testStatus }}</p>
        <ProgressBar v-if="loading" :value="100" mode="indeterminate" />
      </template>
    </Card>

    <!-- Test Buttons -->
    <Card class="mb-4 controls-card">
      <template #title>
        <i class="pi pi-cog mr-2"></i>
        Test Controls
      </template>
      <template #content>
        <div class="button-group">
          <Button 
            label="1️⃣ Test Connection" 
            @click="testConnection"
            :loading="loading"
            icon="pi pi-send"
            severity="primary"
          />
          <Button 
            label="2️⃣ Write Test Data" 
            @click="writeTestData"
            :loading="loading"
            icon="pi pi-upload"
            severity="info"
          />
          <Button 
            label="3️⃣ Read Test Data" 
            @click="readTestData"
            :loading="loading"
            icon="pi pi-download"
            severity="warning"
          />
          <Button 
            label="4️⃣ Update Data" 
            @click="updateTestData"
            :loading="loading"
            icon="pi pi-refresh"
            severity="success"
          />
          <Button 
            label="5️⃣ Start Real-Time Listener" 
            @click="startRealtimeListener"
            icon="pi pi-play"
            severity="help"
          />
          <Button 
            label="⏸️ Stop Listener" 
            @click="stopRealtimeListener"
            icon="pi pi-pause"
            severity="secondary"
          />
        </div>
      </template>
    </Card>

    <!-- Device Configuration -->
    <Card class="mb-4 config-card">
      <template #title>
        <i class="pi pi-mobile mr-2"></i>
        Device Configuration
      </template>
      <template #content>
        <div class="config-item">
          <label>Device ID:</label>
          <InputText v-model="testDeviceId" placeholder="e.g., device_001" />
        </div>
      </template>
    </Card>

    <!-- Real-Time Data Display -->
    <Card v-if="realtimeData" class="mb-4 realtime-card">
      <template #title>
        <i class="pi pi-pulse mr-2"></i>
        Real-Time Data
      </template>
      <template #content>
        <div class="data-grid">
          <div class="data-item">
            <span class="label">Pitch:</span>
            <span class="value">{{ realtimeData.pitch }}°</span>
          </div>
          <div class="data-item">
            <span class="label">Roll:</span>
            <span class="value">{{ realtimeData.roll }}°</span>
          </div>
          <div class="data-item">
            <span class="label">Temperature:</span>
            <span class="value">{{ realtimeData.temperature }}°C</span>
          </div>
          <div class="data-item">
            <span class="label">Humidity:</span>
            <span class="value">{{ realtimeData.humidity }}%</span>
          </div>
          <div class="data-item">
            <span class="label">Last Update:</span>
            <span class="value">{{ new Date(realtimeData.timestamp).toLocaleTimeString() }}</span>
          </div>
        </div>
      </template>
    </Card>

    <!-- Data History Table -->
    <Card v-if="dataHistory.length > 0" class="mb-4 history-card">
      <template #title>
        <i class="pi pi-list mr-2"></i>
        Data History (Last 5 Updates)
      </template>
      <template #content>
        <DataTable :value="dataHistory" :rows="5">
          <Column field="timestamp" header="Timestamp" />
          <Column field="pitch" header="Pitch (°)" />
          <Column field="roll" header="Roll (°)" />
          <Column field="temperature" header="Temp (°C)" />
          <Column field="status" header="Status">
            <template #body="slotProps">
              <Tag :value="slotProps.data.status" severity="success" />
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>

    <!-- Messages Log -->
    <Card class="messages-card">
      <template #title>
        <i class="pi pi-list mr-2"></i>
        Operation Log
      </template>
      <template #content>
        <div class="messages-list">
          <Message 
            v-for="msg in messages" 
            :key="msg.id"
            :severity="msg.type"
            :closable="false"
            class="message-item"
          >
            <div class="message-content">
              <strong>{{ msg.timestamp }}</strong>
              <p>{{ msg.text }}</p>
            </div>
          </Message>
          <div v-if="messages.length === 0" class="no-messages">
            No messages yet. Start by clicking a test button.
          </div>
        </div>
      </template>
    </Card>
  </div>
</template>

<style scoped>
.firebase-test {
  padding: 0;
}

.test-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: var(--surface-card);
  border-radius: 8px;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.test-header h1 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--text-color);
}

.status-card,
.controls-card,
.config-card,
.realtime-card,
.history-card,
.messages-card {
  margin-bottom: 1.5rem;
}

.status-text {
  font-size: 1rem;
  font-weight: 600;
  color: var(--primary-color);
  margin-bottom: 1rem;
}

.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.button-group button {
  min-width: 150px;
}

.config-item {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.config-item label {
  font-weight: 600;
  min-width: 100px;
}

.config-item input {
  flex: 1;
}

.data-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.data-item {
  display: flex;
  flex-direction: column;
  padding: 1rem;
  background: var(--surface-ground);
  border-radius: 6px;
  border-left: 4px solid var(--primary-color);
}

.data-item .label {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  text-transform: uppercase;
  font-weight: 600;
}

.data-item .value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary-color);
  margin-top: 0.5rem;
}

.messages-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 400px;
  overflow-y: auto;
}

.message-item {
  margin-bottom: 0;
}

.message-content {
  font-size: 0.875rem;
}

.message-content strong {
  color: var(--primary-color);
}

.message-content p {
  margin: 0.5rem 0 0 0;
  word-break: break-word;
}

.no-messages {
  text-align: center;
  padding: 2rem;
  color: var(--text-color-secondary);
}

@media (max-width: 768px) {
  .test-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .button-group {
    flex-direction: column;
  }
  
  .button-group button {
    width: 100%;
  }
  
  .config-item {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
