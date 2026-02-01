import { createWebHistory, createRouter } from "vue-router";

import Index from "../Index.vue";
import FirebaseTestView from "../views/FirebaseTestView.vue";
import Dashboard from "../views/Dashboard.vue";
import DeviceSettings from "../views/DeviceSettings.vue";
import DataDownloading from "../views/DataDownloading.vue";

const routes = [
  { path: "/", component: Dashboard },
  { path: "/device-settings", component: DeviceSettings },
  { path: "/data-downloading", component: DataDownloading },
  {
    path: "/firebase-test",
    name: "firebaseTest",
    component: FirebaseTestView,
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
