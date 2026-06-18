import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// Quasar
import {
  Quasar,
  QDialog,
  QCard,
  QCardSection,
  QCardActions,
  QBtn,
  QDate,
  ClosePopup,
  QSelect
} from 'quasar'
import 'quasar/src/css/index.sass'
import '@quasar/extras/material-icons/material-icons.css'

const app = createApp(App)
app.use(router)
app.use(Quasar, {
  components: {
    QDialog,
    QCard,
    QCardSection,
    QCardActions,
    QBtn,
    QDate,
    QSelect
  },
  directives: {
    ClosePopup
  }
})

app.mount('#app')