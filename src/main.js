import { createApp } from "vue";
import App from "./App.vue";
import PrimeVue from "primevue/config";
import Aura from "@primeuix/themes/aura";
import { router } from "./router/index";
import ToastService from "primevue/toastservice";

import "primeicons/primeicons.css"; // ← THIS IS CRITICAL FOR ICONS
import { createPinia } from "pinia";

const app = createApp(App);
app.use(createPinia());

app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      prefix: "p",
      darkModeSelector: ".my-app-dark",
      cssLayer: false,
    },
  },
});

app.use(ToastService);

app.use(router);
app.mount("#app");
