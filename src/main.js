import { createApp } from 'vue'
import App from './App.vue'
import router from './router/index.js' 
import './index.css'
import { auth } from './firebase' 

createApp(App)
  .use(router)   
  .mount('#app')