<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../api/api'

interface Service {
  id: number
  name: string
  description: string
  duration: number
  category: string
  price: number
}

interface User {
  id: number
  name: string
  plan: string
  reservas_activas: number
}

const route = useRoute()
const router = useRouter()
const userId = route.params.id as string

const services = ref<Service[]>([])
const user = ref<User | null>(null)
const filter = ref('Todos')

// Modal
const showDialog = ref(false)
const selectedService = ref<Service | null>(null)
const selectedDate = ref('')
const selectedTime = ref('')
const loading = ref(false)

const AVATAR_COLORS = ['#4ecdc4', '#e85d75', '#f5a623', '#9b7ede']

const CATEGORIES = [
  { key: 'Todos', icon: '' },
  { key: 'Consultoría', icon: '💼' },
  { key: 'Legal', icon: '⚖️' },
  { key: 'Coaching', icon: '🎯' },
]

onMounted(async () => {
  const [{ data: servicesData }, { data: usersData }] = await Promise.all([
    api.get<Service[]>('/services'),
    api.get<User[]>('/users'),
  ])
  services.value = servicesData
  user.value = usersData.find((u) => u.id === Number(userId)) ?? null
})

const filteredServices = computed(() =>
  filter.value === 'Todos'
    ? services.value
    : services.value.filter((s) => s.category === filter.value)
)

const disponibles = computed(() =>
  user.value ? Math.max(0, 3 - user.value.reservas_activas) : 0
)

const avatarColor = computed(() =>
  user.value ? AVATAR_COLORS[(user.value.id - 1) % AVATAR_COLORS.length] : AVATAR_COLORS[0]
)

const getInitials = (name: string) =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase()

const getShortName = (name: string) => {
  const parts = name.split(' ')
  if (parts.length < 2) return name
  return `${parts[0]} ${parts[1][0]}.`
}

const formatPrice = (price: number) => `$ ${price.toLocaleString('es-CO')}`

const getCategoryIcon = (category: string) => {
  if (category === 'Consultoría') return '💼'
  if (category === 'Legal') return '⚖️'
  if (category === 'Coaching') return '🎯'
  return '📋'
}

const getCategoryIconClass = (category: string) => {
  if (category === 'Consultoría') return 'service-card-icon--consultoria'
  if (category === 'Legal') return 'service-card-icon--legal'
  return 'service-card-icon--coaching'
}

const getCategoryTagClass = (category: string) => {
  if (category === 'Consultoría') return 'service-tag--consultoria'
  if (category === 'Legal') return 'service-tag--legal'
  return 'service-tag--coaching'
}

const abrirModal = (service: Service) => {
  console.log('abrio')
  selectedService.value = service
  selectedDate.value = ''
  selectedTime.value = ''
  showDialog.value = true
}

