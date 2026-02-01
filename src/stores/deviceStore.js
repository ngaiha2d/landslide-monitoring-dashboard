import { defineStore } from "pinia";
import { ref, computed } from "vue";
import mqtt from "mqtt";
import { database, ref as dbRef, push } from "@/firebase";

export const useDeviceStore = defineStore("device", () => {
  // State
  const defaultDeviceData = {
    info: {
      name: "ESP32_LANDSLIDE_01",
      location: "Monitoring Station 1",
      sim_number: "N/A",
    },
    current: {
      pitch: 0,
      roll: 0,
      tof_drift_mm: 0,
      rain_1h_mm: 0,
      temperature: 0,
      humidity: 0,
      soil_moisture: 0,
      gps_lat: 0,
      gps_lng: 0,
      status: "normal",
      gps_valid: false,
      tof_baseline_mm: 0,
      rain_total_mm: 0,
      rain_tips: 0,
    },
    alerts: {
      active: {},
    },
  };

  const deviceData = ref(JSON.parse(JSON.stringify(defaultDeviceData)));
  const loading = ref(true);
  const lastUpdate = ref(null);
  const historicalData = ref([]);
  const isMqttConnected = ref(false);
  const isDeviceLive = ref(false);

  // Non-reactive or internal state
  const mqttClient = ref(null);
  let dataWatchdog = null;

  const MAX_HISTORY = 20;
  const DEVICE_ID = "ESP32_LANDSLIDE_01";
  const MQTT_BROKER = "ws://broker.emqx.io:8083/mqtt";
  const MQTT_TOPIC = `landslide/${DEVICE_ID}/telemetry`;

  // Getters
  const statusSeverity = computed(() => {
    if (!deviceData.value?.current?.status) return "secondary";
    const status = deviceData.value.current.status;
    return status === "critical"
      ? "danger"
      : status === "warning"
        ? "warn"
        : "success";
  });

  const statusLabel = computed(() => {
    return deviceData.value?.current?.status?.toUpperCase() || "OFFLINE";
  });

  const activeAlertsList = computed(() => {
    if (!deviceData.value?.alerts?.active) return [];

    const alerts = [];
    const active = deviceData.value.alerts.active;

    if (active.pitch_alert) {
      alerts.push({
        type: "Pitch Angle",
        severity: "danger",
        icon: "pi-angle-double-up",
        message: "Pitch angle exceeded threshold",
        value: `${safeValue(deviceData.value.current?.pitch)}°`,
      });
    }
    if (active.tof_alert) {
      alerts.push({
        type: "Distance Drift",
        severity: "danger",
        icon: "pi-arrows-h",
        message: "Distance drift exceeded threshold",
        value: `${safeValue(deviceData.value.current?.tof_drift_mm, 0)} mm`,
      });
    }
    if (active.rain_alert) {
      alerts.push({
        type: "Rainfall",
        severity: "danger",
        icon: "pi-cloud",
        message: "Rainfall exceeded threshold",
        value: `${safeValue(deviceData.value.current?.rain_1h_mm)} mm/h`,
      });
    }
    if (active.roll_alert) {
      alerts.push({
        type: "Roll Angle",
        severity: "danger",
        icon: "pi-exclamation-triangle",
        message: "CRITICAL: Roll angle ≥45° - Emergency call initiated",
        value: `${safeValue(deviceData.value.current?.roll)}°`,
      });
    }

    return alerts;
  });

  // Helper functions
  const safeValue = (val, decimals = 1) => {
    if (val === null || val === undefined || isNaN(val)) return "N/A";
    return typeof val === "number" ? val.toFixed(decimals) : val;
  };

  const updateHistoricalData = (data) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

    historicalData.value.push({
      time: timeStr,
      pitch: parseFloat(data.current.pitch || 0),
      roll: parseFloat(data.current.roll || 0),
      tof_drift_mm: parseInt(data.current.tof_drift_mm || 0),
      rain_1h_mm: parseFloat(data.current.rain_1h_mm || 0),
      rain_total_mm: parseFloat(data.current.rain_total_mm || 0),
      temperature: parseFloat(data.current.temperature || 0),
      humidity: parseInt(data.current.humidity || 0),
      soil_moisture: parseInt(data.current.soil_moisture || 0),
    });

    if (historicalData.value.length > MAX_HISTORY) {
      historicalData.value.shift();
    }
  };

  const updateStatusAndAlerts = (data) => {
    const pitch = parseFloat(data.current.pitch || 0);
    const roll = parseFloat(data.current.roll || 0);
    const tofDrift = parseInt(data.current.tof_drift_mm || 0);
    const rain = parseFloat(data.current.rain_1h_mm || 0);

    data.alerts.active.pitch_alert = Math.abs(pitch) >= 30;
    data.alerts.active.tof_alert = tofDrift >= 30;
    data.alerts.active.rain_alert = rain >= 15;
    data.alerts.active.roll_alert = Math.abs(roll) >= 45;

    if (data.alerts.active.roll_alert) {
      data.current.status = "critical";
    } else if (
      data.alerts.active.pitch_alert ||
      data.alerts.active.tof_alert ||
      data.alerts.active.rain_alert
    ) {
      data.current.status = "warning";
    } else {
      data.current.status = "normal";
    }

    return data;
  };

  const resetWatchdog = () => {
    if (dataWatchdog) clearTimeout(dataWatchdog);
    isDeviceLive.value = true;

    // Set device status to not live if no data for 5 seconds
    dataWatchdog = setTimeout(() => {
      console.warn("⚠️ No data received for 5s");
      isDeviceLive.value = false;
    }, 5000);
  };

  // Actions
  const initMQTT = () => {
    if (mqttClient.value?.connected) {
      console.log("MQTT already connected");
      return;
    }

    console.log(`Connecting to MQTT Broker: ${MQTT_BROKER}`);
    mqttClient.value = mqtt.connect(MQTT_BROKER);

    mqttClient.value.on("connect", () => {
      console.log("✅ MQTT Connected");
      isMqttConnected.value = true;

      mqttClient.value.subscribe(MQTT_TOPIC, (err) => {
        if (!err) {
          console.log(`📡 Subscribed to ${MQTT_TOPIC}`);
        } else {
          console.error("Subscription error:", err);
        }
      });
    });

    mqttClient.value.on("message", (topic, message) => {
      if (topic === MQTT_TOPIC) {
        resetWatchdog();

        try {
          const payload = JSON.parse(message.toString());
          console.log("📩 MQTT Message received:", payload);

          deviceData.value.current.pitch =
            payload.pitch !== undefined
              ? payload.pitch
              : deviceData.value.current.pitch;
          deviceData.value.current.roll =
            payload.roll !== undefined
              ? payload.roll
              : deviceData.value.current.roll;
          deviceData.value.current.tof_drift_mm =
            payload.dtof !== undefined
              ? payload.dtof
              : deviceData.value.current.tof_drift_mm;
          deviceData.value.current.rain_1h_mm =
            payload.rain1h !== undefined
              ? payload.rain1h
              : deviceData.value.current.rain_1h_mm;
          deviceData.value.current.rain_total_mm =
            payload.rain_total_mm !== undefined
              ? payload.rain_total_mm
              : deviceData.value.current.rain_total_mm;
          deviceData.value.current.temperature =
            payload.temp !== undefined
              ? payload.temp
              : deviceData.value.current.temperature;
          deviceData.value.current.humidity =
            payload.hum !== undefined
              ? payload.hum
              : deviceData.value.current.humidity;
          deviceData.value.current.soil_moisture =
            payload.soil !== undefined
              ? payload.soil
              : deviceData.value.current.soil_moisture;
          // GPS
          if (payload.lat !== undefined && payload.lng !== undefined) {
            deviceData.value.current.gps_lat = payload.lat;
            deviceData.value.current.gps_lng = payload.lng;
            deviceData.value.current.gps_valid =
              payload.lat !== 0 || payload.lng !== 0;
          }

          updateStatusAndAlerts(deviceData.value);
          updateHistoricalData(deviceData.value);

          lastUpdate.value = Date.now();
          loading.value = false;

          // Push to Firebase history
          try {
            // Updated path to match schema: devices/{id}/history/readings
            const historyRef = dbRef(
              database,
              `devices/device_001/history/readings`,
            );
            const historyPayload = {
              gps_lat: payload.lat !== undefined ? payload.lat : 0,
              gps_lng: payload.lng !== undefined ? payload.lng : 0,
              gps_valid:
                payload.lat !== undefined && payload.lng !== undefined
                  ? payload.lat !== 0 || payload.lng !== 0
                  : false,
              humidity: payload.hum !== undefined ? payload.hum : 0,
              pitch: payload.pitch !== undefined ? payload.pitch : 0,
              rain_1h_mm: payload.rain1h !== undefined ? payload.rain1h : 0,
              rain_total_mm:
                payload.rain_total_mm !== undefined ? payload.rain_total_mm : 0,
              roll: payload.roll !== undefined ? payload.roll : 0,
              soil_moisture: payload.soil !== undefined ? payload.soil : 0,
              status: deviceData.value.current.status,
              temperature: payload.temp !== undefined ? payload.temp : 0,
              timestamp: Date.now(),
              tof_drift_mm: payload.dtof !== undefined ? payload.dtof : 0,
            };

            push(historyRef, historyPayload);
            console.log("📝 Data logged to Firebase");
          } catch (fbError) {
            console.error("Firebase push error:", fbError);
          }
        } catch (e) {
          console.error("Error parsing MQTT message:", e);
        }
      }
    });

    mqttClient.value.on("error", (err) => {
      console.error("MQTT Error:", err);
      isMqttConnected.value = false;
    });

    mqttClient.value.on("offline", () => {
      console.log("MQTT Offline");
      isMqttConnected.value = false;
    });
  };

  const disconnectMQTT = () => {
    if (mqttClient.value) {
      mqttClient.value.end();
      mqttClient.value = null;
      isMqttConnected.value = false;
    }
  };

  const sendDeviceCommand = (topicSuffix, payload, options = {}) => {
    if (!mqttClient.value || !isMqttConnected.value) {
      console.warn("MQTT not connected, cannot publish");
      return false;
    }

    const topic = `landslide/${DEVICE_ID}/${topicSuffix}`;
    const message =
      typeof payload === "string" ? payload : JSON.stringify(payload);

    mqttClient.value.publish(topic, message, options, (err) => {
      if (err) {
        console.error("Publish error:", err);
      } else {
        console.log(`📤 Command sent to ${topic}:`, payload);
      }
    });
    return true;
  };

  return {
    deviceData,
    loading,
    lastUpdate,
    historicalData,
    isMqttConnected,
    isDeviceLive,
    statusSeverity,
    statusLabel,
    activeAlertsList,
    initMQTT,
    disconnectMQTT,
    sendDeviceCommand,
  };
});
