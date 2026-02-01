import mqtt from "mqtt";

const client = mqtt.connect("mqtt://broker.emqx.io:1883");
const topic = "/landslide/ESP32_LANDSLIDE_01/telemetry";

const message = {
  id: "ESP32_LANDSLIDE_01",
  ts: Date.now(),
  pitch: 5.5,
  roll: 2.1,
  dtof: 10,
  rain1h: 12.5,
  temp: 25.6,
  hum: 60,
  soil: 45,
  lat: 10.776,
  lng: 106.7,
};

client.on("connect", () => {
  console.log("Publisher connected");
  setInterval(() => {
    message.ts = Date.now();
    // distinct values to notice change
    message.pitch = (Math.random() * 10).toFixed(2);
    console.log("Sending:", message);
    client.publish(topic, JSON.stringify(message));
  }, 2000);
});