const confirmarReserva = async () => {
  if (!selectedDate.value || !selectedTime.value || !selectedService.value) {
    alert('Selecciona fecha y hora válidas')
    return
  }
  try {
    loading.value = true
    const fechaISO = new Date(`${selectedDate.value}T${selectedTime.value}:00`).toISOString()
    const { data } = await api.post('/reservations', {
      user_id: userId,
      service_id: selectedService.value.id,
      fecha_inicio: fechaISO,
    })
    alert(`Reserva creada con ID: ${data.id}`)
    showDialog.value = false
    if (user.value) user.value.reservas_activas++
  } catch (err: any) {
    alert(`Error: ${err.response?.data?.message ?? err.message}`)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="services-screen">

    <!-- Header -->
    <header class="services-screen-header">
      <div class="services-screen-header-inner q-px-md">
        <div class="services-screen-header-left">
          <button class="services-back-btn" @click="router.push('/')">←</button>
          <span class="services-screen-brand">ReservasPro</span>
        </div>

        <div v-if="user" class="services-header-user">
          <div class="services-header-avatar" :style="{ backgroundColor: avatarColor }">
            {{ getInitials(user.name) }}
          </div>
          <div style="display: flex; flex-direction: column; min-width: 0">
            <span class="services-header-name">{{ getShortName(user.name) }}</span>
            <span v-if="user.plan === 'premium'" class="services-header-plan">
              ★ Premium
            </span>
          </div>
        </div>
      </div>
      <hr class="services-screen-divider" />
    </header>

    <div class="services-container">

      <!-- Nav actions -->
      <div class="services-nav-actions">
        <button class="services-nav-btn services-nav-btn--outline" @click="router.push('/')">
          ← Inicio
        </button>
        <button class="services-nav-btn services-nav-btn--primary" @click="router.push(`/reservations/${userId}`)">
          Mis reservas →
        </button>
      </div>

      <!-- Banner usuario -->
      <div v-if="user" class="services-user-card q-mb-lg">
        <div class="services-user-card-body">
          <div class="services-user-card-avatar">
            {{ getInitials(user.name) }}
          </div>
          <div class="services-user-card-info">
            <div class="services-user-card-name">{{ user.name }}</div>
            <div class="services-user-card-meta">
              <span>{{ user.reservas_activas }}/3 reservas activas</span>
              <span v-if="user.plan === 'premium'" class="services-user-card-plan">
                ★ Premium
              </span>
            </div>
          </div>
          <div class="services-user-card-stats">
            <div class="services-user-card-stats-label">Disponibles</div>
            <div class="services-user-card-stats-value">{{ disponibles }}</div>
          </div>
        </div>
      </div>

      <!-- Encabezado sección -->
      <div class="services-section-header">
        <h2 class="services-section-title">Servicios</h2>
        <span class="services-section-count">{{ filteredServices.length }} disponibles</span>
      </div>

      <!-- Filtros -->
      <div class="services-filters">
        <button
          v-for="cat in CATEGORIES"
          :key="cat.key"
          class="services-filter-btn"
          :class="filter === cat.key ? 'services-filter-btn--active' : ''"
          @click="filter = cat.key"
        >
          <span v-if="cat.icon">{{ cat.icon }}</span>
          {{ cat.key }}
        </button>
      </div>

      <!-- Lista de servicios -->
      <div
        v-for="service in filteredServices"
        :key="service.id"
        class="service-card"
      >
        <div class="service-card-body">
          <div class="service-card-top">
            <div class="service-card-icon" :class="getCategoryIconClass(service.category)">
              {{ getCategoryIcon(service.category) }}
            </div>
            <div class="service-card-title-wrap">
              <div class="service-card-title">{{ service.name }}</div>
            </div>
            <span class="service-card-price">{{ formatPrice(service.price) }}</span>
          </div>

          <p class="service-card-description">{{ service.description }}</p>

          <div class="service-card-tags">
            <span class="service-tag service-tag--duration">🕐 {{ service.duration }} min</span>
            <span class="service-tag" :class="getCategoryTagClass(service.category)">
              {{ service.category }}
            </span>
          </div>
        </div>

        <div class="service-card-footer">
          <span class="service-card-hint">Toca para ver detalle</span>
          <button class="service-card-reserve" @click="abrirModal(service)">
            Reservar →
          </button>
        </div>
      </div>

    </div>
    
    <!-- Modal de reserva -->
    <q-dialog v-model="showDialog" persistent>
      <q-card class="reservation-modal-card">

        <!-- Header del modal -->
        <q-card-section class="reservation-modal-header row items-center justify-between">
          <span class="reservation-modal-title">Reservar servicio</span>
          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>

        <q-card-section class="reservation-modal-body">

          <!-- Info del servicio -->
          <div v-if="selectedService" class="reservation-modal-service">
            <div class="reservation-modal-service-icon">
              {{ getCategoryIcon(selectedService.category) }}
            </div>
            <div>
              <div class="reservation-modal-service-name">{{ selectedService.name }}</div>
              <div class="reservation-modal-service-price">{{ formatPrice(selectedService.price) }}</div>
            </div>
          </div>

          <!-- Fecha y hora -->
          <div class="reservation-modal-label">Selecciona fecha y hora</div>

          <q-date
            v-model="selectedDate"
            mask="YYYY-MM-DD"
            minimal
            :options="(date) => date >= new Date().toISOString().slice(0, 10)"
            class="q-mb-sm full-width"
          />

          <q-select
            v-model="selectedTime"
            outlined
            label="Hora"
            :options="['07:00','07:30','08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30','18:00','18:30']"
            class="reservation-time-select"
          />

          <p class="reservation-modal-hint">
            Mínimo 2 horas de anticipación · Horario 7:00–19:00 · Sin domingos
          </p>

          <button
            class="reservation-modal-btn-reservar"
            :disabled="loading || !selectedDate || !selectedTime"
            @click="confirmarReserva"
          >
            {{ loading ? 'Guardando...' : 'Reservar →' }}
          </button>

        </q-card-section>

        <div class="reservation-modal-footer">
          <button class="reservation-modal-btn-cancel" v-close-popup>Cancelar</button>
        </div>

      </q-card>
    </q-dialog>

  </div>
</template>

<style scoped>
/* ── Variables ──────────────────────────────────────────── */
:root {
  --rp-bg: #f5f6f8;
  --rp-text: #1a2332;
  --rp-text-muted: #8b95a5;
  --rp-border: #e8ecf0;
  --rp-purple: #7b61ff;
  --rp-purple-dark: #6a4ff0;
  --rp-purple-light: #f0edff;
}

/* ── Screen ─────────────────────────────────────────────── */
.services-screen {
  min-height: 100vh;
  background-color: #f5f6f8;
  padding-bottom: 2rem;
}

.services-container {
  max-width: 680px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* ── Header ─────────────────────────────────────────────── */
.services-screen-header {
  background-color: #fff;
}

.services-screen-header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding-top: 0.875rem;
  padding-bottom: 0.875rem;
}

.services-screen-header-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.services-back-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid #e8ecf0;
  border-radius: 10px;
  background: #fff;
  color: #1a2332;
  font-size: 1.125rem;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.services-back-btn:hover {
  background-color: #f5f6f8;
}

.services-screen-brand {
  font-size: 1.0625rem;
  font-weight: 700;
  color: #1a2332;
  letter-spacing: -0.02em;
}

.services-header-user {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.75rem 0.35rem 0.35rem;
  border: 1px solid #e8ecf0;
  border-radius: 999px;
  background: #fff;
  max-width: 160px;
}

.services-header-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6875rem;
  font-weight: 700;
  flex-shrink: 0;
}

.services-header-name {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #1a2332;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.services-header-plan {
  font-size: 0.6875rem;
  font-weight: 600;
  color: #b45309;
}

.services-screen-divider {
  margin: 0;
  border-color: #e8ecf0;
  opacity: 1;
}

/* ── Nav actions ─────────────────────────────────────────── */
.services-nav-actions {
  display: flex;
  gap: 0.75rem;
  margin: 1rem 0 1.25rem;
}

.services-nav-btn {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.625rem 1rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.services-nav-btn--outline {
  border: 1px solid #e8ecf0;
  background: #fff;
  color: #8b95a5;
}

.services-nav-btn--outline:hover {
  color: #1a2332;
}

.services-nav-btn--primary {
  border: 1px solid #7b61ff;
  background: #f0edff;
  color: #7b61ff;
}

.services-nav-btn--primary:hover {
  background: #e8e2ff;
  color: #6a4ff0;
}

/* ── Banner usuario ──────────────────────────────────────── */
.services-user-card {
  border-radius: 20px;
  background: linear-gradient(135deg, #7b61ff 0%, #6a4ff0 100%);
  overflow: hidden;
  margin-bottom: 1.25rem;
}

.services-user-card-body {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
}

.services-user-card-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.125rem;
  font-weight: 700;
  flex-shrink: 0;
}

.services-user-card-info {
  flex: 1;
  min-width: 0;
}

.services-user-card-name {
  font-size: 1.0625rem;
  font-weight: 700;
  color: #fff;
  margin-bottom: 0.25rem;
}

.services-user-card-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8125rem;
  color: rgba(255, 255, 255, 0.88);
}

.services-user-card-plan {
  font-weight: 600;
}

.services-user-card-stats {
  text-align: center;
  padding: 0.625rem 1rem;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.16);
  min-width: 88px;
  flex-shrink: 0;
}

