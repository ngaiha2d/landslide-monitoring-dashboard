<script setup>
import { computed } from 'vue';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'vue-chartjs';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const props = defineProps({
  historicalData: {
    type: Array,
    required: true,
    default: () => []
  }
});

// --- Chart 1: Structural Movement (Pitch, Roll, Drift) ---
const movementChartData = computed(() => {
  const labels = props.historicalData.map(d => d.time);
  
  return {
    labels,
    datasets: [
      {
        label: 'Pitch (°)',
        backgroundColor: 'rgba(239, 68, 68, 0.2)', // Red
        borderColor: '#ef4444',
        data: props.historicalData.map(d => d.pitch),
        tension: 0.4,
        fill: false
      },
      {
        label: 'Roll (°)',
        backgroundColor: 'rgba(249, 115, 22, 0.2)', // Orange
        borderColor: '#f97316',
        data: props.historicalData.map(d => d.roll),
        tension: 0.4,
        fill: false
      },
      // Visual Threshold Line for Pitch/Roll (30 degrees)
      {
        label: 'Danger Threshold',
        data: new Array(props.historicalData.length).fill(30),
        borderColor: 'rgba(255, 0, 0, 0.5)',
        borderDash: [5, 5],
        pointRadius: 0,
        borderWidth: 1,
        fill: false
      },
      {
        label: 'Neg Threshold',
        data: new Array(props.historicalData.length).fill(-30),
        borderColor: 'rgba(255, 0, 0, 0.5)',
        borderDash: [5, 5],
        pointRadius: 0,
        borderWidth: 1,
        fill: false,
        hidden: true // Hide from legend to keep clean
      }
    ]
  };
});

const movementChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    legend: { position: 'top' },
    title: { display: true, text: 'Structural Movement (Tilt)' }
  },
  scales: {
    y: {
      title: { display: true, text: 'Degrees (°)' },
      suggestedMin: -40,
      suggestedMax: 40,
      grid: { color: '#e5e7eb' }
    },
    x: { grid: { display: false } }
  }
};

// --- Chart 2: Triggers (Rain & Soil) ---
const triggerChartData = computed(() => {
  const labels = props.historicalData.map(d => d.time);

  return {
    labels,
    datasets: [
      {
        type: 'bar',
        label: 'Rain (mm)',
        backgroundColor: 'rgba(59, 130, 246, 0.6)', // Blue
        data: props.historicalData.map(d => d.rain_1h_mm),
        yAxisID: 'y'
      },
      {
        type: 'line',
        label: 'Soil Moisture (%)',
        borderColor: '#854d0e', // Brown
        backgroundColor: 'rgba(133, 77, 14, 0.2)',
        data: props.historicalData.map(d => d.soil_moisture),
        yAxisID: 'y1',
        tension: 0.4,
        fill: true
      }
    ]
  };
});

const triggerChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    legend: { position: 'top' },
    title: { display: true, text: 'Environmental Triggers' }
  },
  scales: {
    x: { grid: { display: false } },
    y: {
      type: 'linear',
      display: true,
      position: 'left',
      title: { display: true, text: 'Rain (mm)' },
      suggestedMax: 20
    },
    y1: {
      type: 'linear',
      display: true,
      position: 'right',
      title: { display: true, text: 'Moisture (%)' },
      min: 0,
      max: 100,
      grid: { drawOnChartArea: false } // Only draw grid for left axis
    }
  }
};
</script>

<template>
  <div class="charts-container">
    <div class="chart-wrapper">
      <Line :data="movementChartData" :options="movementChartOptions" />
    </div>
    
    <div class="chart-wrapper">
      <Bar :data="triggerChartData" :options="triggerChartOptions" />
    </div>
  </div>
</template>

<style scoped>
.charts-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.chart-wrapper {
  height: 300px;
  position: relative;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  padding: 10px;
}

@media (min-width: 992px) {
  .charts-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
  }
}
</style>