.services-user-card-stats-label {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.82);
  margin-bottom: 0.15rem;
}

.services-user-card-stats-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #fff;
  line-height: 1;
}

/* ── Sección header ──────────────────────────────────────── */
.services-section-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.services-section-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1a2332;
  margin: 0;
}

.services-section-count {
  font-size: 0.8125rem;
  color: #8b95a5;
}

/* ── Filtros ─────────────────────────────────────────────── */
.services-filters {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.25rem;
  margin-bottom: 1.25rem;
  scrollbar-width: none;
}

.services-filters::-webkit-scrollbar { display: none; }

.services-filter-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.5rem 0.875rem;
  border-radius: 999px;
  border: 1px solid #e8ecf0;
  background: #fff;
  color: #8b95a5;
  font-size: 0.8125rem;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s ease;
}

.services-filter-btn:hover { color: #1a2332; }

.services-filter-btn--active {
  background: #7b61ff;
  border-color: #7b61ff;
  color: #fff;
}

/* ── Service card ────────────────────────────────────────── */
.service-card {
  border: 1px solid #e8ecf0;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 1px 3px rgba(26, 35, 50, 0.04);
  margin-bottom: 0.875rem;
  overflow: hidden;
}

.service-card-body { padding: 1rem 1rem 0.75rem; }

.service-card-top {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.625rem;
}

.service-card-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.service-card-icon--consultoria { background: #e8f4fd; }
.service-card-icon--legal       { background: #f0edff; }
.service-card-icon--coaching    { background: #fef3e8; }

.service-card-title-wrap { flex: 1; min-width: 0; }

.service-card-title {
  font-size: 0.9375rem;
  font-weight: 700;
  color: #1a2332;
  line-height: 1.3;
}

.service-card-price {
  font-size: 0.9375rem;
  font-weight: 700;
  color: #7b61ff;
  white-space: nowrap;
  flex-shrink: 0;
}

.service-card-description {
  font-size: 0.8125rem;
  color: #8b95a5;
  margin-bottom: 0.75rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.service-card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.service-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.625rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.service-tag--duration     { background: #f0f2f5; color: #6b7280; }
.service-tag--consultoria  { background: #e8f4fd; color: #2563eb; }
.service-tag--legal        { background: #f0edff; color: #7b61ff; }
.service-tag--coaching     { background: #fef3e8; color: #d97706; }

.service-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-top: 1px solid #e8ecf0;
  background: #fafbfc;
}

.service-card-hint { font-size: 0.75rem; color: #b0b8c4; }

.service-card-reserve {
  border: none;
  background: none;
  padding: 0;
  font-size: 0.875rem;
  font-weight: 700;
  color: #7b61ff;
  cursor: pointer;
  transition: color 0.2s ease;
}

.service-card-reserve:hover { color: #6a4ff0; }

/* ── Modal ───────────────────────────────────────────────── */
.reservation-modal-card {
  border-radius: 20px !important;
  box-shadow: 0 16px 48px rgba(26, 35, 50, 0.16) !important;
  min-width: 320px;
  max-width: 95vw;
  width: 420px;
}

.reservation-modal-header {
  border-bottom: 1px solid #e8ecf0;
  padding: 1.25rem 1.25rem 1rem;
}

.reservation-modal-title {
  font-size: 1.0625rem;
  font-weight: 700;
  color: #1a2332;
}

.reservation-modal-body { padding: 1.25rem; }

.reservation-modal-service {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem;
  border-radius: 14px;
  background: #f0edff;
  margin-bottom: 1.25rem;
}

.reservation-modal-service-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.125rem;
  flex-shrink: 0;
}

.reservation-modal-service-name {
  font-size: 0.9375rem;
  font-weight: 700;
  color: #1a2332;
  margin-bottom: 0.15rem;
}

.reservation-modal-service-price {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #7b61ff;
}

.reservation-modal-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1a2332;
  margin-bottom: 0.625rem;
}

.reservation-modal-hint {
  font-size: 0.75rem;
  color: #8b95a5;
  margin-top: 0.625rem;
  margin-bottom: 0;
}

.reservation-modal-btn-reservar {
  display: block;
  width: 100%;
  margin-top: 1.25rem;
  padding: 0.875rem 1.25rem;
  border: none;
  border-radius: 14px;
  background: #7b61ff;
  color: #fff;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 0.2s ease, opacity 0.2s ease;
}

.reservation-modal-btn-reservar:hover:not(:disabled) { background: #6a4ff0; }

.reservation-modal-btn-reservar:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.reservation-modal-footer {
  padding: 0 1.25rem 1.25rem;
  display: flex;
  justify-content: center;
}

.reservation-modal-btn-cancel {
  border: none;
  background: none;
  padding: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #8b95a5;
  cursor: pointer;
  transition: color 0.2s ease;
}

.reservation-modal-btn-cancel:hover { color: #1a2332; }

.reservation-time-select {
  border-radius: 12px;
}
</style>